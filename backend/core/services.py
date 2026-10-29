from __future__ import annotations

from functools import wraps
from typing import Any, Callable
import uuid

from django.contrib.auth import get_user_model
from django.db import DatabaseError, IntegrityError, transaction
from django.db.models import Q
from django.utils import timezone

from .config import MAX_PROJECT_MEMBERS
from .errors import BadRequestError, ConflictError, ForbiddenError, raise_db_exception
from .models import (
    AppUser,
    AuditEvent,
    Department,
    ProgressDocument,
    Project,
    ProjectFacultyReview,
    ProjectHodDecision,
    ProjectJoinRequest,
    ProjectMember,
    ProjectProgressUpdate,
    ProjectStatus,
    ProjectStatusHistory,
    ProjectStatusTransition,
    Role,
    WorkflowConfiguration,
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
    should_audit: Callable[[object, dict[str, Any]], bool] | None = None,
    transactional: bool = True,
):
    def decorator(func):
        @wraps(func)
        def wrapper(*, actor: User, **kwargs):
            try:
                if transactional:
                    with transaction.atomic():
                        result = func(actor=actor, **kwargs)
                        if should_audit is None or should_audit(result, kwargs):
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
                if should_audit is None or should_audit(result, kwargs):
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
    should_audit=lambda department, kw: kw["payload"]["before"] != {
        "code": department.code,
        "name": department.name,
        "is_active": department.is_active,
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
    email = payload["email"].strip().lower()
    duplicate_error = "An account with this email already exists."
    try:
        with transaction.atomic():
            if User.objects.filter(Q(username__iexact=email) | Q(email__iexact=email)).exists():
                raise ConflictError(duplicate_error)
            user = User.objects.create_user(
                username=email,
                email=email,
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
    except ConflictError:
        raise
    except IntegrityError as exc:
        if User.objects.filter(Q(username__iexact=email) | Q(email__iexact=email)).exists():
            raise ConflictError(duplicate_error) from exc
        raise_db_exception(exc)
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
    event_type="USER_STATUS_CHANGED",
    entity_type="AppUser",
    entity_id_getter=lambda profile: profile.id,
    details_getter=lambda profile, kw: {
        "user_id": profile.user_id,
        "role_code": profile.role_code_id,
        "before_active": kw["status_change"]["before_active"],
        "after_active": profile.is_active,
    },
    should_audit=lambda profile, kw: kw["status_change"]["changed"],
    transactional=True,
)
def set_user_active(*, actor: User, profile: AppUser, is_active: bool, status_change: dict[str, bool]) -> AppUser:
    profile = AppUser.objects.select_for_update().select_related("user", "role_code", "department").get(pk=profile.pk)
    user = User.objects.select_for_update().get(pk=profile.user_id)
    was_active = bool(profile.is_active and user.is_active)
    status_change["before_active"] = was_active
    status_change["changed"] = profile.is_active != is_active or user.is_active != is_active
    if not is_active and profile.role_code_id == Role.ADMIN:
        # Serialize administrator deactivations so simultaneous requests cannot
        # each observe a different "last" administrator and remove all access.
        Role.objects.select_for_update().get(pk=Role.ADMIN)
        if user.pk == actor.pk:
            raise ConflictError("You cannot deactivate your own administrator account.")
        other_active_admins = AppUser.objects.filter(
            role_code_id=Role.ADMIN,
            is_active=True,
            user__is_active=True,
        ).exclude(user_id=user.pk).count()
        if other_active_admins == 0:
            raise ConflictError("The last active administrator account cannot be deactivated.")
    if is_active and profile.role_code_id == Role.FACULTY and (
        not profile.department_id or not profile.department or not profile.department.is_active
    ):
        raise BadRequestError("Assign an active department before activating a faculty account.")

    user.is_active = is_active
    user.save(update_fields=["is_active"])
    profile.is_active = is_active
    if status_change["changed"]:
        profile.auth_version += 1
        profile.save(update_fields=["is_active", "auth_version"])
    else:
        profile.save(update_fields=["is_active"])
    # Keep the already-loaded relation in sync for serializers in this request.
    profile.user = user
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

    workflow = WorkflowConfiguration.objects.first()
    project_status = payload.get("status") or ProjectStatus.objects.get(status_code=ProjectStatus.SUBMITTED)
    if project_status.status_code not in (ProjectStatus.DRAFT, ProjectStatus.SUBMITTED):
        raise BadRequestError({"status": "New projects may only be created as DRAFT or SUBMITTED."})

    project = Project.objects.create(
        department=department,
        mentor_faculty=mentor,
        team_leader_student=actor,
        title=payload["title"],
        abstract=payload["abstract"],
        status=project_status,
        submitted_at=timezone.now() if project_status.status_code == ProjectStatus.SUBMITTED else None,
        workflow_review_stages=workflow.review_stages if workflow else None,
        workflow_require_hod_approval=workflow.require_hod_approval if workflow else None,
        workflow_parallel_reviews=workflow.parallel_reviews if workflow else None,
    )
    ProjectMember.objects.get_or_create(project=project, student=actor)
    return project


@audited_db_write(
    event_type="PROJECT_UPDATED",
    entity_type="Project",
    entity_id_getter=lambda project: getattr(project, "id", None),
    details_getter=lambda project, kw: {"status": project.status_id},
)
def update_project(*, actor: User, project: Project, payload: dict[str, Any]) -> Project:
    project = Project.objects.select_for_update().get(pk=project.pk)
    if project.status_id not in (ProjectStatus.DRAFT, ProjectStatus.REJECTED):
        raise ConflictError("Project can no longer be edited.")

    requested_status = payload.get("status")
    if requested_status is not None and (
        requested_status.status_code != ProjectStatus.SUBMITTED
        or project.status_id not in (ProjectStatus.DRAFT, ProjectStatus.REJECTED)
    ):
        raise BadRequestError({"status": "The only allowed student status change is submission."})

    update_fields = []
    for field in ["mentor_faculty", "title", "abstract"]:
        if field in payload:
            setattr(project, field, payload[field])
            update_fields.append(field)
    if update_fields:
        project.save(update_fields=[*update_fields, "updated_at"])
    if requested_status is not None:
        project = transition_project_status(actor=actor, project=project, to_status=ProjectStatus.SUBMITTED)
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
    update_fields = ["status", "updated_at"]
    if to_status == ProjectStatus.SUBMITTED:
        project.submitted_at = timezone.now()
        update_fields.append("submitted_at")
        if from_status_code == ProjectStatus.REJECTED:
            project.review_round += 1
            update_fields.append("review_round")
    if to_status == ProjectStatus.APPROVED and project.approved_at is None:
        project.approved_at = timezone.now()
    if to_status == ProjectStatus.APPROVED:
        update_fields.append("approved_at")
    project.save(update_fields=update_fields)
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
    if project.status_id not in (ProjectStatus.SUBMITTED, ProjectStatus.UNDER_REVIEW):
        raise ConflictError("Project is not awaiting a decision.")
    decision_statuses = {
        ProjectHodDecision.APPROVE: ProjectStatus.APPROVED,
        ProjectHodDecision.REJECT: ProjectStatus.REJECTED,
    }
    target_status = decision_statuses.get(decision)
    if target_status is None:
        raise ConflictError(f"Invalid HOD decision: {decision}")
    if decision == ProjectHodDecision.REJECT and not (reason or "").strip():
        raise BadRequestError({"reason": "A reason is required when rejecting a project."})

    configured_workflow = project.workflow_review_stages is not None
    if configured_workflow:
        if not project.workflow_require_hod_approval:
            raise ConflictError("This project's workflow does not require HOD approval.")
        if ProjectHodDecision.objects.filter(project=project, review_round=project.review_round).exists():
            raise ConflictError("An HOD decision has already been recorded for this project.")
        approved_stages = ProjectFacultyReview.objects.filter(
            project=project,
            review_round=project.review_round,
            decision=ProjectFacultyReview.APPROVE,
        ).count()
        faculty_review_complete = approved_stages == project.workflow_review_stages
        if decision == ProjectHodDecision.APPROVE and not faculty_review_complete and not project.workflow_parallel_reviews:
            raise ConflictError("Faculty review stages must be completed before HOD approval.")

        if project.status_id == ProjectStatus.SUBMITTED:
            transition_project_status(
                actor=actor,
                project=project,
                to_status=ProjectStatus.UNDER_REVIEW,
                note="Moved to review before HOD decision",
            )
        hod_decision = ProjectHodDecision.objects.create(
            project=project,
            hod=actor,
            review_round=project.review_round,
            decision=decision,
            reason=reason or None,
        )
        if decision == ProjectHodDecision.REJECT:
            transition_project_status(actor=actor, project=project, to_status=ProjectStatus.REJECTED, note=reason)
        elif faculty_review_complete:
            transition_project_status(actor=actor, project=project, to_status=ProjectStatus.APPROVED, note=reason)
        return hod_decision

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
        review_round=project.review_round,
        decision=decision,
        reason=reason or None,
    )


