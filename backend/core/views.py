from __future__ import annotations

from django.contrib.auth import get_user_model
from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView

from .auth import CustomTokenObtainPairView
from .models import (
    AppUser,
    AuditEvent,
    Department,
    Role,
    Project,
    ProjectComment,
    ProjectHodDecision,
    ProjectJoinRequest,
    ProjectProgressUpdate,
    ProjectStatusHistory,
)

# Import configuration constants
from .config import (
    PUBLIC_ENDPOINT_PERMISSIONS,
    DISALLOWED_REGISTRATION_ROLES,
    PAGE_SIZE_QUERY_PARAM,
    MAX_PAGE_SIZE,
    HEALTH_RESPONSE,
    HOD_SUBMITTED_STATUS_CODES,
)
from .permissions import RBACPermission
from .serializers import (
    AuditEventSerializer,
    HodDecisionCreateSerializer,
    HodDecisionSerializer,
    JoinRequestCreateSerializer,
    JoinRequestListQuerySerializer,
    JoinRequestReviewSerializer,
    JoinRequestSerializer,
    PublicRegisterSerializer,
    DepartmentSerializer,
    DepartmentManagementSerializer,
    DepartmentAssignmentSerializer,
    StudentMentorSerializer,
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
    assign_user_department,
    cancel_join_request,
    create_hod_decision,
    create_department,
    create_join_request,
    create_progress_update,
    create_project,
    create_user,
    create_user_public,
    review_join_request,
    update_project,
    update_department,
)

User = get_user_model()


class StandardResultsSetPagination(PageNumberPagination):
    page_size_query_param = PAGE_SIZE_QUERY_PARAM
    max_page_size = MAX_PAGE_SIZE


class LoginView(CustomTokenObtainPairView):
    permission_classes = PUBLIC_ENDPOINT_PERMISSIONS


class RegisterView(APIView):
    permission_classes = PUBLIC_ENDPOINT_PERMISSIONS

    def post(self, request):
        serializer = PublicRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        role_obj = serializer.validated_data["role_code"]
        if role_obj.role_code in DISALLOWED_REGISTRATION_ROLES:
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        email = serializer.validated_data["email"].strip()
        user = create_user_public(
            payload={
                "username": email,
                "email": email,
                "password": serializer.validated_data["password"],
                "first_name": serializer.validated_data.get("first_name", ""),
                "last_name": serializer.validated_data.get("last_name", ""),
                "role_code": role_obj,
                "department": None,
            }
        )
        return Response(UserListSerializer(user).data, status=status.HTTP_201_CREATED)


class DepartmentListView(APIView):
    permission_classes = PUBLIC_ENDPOINT_PERMISSIONS

    def get(self, request):
        departments = Department.objects.filter(is_active=True).order_by("name")
        return Response(DepartmentSerializer(departments, many=True).data)


class AdminDepartmentsView(APIView):
    permission_classes = [RBACPermission]
    required_action = "admin.departments.manage"

    def get(self, request):
        departments = Department.objects.all().order_by("name", "id")
        return Response(DepartmentManagementSerializer(departments, many=True).data)

    def post(self, request):
        serializer = DepartmentManagementSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        department = create_department(actor=request.user, payload=serializer.validated_data)
        return Response(DepartmentManagementSerializer(department).data, status=status.HTTP_201_CREATED)


