from __future__ import annotations

from functools import wraps
from typing import Any, Callable

from django.contrib.auth import get_user_model
from django.db import DatabaseError, IntegrityError, transaction
from django.utils import timezone

from .errors import BadRequestError, ConflictError, ForbiddenError, raise_db_exception
from .models import (
    AppUser,
    AuditEvent,
    Department,
    ProgressDocument,
    Project,
    ProjectHodDecision,
    ProjectJoinRequest,
    ProjectMember,
    ProjectProgressUpdate,
    ProjectStatus,
    ProjectStatusHistory,
    ProjectStatusTransition,
    Role,
)

User = get_user_model()


def _audit_write(*, actor: User | None, event_type: str, entity_type: str, entity_id: int | None, details: dict | None = None) -> None:
    AuditEvent.objects.create(
        actor=actor,
        event_type=event_type,
        entity_type=entity_type,
        entity_id=entity_id,
        details_json={"actor_user_id": getattr(actor, "id", None), **(details or {})} if actor else (details or None),
    )


def audited_db_write(
    *,
    event_type: str,
    entity_type: str,
    entity_id_getter: Callable[[object], int | None],
    details_getter: Callable[[object, dict[str, Any]], dict[str, Any] | None] | None = None,
    transactional: bool = True,
):
    def decorator(func):
        @wraps(func)
        def wrapper(*, actor: User, **kwargs):
            try:
                if transactional:
                    with transaction.atomic():
                        result = func(actor=actor, **kwargs)
                        details = details_getter(result, kwargs) if details_getter else None
                        _audit_write(
                            actor=actor,
                            event_type=event_type,
                            entity_type=entity_type,
                            entity_id=entity_id_getter(result),
                            details=details,
                        )
                        return result

                result = func(actor=actor, **kwargs)
                details = details_getter(result, kwargs) if details_getter else None
                _audit_write(
                    actor=actor,
                    event_type=event_type,
                    entity_type=entity_type,
                    entity_id=entity_id_getter(result),
                    details=details,
                )
                return result
            except Exception as exc:
                raise_db_exception(exc)

        return wrapper

    return decorator


@audited_db_write(
    event_type="USER_CREATED",
    entity_type="AppUser",
    entity_id_getter=lambda user: getattr(user, "id", None),
    details_getter=lambda user, kw: {"username": user.username, "role_code": kw["payload"]["role_code"].role_code},
    transactional=True,
)
def create_user(*, actor: User, payload: dict[str, Any]) -> User:
    department = payload.get("department")
    if department is not None:
        department = Department.objects.select_for_update().get(pk=department.pk)
        if not department.is_active:
            raise BadRequestError("Choose an active department.")
    user = User.objects.create_user(
        username=payload["username"],
        email=payload.get("email", ""),
        password=payload["password"],
        first_name=payload.get("first_name", ""),
        last_name=payload.get("last_name", ""),
    )
    AppUser.objects.create(
        user=user,
        role_code=payload["role_code"],
        department=department,
        created_by=actor,
    )
    return user


@audited_db_write(
    event_type="DEPARTMENT_CREATED",
    entity_type="Department",
    entity_id_getter=lambda department: department.id,
    details_getter=lambda department, _kw: {
        "code": department.code,
        "name": department.name,
        "is_active": department.is_active,
    },
    transactional=True,
)
def create_department(*, actor: User, payload: dict[str, Any]) -> Department:
    return Department.objects.create(**payload)


@audited_db_write(
    event_type="DEPARTMENT_UPDATED",
    entity_type="Department",
    entity_id_getter=lambda department: department.id,
    details_getter=lambda department, kw: {
        "before": kw["payload"]["before"],
        "after": {
            "code": department.code,
            "name": department.name,
            "is_active": department.is_active,
        },
    },
    transactional=True,
)
def update_department(*, actor: User, department: Department, payload: dict[str, Any]) -> Department:
    department = Department.objects.select_for_update().get(pk=department.pk)
    before = {
        "code": department.code,
        "name": department.name,
        "is_active": department.is_active,
    }
    for field in ("code", "name", "is_active"):
        if field in payload:
            setattr(department, field, payload[field])
    department.save(update_fields=["code", "name", "is_active"])
    # The audit decorator receives the kwargs, so retain the prior values there.
    payload["before"] = before
    return department