@audited_db_write(
    event_type="FACULTY_PROJECT_REVIEW",
    entity_type="ProjectFacultyReview",
    entity_id_getter=lambda review: review.id,
    details_getter=lambda review, _kw: {
        "project_id": review.project_id,
        "stage": review.stage,
        "decision": review.decision,
    },
    transactional=True,
)
def create_faculty_project_review(*, actor: User, project: Project, decision: str, reason: str | None) -> ProjectFacultyReview:
    project = Project.objects.select_for_update().get(pk=project.pk)
    actor_profile = getattr(actor, "app_profile", None)
    if (
        not actor_profile
        or actor_profile.role_code_id != Role.FACULTY
        or project.mentor_faculty_id != actor.id
    ):
        raise ForbiddenError("Only the assigned faculty mentor may review this project.")
    if project.workflow_review_stages is None:
        raise ConflictError("This project follows the legacy workflow and has no configured faculty review stages.")
    if project.status_id not in (ProjectStatus.SUBMITTED, ProjectStatus.UNDER_REVIEW):
        raise ConflictError("Faculty review is only available while the project is under review.")

    approved_stages = ProjectFacultyReview.objects.filter(
        project=project,
        review_round=project.review_round,
        decision=ProjectFacultyReview.APPROVE,
    ).count()
    current_stage = approved_stages + 1
    if current_stage > project.workflow_review_stages:
        raise ConflictError("All configured faculty review stages are already complete.")

    review = ProjectFacultyReview.objects.create(
        project=project,
        faculty=actor,
        stage=current_stage,
        review_round=project.review_round,
        decision=decision,
        reason=reason or None,
    )
    if project.status_id == ProjectStatus.SUBMITTED:
        transition_project_status(actor=actor, project=project, to_status=ProjectStatus.UNDER_REVIEW, note="Faculty review started")
    if decision == ProjectFacultyReview.REJECT:
        transition_project_status(actor=actor, project=project, to_status=ProjectStatus.REJECTED, note=reason)
    elif current_stage == project.workflow_review_stages:
        hod_approved = ProjectHodDecision.objects.filter(
            project=project,
            review_round=project.review_round,
            decision=ProjectHodDecision.APPROVE,
        ).exists()
        if not project.workflow_require_hod_approval or (project.workflow_parallel_reviews and hod_approved):
            transition_project_status(actor=actor, project=project, to_status=ProjectStatus.APPROVED, note=reason)
    return review