class AdminDepartmentDetailView(APIView):
    permission_classes = [RBACPermission]
    required_action = "admin.departments.manage"

    def patch(self, request, department_id: int):
        department = get_object_or_404(Department, id=department_id)
        serializer = DepartmentManagementSerializer(department, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        department = update_department(
            actor=request.user,
            department=department,
            payload=serializer.validated_data,
        )
        return Response(DepartmentManagementSerializer(department).data)


class StudentMentorListView(APIView):
    permission_classes = [RBACPermission]
    required_action = "student.mentors.read"

    def get(self, request):
        profile = getattr(request.user, "app_profile", None)
        department = profile.department if profile and profile.department and profile.department.is_active else None
        if department is None:
            return Response({"department": None, "mentors": []})
        mentors = User.objects.filter(
            app_profile__role_code_id=Role.FACULTY,
            app_profile__department=department,
            app_profile__is_active=True,
            is_active=True,
        ).order_by("first_name", "last_name", "username")
        return Response({
            "department": DepartmentSerializer(department).data,
            "mentors": StudentMentorSerializer(mentors, many=True).data,
        })


class HealthView(APIView):
    permission_classes = PUBLIC_ENDPOINT_PERMISSIONS

    def get(self, request):
        return Response(HEALTH_RESPONSE)


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

    def initial(self, request, *args, **kwargs):
        self.required_action = "users.create" if request.method == "POST" else "admin.users.read"
        super().initial(request, *args, **kwargs)

    def get(self, request):
        queryset = User.objects.all().order_by("id")
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        serializer = UserListSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        serializer = UserCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = create_user(actor=request.user, payload=serializer.validated_data)
        return Response(UserListSerializer(user).data, status=status.HTTP_201_CREATED)


class AdminUserDepartmentAssignmentView(APIView):
    permission_classes = [RBACPermission]
    required_action = "users.department.assign"

    def post(self, request, user_id: int):
        target = get_object_or_404(User, id=user_id)
        profile = get_object_or_404(AppUser, user=target)
        serializer = DepartmentAssignmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        profile = assign_user_department(
            actor=request.user,
            profile=profile,
            department=serializer.validated_data["department"],
        )
        return Response(UserListSerializer(profile.user).data)


class StudentProjectView(APIView):
    permission_classes = [RBACPermission]
    required_action = "student.project.read"

    def post(self, request):
        self.required_action = "student.project.create"
        self.check_permissions(request)
        serializer = ProjectCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        project = create_project(actor=request.user, payload=serializer.validated_data)
        return Response(ProjectDetailSerializer(project).data, status=status.HTTP_201_CREATED)

    def get(self, request):
        project = Project.objects.filter(team_leader_student=request.user).first()
        if project is None:
            return Response(None, status=status.HTTP_200_OK)  # student has no project yet
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
        department_id = getattr(getattr(request.user, "app_profile", None), "department_id", None)
        queryset = Project.objects.filter(
            department_id=department_id,
            status__status_code__in=HOD_SUBMITTED_STATUS_CODES,
        ).order_by("-created_at")
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        serializer = ProjectListSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class HodProjectDetailView(APIView):
    permission_classes = [RBACPermission]
    required_action = "hod.projects.read"

    def get(self, request, project_id: int):
        department_id = getattr(getattr(request.user, "app_profile", None), "department_id", None)
        project = get_object_or_404(Project, id=project_id, department_id=department_id)
        return Response(ProjectDetailSerializer(project).data)


class HodDecisionView(APIView):
    permission_classes = [RBACPermission]
    required_action = "hod.decision.write"

    def post(self, request, project_id: int):
        department_id = getattr(getattr(request.user, "app_profile", None), "department_id", None)
        project = get_object_or_404(Project, id=project_id, department_id=department_id)
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
    pagination_class = StandardResultsSetPagination

    def initial(self, request, *args, **kwargs):
        self.required_action = "join_request.list" if request.method == "GET" else "join_request.create"
        super().initial(request, *args, **kwargs)

    def get(self, request):
        query = JoinRequestListQuerySerializer(data=request.query_params)
        query.is_valid(raise_exception=True)
        role_code = getattr(getattr(request.user, "app_profile", None), "role_code_id", None)
        if role_code == Role.FACULTY:
            queryset = ProjectJoinRequest.objects.filter(project__mentor_faculty=request.user)
        else:
            queryset = ProjectJoinRequest.objects.filter(
                Q(student=request.user) | Q(project__team_leader_student=request.user)
            )
        project_id = query.validated_data.get("project")
        if project_id is not None:
            queryset = queryset.filter(project_id=project_id)
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset.order_by("-requested_at"), request)
        return paginator.get_paginated_response(JoinRequestSerializer(page, many=True).data)

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
        department_id = getattr(getattr(request.user, "app_profile", None), "department_id", None)
        if not Project.objects.filter(id=project_id, department_id=department_id).exists():
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        queryset = ProjectStatusHistory.objects.filter(
            project_id=project_id,
            project__department_id=department_id,
        ).order_by("-changed_at")
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        serializer = ProjectStatusHistorySerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class HodApprovalsView(APIView):
    permission_classes = [RBACPermission]
    required_action = "hod.approvals.read"
    pagination_class = StandardResultsSetPagination

    def get(self, request):
        department_id = getattr(getattr(request.user, "app_profile", None), "department_id", None)
        queryset = ProjectHodDecision.objects.filter(
            project__department_id=department_id,
        ).order_by("-decided_at")
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        serializer = HodDecisionSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class HodProgressView(APIView):
    permission_classes = [RBACPermission]
    required_action = "hod.progress.read"
    pagination_class = StandardResultsSetPagination

    def get(self, request):
        department_id = getattr(getattr(request.user, "app_profile", None), "department_id", None)
        queryset = ProjectProgressUpdate.objects.filter(
            project__department_id=department_id,
        ).order_by("-created_at")
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        serializer = ProgressUpdateSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class HodFacultyListView(APIView):
    permission_classes = [RBACPermission]
    required_action = "hod.faculty.read"
    pagination_class = StandardResultsSetPagination

    def get(self, request):
        department_id = getattr(getattr(request.user, "app_profile", None), "department_id", None)
        queryset = User.objects.filter(
            app_profile__role_code_id=Role.FACULTY,
            app_profile__department_id=department_id,
            app_profile__is_active=True,
            is_active=True,
        ).order_by("id")
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        return paginator.get_paginated_response(UserListSerializer(page, many=True).data)


