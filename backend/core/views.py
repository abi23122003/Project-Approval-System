from __future__ import annotations

from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView

from .auth import CustomTokenObtainPairView
from .models import (
    AuditEvent,
    Project,
    ProjectComment,
    ProjectHodDecision,
    ProjectJoinRequest,
    ProjectProgressUpdate,
    ProjectStatusHistory,
)
from .permissions import RBACPermission
from .serializers import (
    AuditEventSerializer,
    HodDecisionCreateSerializer,
    HodDecisionSerializer,
    JoinRequestCreateSerializer,
    JoinRequestReviewSerializer,
    JoinRequestSerializer,
    ProgressDocumentCreateSerializer,
    ProgressDocumentSerializer,
    ProgressUpdateCreateSerializer,
    ProgressUpdateSerializer,
    ProjectCommentSerializer,
    ProjectCreateSerializer,
    ProjectDetailSerializer,
    ProjectListSerializer,
    ProjectStatusHistorySerializer,
    ProjectUpdateSerializer,
    UserCreateSerializer,
    UserListSerializer,
)
from .services import (
    add_progress_document,
    cancel_join_request,
    create_hod_decision,
    create_join_request,
    create_progress_update,
    create_project,
    create_user,
    review_join_request,
    update_project,
)

User = get_user_model()


class StandardResultsSetPagination(PageNumberPagination):
    page_size_query_param = "page_size"
    max_page_size = 100


class LoginView(CustomTokenObtainPairView):
    permission_classes = []


class HealthView(APIView):
    permission_classes = []

    def get(self, request):
        return Response({"status": "ok"})


class UsersView(APIView):
    permission_classes = [RBACPermission]
    required_action = "users.create"

    def post(self, request):
        serializer = UserCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = create_user(actor=request.user, payload=serializer.validated_data)
        return Response(UserListSerializer(user).data, status=status.HTTP_201_CREATED)


class AdminUsersView(APIView):
    permission_classes = [RBACPermission]
    required_action = "admin.users.read"
    pagination_class = StandardResultsSetPagination

    def get(self, request):
        queryset = User.objects.all().order_by("id")
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        serializer = UserListSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class StudentProjectView(APIView):
    permission_classes = [RBACPermission]
    required_action = "student.project.read"

    def post(self, request):
        self.required_action = "student.project.create"
        self.check_permissions(request)
        serializer = ProjectCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        project = create_project(actor=request.user, payload=serializer.validated_data)
        return Response(ProjectDetailSerializer(project).data, status=status.HTTP_201_CREATED)

    def get(self, request):
        project = get_object_or_404(Project, team_leader_student=request.user)
        return Response(ProjectDetailSerializer(project).data)


