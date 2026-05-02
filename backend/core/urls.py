from __future__ import annotations

from django.urls import re_path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    AdminAuditEventsView,
    AdminProjectsView,
    AdminUsersView,
    FacultyApprovedProjectsView,
    FacultyMentoredProjectsView,
    FacultyProjectCommentsView,
    FacultyProjectProgressView,
    HealthView,
    HodApprovalsView,
    HodDecisionView,
    HodLifecycleView,
    HodProgressView,
    HodSubmittedProjectsView,
    JoinRequestApproveView,
    JoinRequestCancelView,
    JoinRequestCreateView,
    JoinRequestRejectView,
    LoginView,
    RegisterView,
    ProgressDocumentUploadView,
    ProgressUpdateView,
    StudentApprovedProjectsView,
    StudentJoinRequestsView,
    StudentOwnProjectProgressView,
    StudentProjectUpdateView,
    StudentProjectView,
    UsersView,
)

urlpatterns = [
    re_path(r"^$", HealthView.as_view(), name="health"),

    re_path(r"^auth/login/?$", LoginView.as_view(), name="login"),
    re_path(r"^auth/register/?$", RegisterView.as_view(), name="register"),
    re_path(r"^auth/token/refresh/?$", TokenRefreshView.as_view(), name="token-refresh"),
    re_path(r"^users/?$", UsersView.as_view(), name="user-create"),


    re_path(r"^student/project/?$", StudentProjectView.as_view(), name="student-project"),
    re_path(r"^student/project/(?P<project_id>\d+)/?$", StudentProjectUpdateView.as_view(), name="student-project-update"),

    re_path(r"^hod/projects/?$", HodSubmittedProjectsView.as_view(), name="hod-projects"),
    re_path(r"^hod/projects/(?P<project_id>\d+)/decision/?$", HodDecisionView.as_view(), name="hod-decision"),

    re_path(r"^join-requests/?$", JoinRequestCreateView.as_view(), name="join-request-create"),
    re_path(r"^join-requests/(?P<join_request_id>\d+)/approve/?$", JoinRequestApproveView.as_view(), name="join-request-approve"),
    re_path(r"^join-requests/(?P<join_request_id>\d+)/reject/?$", JoinRequestRejectView.as_view(), name="join-request-reject"),
    re_path(r"^join-requests/(?P<join_request_id>\d+)/cancel/?$", JoinRequestCancelView.as_view(), name="join-request-cancel"),

    re_path(r"^projects/(?P<project_id>\d+)/progress/?$", ProgressUpdateView.as_view(), name="progress"),
    re_path(r"^progress-updates/(?P<progress_update_id>\d+)/documents/?$", ProgressDocumentUploadView.as_view(), name="progress-document"),

    re_path(r"^admin/users/?$", AdminUsersView.as_view(), name="admin-users"),
    re_path(r"^admin/projects/?$", AdminProjectsView.as_view(), name="admin-projects"),
    re_path(r"^admin/audit-events/?$", AdminAuditEventsView.as_view(), name="admin-audit"),

    re_path(r"^hod/lifecycle/(?P<project_id>\d+)/?$", HodLifecycleView.as_view(), name="hod-lifecycle"),
    re_path(r"^hod/approvals/?$", HodApprovalsView.as_view(), name="hod-approvals"),
    re_path(r"^hod/progress/?$", HodProgressView.as_view(), name="hod-progress"),

    re_path(r"^faculty/projects/approved/?$", FacultyApprovedProjectsView.as_view(), name="faculty-approved-projects"),
    re_path(r"^faculty/projects/mentored/?$", FacultyMentoredProjectsView.as_view(), name="faculty-mentored-projects"),
    re_path(r"^faculty/projects/(?P<project_id>\d+)/comments/?$", FacultyProjectCommentsView.as_view(), name="faculty-project-comments"),
    re_path(r"^faculty/projects/(?P<project_id>\d+)/progress/?$", FacultyProjectProgressView.as_view(), name="faculty-project-progress"),

    re_path(r"^student/projects/approved/?$", StudentApprovedProjectsView.as_view(), name="student-approved-projects"),
    re_path(r"^student/project/progress/?$", StudentOwnProjectProgressView.as_view(), name="student-project-progress"),
    re_path(r"^student/join-requests/?$", StudentJoinRequestsView.as_view(), name="student-join-requests"),
]
