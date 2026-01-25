from __future__ import annotations

from dataclasses import dataclass
from typing import Callable, Iterable

from django.contrib.auth import get_user_model

from .models import Project, ProjectJoinRequest, ProjectProgressUpdate, Role

User = get_user_model()


Action = str


@dataclass(frozen=True)
class ActionRule:
    action: Action
    roles: frozenset[str]
    predicate: Callable[[User, object | None], bool] | None = None


def _role_code(user: User) -> str | None:
    profile = getattr(user, "app_profile", None)
    if not profile:
        return None
    return getattr(profile, "role_code_id", None) or getattr(profile.role_code, "role_code", None)


def _is_project_leader(user: User, obj: object | None) -> bool:
    if isinstance(obj, Project):
        return obj.team_leader_student_id == user.id
    if isinstance(obj, ProjectProgressUpdate):
        return obj.project.team_leader_student_id == user.id
    return False


def _can_review_join_request(user: User, obj: object | None) -> bool:
    if not isinstance(obj, ProjectJoinRequest):
        return False
    role_code = _role_code(user)
    if role_code == Role.STUDENT:
        return obj.project.team_leader_student_id == user.id
    if role_code == Role.FACULTY:
        return obj.project.mentor_faculty_id == user.id
    return False


RULES: dict[Action, ActionRule] = {
    # Auth
    "auth.login": ActionRule(action="auth.login", roles=frozenset()),

    # Users
    "users.create": ActionRule(action="users.create", roles=frozenset({Role.ADMIN, Role.FACULTY})),
    "admin.users.read": ActionRule(action="admin.users.read", roles=frozenset({Role.ADMIN})),

    # Student projects
    "student.project.create": ActionRule(action="student.project.create", roles=frozenset({Role.STUDENT})),
    "student.project.read": ActionRule(action="student.project.read", roles=frozenset({Role.STUDENT})),
    "student.project.update": ActionRule(action="student.project.update", roles=frozenset({Role.STUDENT}), predicate=_is_project_leader),

    # HOD
    "hod.projects.read": ActionRule(action="hod.projects.read", roles=frozenset({Role.HOD})),
    "hod.decision.write": ActionRule(action="hod.decision.write", roles=frozenset({Role.HOD})),
    "hod.lifecycle.read": ActionRule(action="hod.lifecycle.read", roles=frozenset({Role.HOD})),
    "hod.approvals.read": ActionRule(action="hod.approvals.read", roles=frozenset({Role.HOD})),
    "hod.progress.read": ActionRule(action="hod.progress.read", roles=frozenset({Role.HOD})),

    # Join requests
    "join_request.create": ActionRule(action="join_request.create", roles=frozenset({Role.STUDENT})),
    "join_request.review": ActionRule(
        action="join_request.review",
        roles=frozenset({Role.STUDENT, Role.FACULTY}),
        predicate=_can_review_join_request,
    ),
    "join_request.cancel": ActionRule(action="join_request.cancel", roles=frozenset({Role.STUDENT})),
    "student.join_requests.read": ActionRule(action="student.join_requests.read", roles=frozenset({Role.STUDENT})),

    # Progress updates (leader-only posting)
    "progress.create": ActionRule(action="progress.create", roles=frozenset({Role.STUDENT}), predicate=_is_project_leader),
    "progress.read": ActionRule(action="progress.read", roles=frozenset({Role.STUDENT}), predicate=_is_project_leader),
    "progress.document.upload": ActionRule(action="progress.document.upload", roles=frozenset({Role.STUDENT}), predicate=_is_project_leader),

    # Admin dashboards
    "admin.projects.read": ActionRule(action="admin.projects.read", roles=frozenset({Role.ADMIN})),
    "admin.audit.read": ActionRule(action="admin.audit.read", roles=frozenset({Role.ADMIN})),

    # Faculty dashboards
    "faculty.projects.approved.read": ActionRule(action="faculty.projects.approved.read", roles=frozenset({Role.FACULTY})),
    "faculty.projects.mentored.read": ActionRule(action="faculty.projects.mentored.read", roles=frozenset({Role.FACULTY})),
    "faculty.comments.read": ActionRule(action="faculty.comments.read", roles=frozenset({Role.FACULTY})),
    "faculty.progress.read": ActionRule(action="faculty.progress.read", roles=frozenset({Role.FACULTY})),

    # Student dashboards
    "student.projects.approved.read": ActionRule(action="student.projects.approved.read", roles=frozenset({Role.STUDENT})),
    "student.own.progress.read": ActionRule(action="student.own.progress.read", roles=frozenset({Role.STUDENT})),
}


def is_allowed(*, user: User, action: Action, obj: object | None = None) -> bool:
    if not user or not getattr(user, "is_authenticated", False):
        return False
    rule = RULES.get(action)
    if rule is None:
        return False
    if not rule.roles:
        return True
    role_code = _role_code(user)
    if role_code is None or role_code not in rule.roles:
        return False
    if rule.predicate is None:
        return True
    return rule.predicate(user, obj)


def all_actions() -> Iterable[Action]:
    return RULES.keys()