class StudentProjectUpdateView(APIView):
    permission_classes = [RBACPermission]
    required_action = "student.project.update"

    def patch(self, request, project_id: int):
        project = get_object_or_404(Project, id=project_id, team_leader_student=request.user)
        self.check_object_permissions(request, project)
        serializer = ProjectUpdateSerializer(project, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        project = update_project(actor=request.user, project=project, payload=serializer.validated_data)
        return Response(ProjectDetailSerializer(project).data)


class HodSubmittedProjectsView(APIView):
    permission_classes = [RBACPermission]
    required_action = "hod.projects.read"
    pagination_class = StandardResultsSetPagination

    def get(self, request):
        queryset = Project.objects.filter(status__status_code__in=["SUBMITTED", "UNDER_REVIEW"]).order_by("-created_at")
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        serializer = ProjectListSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class HodDecisionView(APIView):
    permission_classes = [RBACPermission]
    required_action = "hod.decision.write"

    def post(self, request, project_id: int):
        project = get_object_or_404(Project, id=project_id)
        serializer = HodDecisionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        decision = create_hod_decision(
            actor=request.user,
            project=project,
            decision=serializer.validated_data["decision"],
            reason=serializer.validated_data.get("reason"),
        )
        return Response(HodDecisionSerializer(decision).data, status=status.HTTP_201_CREATED)


class JoinRequestCreateView(APIView):
    permission_classes = [RBACPermission]
    required_action = "join_request.create"

    def post(self, request):
        serializer = JoinRequestCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        join_request = create_join_request(actor=request.user, project=serializer.validated_data["project"])
        return Response(JoinRequestSerializer(join_request).data, status=status.HTTP_201_CREATED)


class JoinRequestApproveView(APIView):
    permission_classes = [RBACPermission]
    required_action = "join_request.review"

    def post(self, request, join_request_id: int):
        join_request = get_object_or_404(ProjectJoinRequest, id=join_request_id)
        self.check_object_permissions(request, join_request)
        serializer = JoinRequestReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        join_request = review_join_request(
            actor=request.user,
            join_request=join_request,
            status=ProjectJoinRequest.APPROVED,
            note=serializer.validated_data.get("note"),
        )
        return Response(JoinRequestSerializer(join_request).data)


class JoinRequestRejectView(APIView):
    permission_classes = [RBACPermission]
    required_action = "join_request.review"

    def post(self, request, join_request_id: int):
        join_request = get_object_or_404(ProjectJoinRequest, id=join_request_id)
        self.check_object_permissions(request, join_request)
        serializer = JoinRequestReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        join_request = review_join_request(
            actor=request.user,
            join_request=join_request,
            status=ProjectJoinRequest.REJECTED,
            note=serializer.validated_data.get("note"),
        )
        return Response(JoinRequestSerializer(join_request).data)


class JoinRequestCancelView(APIView):
    permission_classes = [RBACPermission]
    required_action = "join_request.cancel"

    def post(self, request, join_request_id: int):
        join_request = get_object_or_404(ProjectJoinRequest, id=join_request_id, student=request.user)
        join_request = cancel_join_request(actor=request.user, join_request=join_request)
        return Response(JoinRequestSerializer(join_request).data)


class ProgressUpdateView(APIView):
    permission_classes = [RBACPermission]
    pagination_class = StandardResultsSetPagination

    def initial(self, request, *args, **kwargs):
        self.required_action = "progress.read" if request.method == "GET" else "progress.create"
        super().initial(request, *args, **kwargs)

    def get(self, request, project_id: int):
        project = get_object_or_404(Project, id=project_id)
        self.check_object_permissions(request, project)
        queryset = ProjectProgressUpdate.objects.filter(project_id=project_id).order_by("-created_at")
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        serializer = ProgressUpdateSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    def post(self, request, project_id: int):
        project = get_object_or_404(Project, id=project_id)
        self.check_object_permissions(request, project)
        serializer = ProgressUpdateCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        progress = create_progress_update(actor=request.user, project=project, payload=serializer.validated_data)
        return Response(ProgressUpdateSerializer(progress).data, status=status.HTTP_201_CREATED)


class ProgressDocumentUploadView(APIView):
    permission_classes = [RBACPermission]
    required_action = "progress.document.upload"

    def post(self, request, progress_update_id: int):
        progress_update = get_object_or_404(ProjectProgressUpdate, id=progress_update_id)
        self.check_object_permissions(request, progress_update)
        serializer = ProgressDocumentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        document = add_progress_document(actor=request.user, progress_update=progress_update, payload=serializer.validated_data)
        return Response(ProgressDocumentSerializer(document).data, status=status.HTTP_201_CREATED)


class AdminProjectsView(APIView):
    permission_classes = [RBACPermission]
    required_action = "admin.projects.read"
    pagination_class = StandardResultsSetPagination

    def get(self, request):
        queryset = Project.objects.all().order_by("-created_at")
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        serializer = ProjectListSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class AdminAuditEventsView(APIView):
    permission_classes = [RBACPermission]
    required_action = "admin.audit.read"
    pagination_class = StandardResultsSetPagination

    def get(self, request):
        queryset = AuditEvent.objects.all().order_by("-event_time")
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        serializer = AuditEventSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class HodLifecycleView(APIView):
    permission_classes = [RBACPermission]
    required_action = "hod.lifecycle.read"
    pagination_class = StandardResultsSetPagination

    def get(self, request, project_id: int):
        queryset = ProjectStatusHistory.objects.filter(project_id=project_id).order_by("-changed_at")
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        serializer = ProjectStatusHistorySerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class HodApprovalsView(APIView):
    permission_classes = [RBACPermission]
    required_action = "hod.approvals.read"
    pagination_class = StandardResultsSetPagination

    def get(self, request):
        queryset = ProjectHodDecision.objects.all().order_by("-decided_at")
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        serializer = HodDecisionSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class HodProgressView(APIView):
    permission_classes = [RBACPermission]
    required_action = "hod.progress.read"
    pagination_class = StandardResultsSetPagination

    def get(self, request):
        queryset = ProjectProgressUpdate.objects.all().order_by("-created_at")
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        serializer = ProgressUpdateSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class FacultyApprovedProjectsView(APIView):
    permission_classes = [RBACPermission]
    required_action = "faculty.projects.approved.read"
    pagination_class = StandardResultsSetPagination

    def get(self, request):
        queryset = Project.objects.filter(status__status_code="APPROVED").order_by("-approved_at")
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        serializer = ProjectListSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class FacultyMentoredProjectsView(APIView):
    permission_classes = [RBACPermission]
    required_action = "faculty.projects.mentored.read"
    pagination_class = StandardResultsSetPagination

    def get(self, request):
        queryset = Project.objects.filter(mentor_faculty=request.user).order_by("-created_at")
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        serializer = ProjectListSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class FacultyProjectCommentsView(APIView):
    permission_classes = [RBACPermission]
    required_action = "faculty.comments.read"
    pagination_class = StandardResultsSetPagination

    def get(self, request, project_id: int):
        queryset = ProjectComment.objects.filter(project_id=project_id).order_by("-created_at")
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        serializer = ProjectCommentSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class FacultyProjectProgressView(APIView):
    permission_classes = [RBACPermission]
    required_action = "faculty.progress.read"
    pagination_class = StandardResultsSetPagination

    def get(self, request, project_id: int):
        queryset = ProjectProgressUpdate.objects.filter(project_id=project_id).order_by("-created_at")
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        serializer = ProgressUpdateSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class StudentApprovedProjectsView(APIView):
    permission_classes = [RBACPermission]
    required_action = "student.projects.approved.read"
    pagination_class = StandardResultsSetPagination

    def get(self, request):
        queryset = Project.objects.filter(status__status_code="APPROVED").order_by("-approved_at")
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        serializer = ProjectListSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class StudentOwnProjectProgressView(APIView):
    permission_classes = [RBACPermission]
    required_action = "student.own.progress.read"
    pagination_class = StandardResultsSetPagination

    def get(self, request):
        project = get_object_or_404(Project, team_leader_student=request.user)
        queryset = ProjectProgressUpdate.objects.filter(project=project).order_by("-created_at")
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        serializer = ProgressUpdateSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class StudentJoinRequestsView(APIView):
    permission_classes = [RBACPermission]
    required_action = "student.join_requests.read"
    pagination_class = StandardResultsSetPagination

    def get(self, request):
        queryset = ProjectJoinRequest.objects.filter(student=request.user).order_by("-requested_at")
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        serializer = JoinRequestSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)