def create_user_public(*, payload: dict[str, Any]) -> User:
    """Create a user from a public (unauthenticated) context.

    Note: this intentionally does not create an audit event because there is no authenticated actor.
    """
    try:
        with transaction.atomic():
            user = User.objects.create_user(
                username=payload["username"],
                email=payload.get("email", ""),
                password=payload["password"],
                first_name=payload.get("first_name", ""),
                last_name=payload.get("last_name", ""),
            )
            AppUser.objects.create(
                user=user,
                role_code=payload["role_code"],
                department=payload.get("department"),
                created_by=None,
            )
            return user
    except Exception as exc:
        raise_db_exception(exc)


@audited_db_write(
    event_type="USER_DEPARTMENT_ASSIGNED",
    entity_type="AppUser",
    entity_id_getter=lambda profile: profile.id,
    details_getter=lambda profile, kw: {"user_id": profile.user_id, "department_id": profile.department_id},
    transactional=True,
)
def assign_user_department(*, actor: User, profile: AppUser, department) -> AppUser:
    profile = AppUser.objects.select_for_update().select_related("role_code").get(pk=profile.pk)
    if profile.role_code_id == Role.ADMIN:
        raise BadRequestError("Administrator accounts do not receive a department.")
    if profile.department_id is not None:
        raise ConflictError("This account already has a department assigned.")
    if not department.is_active:
        raise BadRequestError("Choose an active department.")
    profile.department = department
    profile.save(update_fields=["department"])
    return profile


@audited_db_write(
    event_type="PROJECT_CREATED",
    entity_type="Project",
    entity_id_getter=lambda project: getattr(project, "id", None),
    details_getter=lambda project, kw: {"status": project.status_id},
    transactional=True,
)
def create_project(*, actor: User, payload: dict[str, Any]) -> Project:
    profile = getattr(actor, "app_profile", None)
    department = profile.department if profile and profile.department and profile.department.is_active else None
    if department is None:
        raise BadRequestError("Assign an active department before creating a project.")

    mentor = payload["mentor_faculty"]
    mentor_profile = getattr(mentor, "app_profile", None)
    if (
        not mentor_profile
        or mentor_profile.role_code_id != "FACULTY"
        or mentor_profile.department_id != department.id
        or not mentor_profile.is_active
        or not mentor.is_active
    ):
        raise BadRequestError("The selected mentor must be active faculty in your department.")

    project = Project.objects.create(
        department=department,
        mentor_faculty=mentor,
        team_leader_student=actor,
        title=payload["title"],
        abstract=payload["abstract"],
        status=ProjectStatus.objects.get(status_code=ProjectStatus.SUBMITTED),
        submitted_at=timezone.now(),
    )
    ProjectMember.objects.create(project=project, student=actor)
    return project


@audited_db_write(
    event_type="PROJECT_UPDATED",
    entity_type="Project",
    entity_id_getter=lambda project: getattr(project, "id", None),
    details_getter=lambda project, kw: {"status": project.status_id},
)
def update_project(*, actor: User, project: Project, payload: dict[str, Any]) -> Project:
    update_fields = []
    for field in ["mentor_faculty", "title", "abstract"]:
        if field in payload:
            setattr(project, field, payload[field])
            update_fields.append(field)
    if update_fields:
        project.save(update_fields=[*update_fields, "updated_at"])
    return project


