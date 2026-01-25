from __future__ import annotations

from functools import wraps
from typing import Any, Callable

from django.contrib.auth import get_user_model
from django.db import DatabaseError, IntegrityError, transaction
from django.utils import timezone

from .errors import raise_db_exception
from .models import (
    AppUser,
    AuditEvent,
    ProgressDocument,
    Project,
    ProjectHodDecision,
    ProjectJoinRequest,
    ProjectMember,
    ProjectProgressUpdate,
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
        created_by=actor,
    )
    return user


@audited_db_write(
    event_type="PROJECT_CREATED",
    entity_type="Project",
    entity_id_getter=lambda project: getattr(project, "id", None),
    details_getter=lambda project, kw: {"status": project.status_id},
    transactional=True,
)
def create_project(*, actor: User, payload: dict[str, Any]) -> Project:
    project = Project.objects.create(
        department=payload["department"],
        mentor_faculty=payload["mentor_faculty"],
        team_leader_student=actor,
        title=payload["title"],
        abstract=payload["abstract"],
        status=payload["status"],
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
    for field in ["mentor_faculty", "title", "abstract", "status"]:
        if field in payload:
            setattr(project, field, payload[field])
    project.save(update_fields=["mentor_faculty", "title", "abstract", "status", "updated_at"])
    return project


@audited_db_write(
    event_type="HOD_DECISION",
    entity_type="ProjectHodDecision",
    entity_id_getter=lambda decision: getattr(decision, "id", None),
    details_getter=lambda decision, kw: {"project_id": kw["project"].id, "decision": kw["decision"]},
    transactional=True,
)
def create_hod_decision(*, actor: User, project: Project, decision: str, reason: str | None) -> ProjectHodDecision:
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
    join_request.status = status
    join_request.reviewed_by = actor
    join_request.reviewed_at = timezone.now()
    join_request.review_note = note or None
    join_request.save(update_fields=["status", "reviewed_by", "reviewed_at", "review_note"])
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