@audited_db_write(
    event_type="JOIN_REQUEST_CREATED",
    entity_type="ProjectJoinRequest",
    entity_id_getter=lambda jr: getattr(jr, "id", None),
    details_getter=lambda jr, kw: {"project_id": kw["project"].id},
)
def create_join_request(*, actor: User, project: Project) -> ProjectJoinRequest:
    project = Project.objects.select_for_update().get(pk=project.pk)
    student = User.objects.select_for_update().get(pk=actor.pk)
    profile = AppUser.objects.select_for_update().select_related("department", "role_code").filter(user_id=student.pk).first()
    if not student.is_active or not profile or not profile.is_active or profile.role_code_id != Role.STUDENT:
        raise ConflictError("Only an active student account can request to join a project.")
    if project.status_id != ProjectStatus.APPROVED:
        raise ConflictError("Join requests can only be submitted for approved projects.")
    if profile.department_id != project.department_id:
        raise ConflictError("The student must belong to the project's department.")
    if project.team_leader_student_id == actor.id:
        raise ConflictError("The project leader cannot request to join their own project.")
    if Project.objects.select_for_update().filter(team_leader_student=student).exists():
        raise ConflictError("A student who leads a project cannot join another project.")
    active_memberships = list(
        ProjectMember.objects.select_for_update().filter(student=student, left_at__isnull=True)
    )
    if active_memberships:
        raise ConflictError("The student is already an active member of a project.")
    pending_requests = list(
        ProjectJoinRequest.objects.select_for_update().filter(
            project=project,
            student=student,
            status=ProjectJoinRequest.PENDING,
        )
    )
    if pending_requests:
        raise ConflictError("A pending join request already exists.")
    active_member_count = ProjectMember.objects.select_for_update().filter(
        project=project,
        left_at__isnull=True,
    ).count()
    if active_member_count >= MAX_PROJECT_MEMBERS:
        raise ConflictError("The project already has the maximum number of active members.")
    return ProjectJoinRequest.objects.create(
        project=project,
        student=student,
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
    reviewer = User.objects.select_for_update().get(pk=actor.pk)
    profile = AppUser.objects.select_for_update().filter(user_id=reviewer.pk).first()
    can_review = bool(
        reviewer.is_active
        and profile
        and profile.is_active
        and (
            (profile.role_code_id == Role.STUDENT and project.team_leader_student_id == reviewer.id)
            or (profile.role_code_id == Role.FACULTY and project.mentor_faculty_id == reviewer.id)
        )
    )
    if not can_review:
        raise ForbiddenError("Only the project leader or assigned mentor may review this request.")

    if status not in (ProjectJoinRequest.APPROVED, ProjectJoinRequest.REJECTED):
        raise BadRequestError("Invalid join request review status.")

    if project.status_id != ProjectStatus.APPROVED:
        raise ConflictError("Join requests can only be reviewed while the project is approved.")

    student = User.objects.select_for_update().get(pk=join_request.student_id)
    student_profile = AppUser.objects.select_for_update().select_related("department").filter(user_id=student.pk).first()
    if status == ProjectJoinRequest.APPROVED:
        if (
            not student.is_active
            or not student_profile
            or not student_profile.is_active
            or student_profile.role_code_id != Role.STUDENT
            or student_profile.department_id != project.department_id
        ):
            raise ConflictError("The requesting student is no longer eligible to join this project.")
        active_memberships = list(
            ProjectMember.objects.select_for_update().filter(student=student, left_at__isnull=True)
        )
        if active_memberships:
            raise ConflictError("The requesting student is already an active member of a project.")
        active_member_count = ProjectMember.objects.select_for_update().filter(
            project=project,
            left_at__isnull=True,
        ).count()
        if active_member_count >= MAX_PROJECT_MEMBERS:
            raise ConflictError("The project already has the maximum number of active members.")

    join_request.status = status
    join_request.reviewed_by = reviewer
    join_request.reviewed_at = timezone.now()
    join_request.review_note = note or None
    join_request.save(update_fields=["status", "reviewed_by", "reviewed_at", "review_note"])
    if status == ProjectJoinRequest.APPROVED:
        member, created = ProjectMember.objects.get_or_create(project=project, student=student)
        if not created and member.left_at is not None:
            member.left_at = None
            member.joined_at = timezone.now()
            member.save(update_fields=["left_at", "joined_at"])
    return join_request


@audited_db_write(
    event_type="JOIN_REQUEST_CANCELLED",
    entity_type="ProjectJoinRequest",
    entity_id_getter=lambda jr: getattr(jr, "id", None),
    transactional=True,
)
def cancel_join_request(*, actor: User, join_request: ProjectJoinRequest) -> ProjectJoinRequest:
    join_request = ProjectJoinRequest.objects.select_for_update().get(pk=join_request.pk)
    requester = User.objects.select_for_update().get(pk=actor.pk)
    if join_request.student_id != requester.id:
        raise ForbiddenError("Only the requesting student can cancel this request.")
    if join_request.status != ProjectJoinRequest.PENDING:
        raise ConflictError("Only pending join requests can be cancelled.")
    profile = AppUser.objects.select_for_update().filter(user_id=requester.pk).first()
    if not requester.is_active or not profile or not profile.is_active or profile.role_code_id != Role.STUDENT:
        raise ForbiddenError("Only an active requesting student can cancel this request.")
    join_request.status = ProjectJoinRequest.CANCELLED
    join_request.reviewed_by = requester
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
    project = Project.objects.select_for_update().get(pk=project.pk)
    student = User.objects.select_for_update().get(pk=actor.pk)
    profile = AppUser.objects.select_for_update().filter(user_id=student.pk).first()
    if (
        not student.is_active
        or not profile
        or not profile.is_active
        or profile.role_code_id != Role.STUDENT
        or project.team_leader_student_id != student.id
    ):
        raise ForbiddenError("Only the active student project leader can add progress updates.")
    if project.status_id != ProjectStatus.APPROVED:
        raise ConflictError("Progress updates are only allowed for approved projects.")
    return ProjectProgressUpdate.objects.create(
        project=project,
        updated_by_student=student,
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
    progress_update = ProjectProgressUpdate.objects.select_for_update().get(pk=progress_update.pk)
    project = Project.objects.select_for_update().get(pk=progress_update.project_id)
    student = User.objects.select_for_update().get(pk=actor.pk)
    profile = AppUser.objects.select_for_update().filter(user_id=student.pk).first()
    if (
        not student.is_active
        or not profile
        or not profile.is_active
        or profile.role_code_id != Role.STUDENT
        or project.team_leader_student_id != student.id
    ):
        raise ForbiddenError("Only the active student project leader can add project documents.")
    if project.status_id != ProjectStatus.APPROVED:
        raise ConflictError("Documents can only be added to progress updates for approved projects.")
    original_filename = payload["original_filename"]
    storage_path = f"progress/{project.id}/{progress_update.id}/{uuid.uuid4().hex}_{original_filename}"
    return ProgressDocument.objects.create(
        progress_update=progress_update,
        storage_path=storage_path,
        original_filename=original_filename,
        mime_type=payload.get("mime_type"),
        byte_size=payload.get("byte_size"),
    )