def transition_project_status(*, actor: User, project: Project, to_status: str, note: str | None = None) -> Project:
    """Validate and persist one allowed status transition and its history row."""
    project = Project.objects.select_for_update().get(pk=project.pk)
    from_status = project.status
    from_status_code = project.status_id
    target_status = ProjectStatus.objects.get(status_code=to_status)
    allowed = ProjectStatusTransition.objects.filter(
        from_status=from_status,
        to_status=target_status,
    ).exists()
    if not allowed:
        raise ConflictError(f"Invalid project status transition: {from_status_code} -> {to_status}")

    project.status = target_status
    if to_status == ProjectStatus.APPROVED and project.approved_at is None:
        project.approved_at = timezone.now()
    project.save(update_fields=["status", "approved_at", "updated_at"])
    ProjectStatusHistory.objects.create(
        project=project,
        from_status=from_status,
        to_status=target_status,
        changed_by=actor,
        note=note or None,
    )
    return project


@audited_db_write(
    event_type="HOD_DECISION",
    entity_type="ProjectHodDecision",
    entity_id_getter=lambda decision: getattr(decision, "id", None),
    details_getter=lambda decision, kw: {"project_id": kw["project"].id, "decision": kw["decision"]},
    transactional=True,
)
def create_hod_decision(*, actor: User, project: Project, decision: str, reason: str | None) -> ProjectHodDecision:
    project = Project.objects.select_for_update().get(pk=project.pk)
    actor_profile = getattr(actor, "app_profile", None)
    if (
        not actor_profile
        or actor_profile.role_code_id != Role.HOD
        or actor_profile.department_id != project.department_id
    ):
        raise ForbiddenError("Only the project's department HOD may decide this project.")
    decision_statuses = {
        ProjectHodDecision.APPROVE: ProjectStatus.APPROVED,
        ProjectHodDecision.REJECT: ProjectStatus.REJECTED,
    }
    target_status = decision_statuses.get(decision)
    if target_status is None:
        raise ConflictError(f"Invalid HOD decision: {decision}")

    # The current workflow permits a HOD to decide on SUBMITTED items. Record
    # the implicit review entry before applying the terminal decision.
    if project.status_id == ProjectStatus.SUBMITTED:
        transition_project_status(
            actor=actor,
            project=project,
            to_status=ProjectStatus.UNDER_REVIEW,
            note="Moved to review before HOD decision",
        )
    transition_project_status(actor=actor, project=project, to_status=target_status, note=reason)

    return ProjectHodDecision.objects.create(
        project=project,
        hod=actor,
        decision=decision,
        reason=reason or None,
    )


@audited_db_write(
    event_type="JOIN_REQUEST_CREATED",
    entity_type="ProjectJoinRequest",
    entity_id_getter=lambda jr: getattr(jr, "id", None),
    details_getter=lambda jr, kw: {"project_id": kw["project"].id},
)
def create_join_request(*, actor: User, project: Project) -> ProjectJoinRequest:
    project = Project.objects.select_for_update().get(pk=project.pk)
    profile = getattr(actor, "app_profile", None)
    if not profile or profile.role_code_id != Role.STUDENT:
        raise ForbiddenError("Only students may request to join a project.")
    if project.status_id != "APPROVED":
        raise ConflictError("Join requests are only allowed for approved projects.")
    if project.team_leader_student_id == actor.id:
        raise ConflictError("The project leader cannot request to join their own project.")
    if ProjectMember.objects.filter(project=project, student=actor, left_at__isnull=True).exists():
        raise ConflictError("You are already an active member of this project.")
    if ProjectJoinRequest.objects.filter(project=project, student=actor, status=ProjectJoinRequest.PENDING).exists():
        raise ConflictError("A pending join request already exists.")
    return ProjectJoinRequest.objects.create(
        project=project,
        student=actor,
    )