class FacultyApprovedProjectsView(APIView):
    permission_classes = [RBACPermission]
    required_action = "faculty.projects.approved.read"
    pagination_class = StandardResultsSetPagination

    def get(self, request):
        queryset = Project.objects.filter(
            mentor_faculty=request.user,
            status__status_code="APPROVED",
        ).order_by("-approved_at")
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


class FacultyReviewQueueView(APIView):
    permission_classes = [RBACPermission]
    required_action = "faculty.projects.review_queue.read"
    pagination_class = StandardResultsSetPagination

    def get(self, request):
        queryset = Project.objects.filter(
            mentor_faculty=request.user,
            status__status_code__in=HOD_SUBMITTED_STATUS_CODES,
        ).order_by("-created_at")
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        return paginator.get_paginated_response(ProjectListSerializer(page, many=True).data)


class FacultyProjectCommentsView(APIView):
    permission_classes = [RBACPermission]
    required_action = "faculty.comments.read"
    pagination_class = StandardResultsSetPagination

    def get(self, request, project_id: int):
        project = get_object_or_404(Project, id=project_id, mentor_faculty=request.user)
        queryset = ProjectComment.objects.filter(project=project).order_by("-created_at")
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        serializer = ProjectCommentSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class FacultyProjectProgressView(APIView):
    permission_classes = [RBACPermission]
    required_action = "faculty.progress.read"
    pagination_class = StandardResultsSetPagination

    def get(self, request, project_id: int):
        project = get_object_or_404(Project, id=project_id, mentor_faculty=request.user)
        queryset = ProjectProgressUpdate.objects.filter(project=project).order_by("-created_at")
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
        project = Project.objects.filter(team_leader_student=request.user).first()
        if project is None:
            # Student has no project yet — return empty paginated result (200, not 404)
            return Response({'count': 0, 'next': None, 'previous': None, 'results': []})
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