@audited_db_write(
    event_type="JOIN_REQUEST_REVIEWED",
    entity_type="ProjectJoinRequest",
    entity_id_getter=lambda jr: getattr(jr, "id", None),
    details_getter=lambda jr, kw: {"status": kw["status"]},
    transactional=True,
)
def review_join_request(*, actor: User, join_request: ProjectJoinRequest, status: str, note: str | None) -> ProjectJoinRequest:
    join_request = ProjectJoinRequest.objects.select_for_update().select_related("project").get(pk=join_request.pk)
    if join_request.status != ProjectJoinRequest.PENDING:
        raise ConflictError("Only pending join requests can be reviewed.")

    project = Project.objects.select_for_update().get(pk=join_request.project_id)
    profile = getattr(actor, "app_profile", None)
    can_review = bool(
        profile
        and (
            (profile.role_code_id == Role.STUDENT and project.team_leader_student_id == actor.id)
            or (profile.role_code_id == Role.FACULTY and project.mentor_faculty_id == actor.id)
        )
    )
    if not can_review:
        raise ForbiddenError("Only the project leader or assigned mentor may review this request.")

    if status not in (ProjectJoinRequest.APPROVED, ProjectJoinRequest.REJECTED):
        raise BadRequestError("Invalid join request review status.")

    if status == ProjectJoinRequest.APPROVED:
        if project.status_id != ProjectStatus.APPROVED:
            raise ConflictError("Join requests can only be approved for approved projects.")
        if ProjectMember.objects.filter(student=join_request.student, left_at__isnull=True).exists():
            raise ConflictError("The student already has an active project membership.")
        if ProjectMember.objects.filter(project=project, left_at__isnull=True).count() >= 4:
            raise ConflictError("The project already has the maximum number of active members.")

    join_request.status = status
    join_request.reviewed_by = actor
    join_request.reviewed_at = timezone.now()
    join_request.review_note = note or None
    join_request.save(update_fields=["status", "reviewed_by", "reviewed_at", "review_note"])
    if status == ProjectJoinRequest.APPROVED:
        member = ProjectMember.objects.filter(project=project, student=join_request.student).first()
        if member:
            member.left_at = None
            member.joined_at = timezone.now()
            member.save(update_fields=["left_at", "joined_at"])
        else:
            ProjectMember.objects.create(project=project, student=join_request.student)
    return join_request


@audited_db_write(
    event_type="JOIN_REQUEST_CANCELLED",
    entity_type="ProjectJoinRequest",
    entity_id_getter=lambda jr: getattr(jr, "id", None),
    transactional=True,
)
def cancel_join_request(*, actor: User, join_request: ProjectJoinRequest) -> ProjectJoinRequest:
    join_request.status = ProjectJoinRequest.CANCELLED
    join_request.reviewed_by = actor
    join_request.reviewed_at = timezone.now()
    join_request.save(update_fields=["status", "reviewed_by", "reviewed_at"])
    return join_request


@audited_db_write(
    event_type="PROGRESS_UPDATE_CREATED",
    entity_type="ProjectProgressUpdate",
    entity_id_getter=lambda p: getattr(p, "id", None),
    details_getter=lambda p, kw: {"project_id": kw["project"].id, "percent_complete": p.percent_complete},
    transactional=True,
)
def create_progress_update(*, actor: User, project: Project, payload: dict[str, Any]) -> ProjectProgressUpdate:
    return ProjectProgressUpdate.objects.create(
        project=project,
        updated_by_student=actor,
        percent_complete=payload["percent_complete"],
        steps_completed=payload["steps_completed"],
    )


@audited_db_write(
    event_type="PROGRESS_DOCUMENT_ADDED",
    entity_type="ProgressDocument",
    entity_id_getter=lambda d: getattr(d, "id", None),
    details_getter=lambda d, kw: {"progress_update_id": kw["progress_update"].id},
    transactional=True,
)
def add_progress_document(*, actor: User, progress_update: ProjectProgressUpdate, payload: dict[str, Any]) -> ProgressDocument:
    return ProgressDocument.objects.create(
        progress_update=progress_update,
        storage_path=payload["storage_path"],
        original_filename=payload["original_filename"],
        mime_type=payload.get("mime_type"),
        byte_size=payload.get("byte_size"),
    )
