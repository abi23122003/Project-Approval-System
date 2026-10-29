from __future__ import annotations

from urllib.parse import urlencode

from django.conf import settings
from django.contrib.auth import get_user_model, password_validation
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.db import transaction
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView

from .auth import CustomTokenObtainPairView
from .models import (
    AppUser,
    AcademicTerm,
    AuditEvent,
    Department,
    GradingScale,
    NotificationTemplate,
    ProjectFacultyReview,
    Role,
    Project,
    ProjectComment,
    ProjectHodDecision,
    ProjectJoinRequest,
    ProjectProgressUpdate,
    ProjectStatusHistory,
    ProjectStatus,
    WorkflowConfiguration,
)

# Import configuration constants
from .config import (
    PUBLIC_ENDPOINT_PERMISSIONS,
    ALLOWED_REGISTRATION_ROLES,
    PAGE_SIZE_QUERY_PARAM,
    MAX_PAGE_SIZE,
    HEALTH_RESPONSE,
    HOD_SUBMITTED_STATUS_CODES,
)
from .permissions import RBACPermission
from .serializers import (
    AuditEventSerializer,
    AcademicTermSerializer,
    GradingScaleSerializer,
    NotificationTemplateSerializer,
    WorkflowConfigurationSerializer,
    FacultyProjectReviewCreateSerializer,
    FacultyProjectReviewSerializer,
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
    UserAccountStatusSerializer,
    PasswordResetConfirmSerializer,
    UserListSerializer,
)
from .services import (
    add_progress_document,
    assign_user_department,
    cancel_join_request,
    create_hod_decision,
    create_faculty_project_review,
    create_department,
    create_join_request,
    create_progress_update,
    create_project,
    create_user,
    create_user_public,
    review_join_request,
    update_project,
    update_department,
    set_user_active,
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
        if role_obj.role_code not in ALLOWED_REGISTRATION_ROLES:
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


class AdminAcademicTermsView(APIView):
    permission_classes = [RBACPermission]
    required_action = "admin.academic_terms.manage"

    def get(self, request):
        return Response(AcademicTermSerializer(AcademicTerm.objects.all(), many=True).data)

    def post(self, request):
        serializer = AcademicTermSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        term = serializer.save()
        AuditEvent.objects.create(
            actor=request.user, event_type="ACADEMIC_TERM_CREATED", entity_type="AcademicTerm", entity_id=term.id,
            details_json={"term_name": term.term_name, "start_date": term.start_date.isoformat(), "end_date": term.end_date.isoformat(), "is_active": term.is_active},
        )
        return Response(AcademicTermSerializer(term).data, status=status.HTTP_201_CREATED)


class AdminAcademicTermDetailView(APIView):
    permission_classes = [RBACPermission]
    required_action = "admin.academic_terms.manage"

    def get_object(self, term_id):
        return get_object_or_404(AcademicTerm, id=term_id)

    def get(self, request, term_id: int):
        return Response(AcademicTermSerializer(self.get_object(term_id)).data)

    def patch(self, request, term_id: int):
        term = self.get_object(term_id)
        serializer = AcademicTermSerializer(term, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        before = AcademicTermSerializer(term).data
        term = serializer.save()
        AuditEvent.objects.create(
            actor=request.user, event_type="ACADEMIC_TERM_UPDATED", entity_type="AcademicTerm", entity_id=term.id,
            details_json={"before": before, "after": AcademicTermSerializer(term).data},
        )
        return Response(AcademicTermSerializer(term).data)


class AdminGradingScalesView(APIView):
    permission_classes = [RBACPermission]
    required_action = "admin.grading_scales.manage"

    def get(self, request):
        return Response(GradingScaleSerializer(GradingScale.objects.all(), many=True).data)

    def post(self, request):
        serializer = GradingScaleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            scale = serializer.save()
            AuditEvent.objects.create(
                actor=request.user,
                event_type="GRADING_SCALE_CREATED",
                entity_type="GradingScale",
                entity_id=scale.id,
                details_json={"scale_name": scale.scale_name, "grade_type": scale.grade_type, "change": "created"},
            )
        return Response(GradingScaleSerializer(scale).data, status=status.HTTP_201_CREATED)


class AdminGradingScaleDetailView(APIView):
    permission_classes = [RBACPermission]
    required_action = "admin.grading_scales.manage"

    def get_object(self, scale_id):
        return get_object_or_404(GradingScale, id=scale_id)

    def get(self, request, scale_id: int):
        return Response(GradingScaleSerializer(self.get_object(scale_id)).data)

    def patch(self, request, scale_id: int):
        scale = self.get_object(scale_id)
        serializer = GradingScaleSerializer(scale, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        changed_fields = sorted(serializer.validated_data.keys())
        with transaction.atomic():
            scale = serializer.save()
            AuditEvent.objects.create(
                actor=request.user,
                event_type="GRADING_SCALE_UPDATED",
                entity_type="GradingScale",
                entity_id=scale.id,
                details_json={
                    "scale_name": scale.scale_name,
                    "grade_type": scale.grade_type,
                    "changed_fields": changed_fields,
                },
            )
        return Response(GradingScaleSerializer(scale).data)


class AdminNotificationTemplatesView(APIView):
    permission_classes = [RBACPermission]
    required_action = "admin.notification_templates.manage"

    def get(self, request):
        return Response(NotificationTemplateSerializer(NotificationTemplate.objects.all(), many=True).data)

    def post(self, request):
        serializer = NotificationTemplateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            template = serializer.save()
            AuditEvent.objects.create(
                actor=request.user,
                event_type="NOTIFICATION_TEMPLATE_CREATED",
                entity_type="NotificationTemplate",
                entity_id=template.id,
                details_json={
                    "template_name": template.template_name,
                    "trigger_event": template.trigger_event,
                    "email_enabled": template.email_enabled,
                    "in_app_enabled": template.in_app_enabled,
                    "change": "created",
                },
            )
        return Response(NotificationTemplateSerializer(template).data, status=status.HTTP_201_CREATED)


class AdminNotificationTemplateDetailView(APIView):
    permission_classes = [RBACPermission]
    required_action = "admin.notification_templates.manage"

    def get_object(self, template_id):
        return get_object_or_404(NotificationTemplate, id=template_id)

    def get(self, request, template_id: int):
        return Response(NotificationTemplateSerializer(self.get_object(template_id)).data)

    def patch(self, request, template_id: int):
        template = self.get_object(template_id)
        serializer = NotificationTemplateSerializer(template, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            template = serializer.save()
            AuditEvent.objects.create(
                actor=request.user,
                event_type="NOTIFICATION_TEMPLATE_UPDATED",
                entity_type="NotificationTemplate",
                entity_id=template.id,
                details_json={
                    "template_name": template.template_name,
                    "trigger_event": template.trigger_event,
                    "changed_fields": sorted(serializer.validated_data.keys()),
                },
            )
        return Response(NotificationTemplateSerializer(template).data)


class AdminWorkflowConfigurationView(APIView):
    permission_classes = [RBACPermission]
    required_action = "admin.workflow.manage"

    def get(self, request):
        configuration = WorkflowConfiguration.objects.first()
        return Response(WorkflowConfigurationSerializer(configuration).data if configuration else None)

    def post(self, request):
        if WorkflowConfiguration.objects.exists():
            return Response({"detail": "A workflow configuration already exists. Update it instead."}, status=status.HTTP_409_CONFLICT)
        serializer = WorkflowConfigurationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            configuration = serializer.save()
            AuditEvent.objects.create(
                actor=request.user,
                event_type="WORKFLOW_CONFIGURATION_CREATED",
                entity_type="WorkflowConfiguration",
                entity_id=configuration.id,
                details_json={"workflow_name": configuration.workflow_name, "change": "created"},
            )
        return Response(WorkflowConfigurationSerializer(configuration).data, status=status.HTTP_201_CREATED)


class AdminWorkflowConfigurationDetailView(APIView):
    permission_classes = [RBACPermission]
    required_action = "admin.workflow.manage"

    def get_object(self, configuration_id):
        return get_object_or_404(WorkflowConfiguration, id=configuration_id)

    def get(self, request, configuration_id: int):
        return Response(WorkflowConfigurationSerializer(self.get_object(configuration_id)).data)

    def patch(self, request, configuration_id: int):
        configuration = self.get_object(configuration_id)
        serializer = WorkflowConfigurationSerializer(configuration, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        changed_fields = sorted(serializer.validated_data.keys())
        with transaction.atomic():
            configuration = serializer.save()
            AuditEvent.objects.create(
                actor=request.user,
                event_type="WORKFLOW_CONFIGURATION_UPDATED",
                entity_type="WorkflowConfiguration",
                entity_id=configuration.id,
                details_json={"workflow_name": configuration.workflow_name, "changed_fields": changed_fields},
            )
        return Response(WorkflowConfigurationSerializer(configuration).data)


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
        profile = getattr(request.user, "app_profile", None)
        if profile and profile.role_code_id == Role.HOD:
            if profile.department_id is None:
                queryset = queryset.none()
            else:
                queryset = queryset.filter(app_profile__department_id=profile.department_id)
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


class AdminUserStatusView(APIView):
    permission_classes = [RBACPermission]
    required_action = "admin.users.manage"

    def patch(self, request, user_id: int):
        profile = get_object_or_404(AppUser.objects.select_related("user", "department"), user_id=user_id)
        serializer = UserAccountStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        status_change: dict[str, bool] = {}
        profile = set_user_active(
            actor=request.user,
            profile=profile,
            is_active=serializer.validated_data["is_active"],
            status_change=status_change,
        )
        return Response(UserListSerializer(profile.user).data)


class AdminUserPasswordResetView(APIView):
    permission_classes = [RBACPermission]
    required_action = "admin.users.manage"

    def post(self, request, user_id: int):
        target = get_object_or_404(User, pk=user_id)
        if not target.email or not target.email.strip():
            return Response({"detail": "This account has no email address for password recovery."}, status=status.HTTP_400_BAD_REQUEST)
        if settings.IS_PRODUCTION and "console.EmailBackend" in settings.EMAIL_BACKEND:
            return Response({"detail": "Console email delivery is disabled for production password resets."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        if "smtp.EmailBackend" in settings.EMAIL_BACKEND and not settings.EMAIL_HOST:
            return Response({"detail": "Password reset email is not configured on this server."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        uid = urlsafe_base64_encode(force_bytes(target.pk))
        token = default_token_generator.make_token(target)
        reset_url = f"{settings.PASSWORD_RESET_FRONTEND_URL}?{urlencode({'uid': uid, 'token': token})}"
        subject = "Reset your Project Approval System password"
        message = (
            "An administrator requested a password reset for your Project Approval System account.\n\n"
            f"Use this one-time link to choose a new password: {reset_url}\n\n"
            "If you did not expect this message, contact your system administrator."
        )
        try:
            sent_count = send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [target.email], fail_silently=False)
        except Exception:
            sent_count = 0
        if sent_count != 1:
            return Response({"detail": "The password reset email could not be sent. Check the server email configuration."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        with transaction.atomic():
            AuditEvent.objects.create(
                actor=request.user,
                event_type="USER_PASSWORD_RESET_REQUESTED",
                entity_type="AppUser",
                entity_id=getattr(getattr(target, "app_profile", None), "id", None),
                details_json={"user_id": target.pk},
            )
        detail = (
            "Password reset link was printed by the development email backend; no email was delivered."
            if "console.EmailBackend" in settings.EMAIL_BACKEND
            else "Password reset email sent."
        )
        return Response({"detail": detail}, status=status.HTTP_202_ACCEPTED)


class PasswordResetConfirmView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            user_id = force_str(urlsafe_base64_decode(serializer.validated_data["uid"]))
            target = User.objects.get(pk=user_id)
        except (TypeError, ValueError, OverflowError, UnicodeDecodeError, User.DoesNotExist):
            return Response({"detail": "This password reset link is invalid or expired."}, status=status.HTTP_400_BAD_REQUEST)
        if not default_token_generator.check_token(target, serializer.validated_data["token"]):
            return Response({"detail": "This password reset link is invalid or expired."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            password_validation.validate_password(serializer.validated_data["new_password"], user=target)
        except ValidationError as exc:
            return Response({"new_password": exc.messages}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            target.set_password(serializer.validated_data["new_password"])
            target.save(update_fields=["password"])
            profile = AppUser.objects.select_for_update().get(user=target)
            profile.auth_version += 1
            profile.save(update_fields=["auth_version"])
            from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
            for outstanding in OutstandingToken.objects.filter(user=target).iterator():
                BlacklistedToken.objects.get_or_create(token=outstanding)
        return Response(status=status.HTTP_204_NO_CONTENT)


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
        candidates = list(queryset)
        eligible_ids = []
        for project in candidates:
            if project.workflow_review_stages is None:
                eligible_ids.append(project.id)
            elif project.workflow_require_hod_approval and not ProjectHodDecision.objects.filter(
                project=project,
                review_round=project.review_round,
            ).exists():
                eligible_ids.append(project.id)
        queryset = Project.objects.filter(id__in=eligible_ids).order_by("-created_at")
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
        projects = list(queryset)
        reviewable_ids = []
        for project in projects:
            if project.workflow_review_stages is None:
                reviewable_ids.append(project.id)
            elif ProjectFacultyReview.objects.filter(
                project=project,
                review_round=project.review_round,
                decision=ProjectFacultyReview.APPROVE,
            ).count() < project.workflow_review_stages:
                reviewable_ids.append(project.id)
        queryset = Project.objects.filter(id__in=reviewable_ids).order_by("-created_at")
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        return paginator.get_paginated_response(ProjectListSerializer(page, many=True).data)


class FacultyProjectReviewView(APIView):
    permission_classes = [RBACPermission]
    required_action = "faculty.project.review"

    def post(self, request, project_id: int):
        project = get_object_or_404(Project, id=project_id, mentor_faculty=request.user)
        serializer = FacultyProjectReviewCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        review = create_faculty_project_review(
            actor=request.user,
            project=project,
            decision=serializer.validated_data["decision"],
            reason=serializer.validated_data.get("reason"),
        )
        project.refresh_from_db()
        completed_stages = ProjectFacultyReview.objects.filter(
            project=project,
            review_round=project.review_round,
            decision=ProjectFacultyReview.APPROVE,
        ).count()
        remaining_stages = max((project.workflow_review_stages or 0) - completed_stages, 0)
        return Response({
            **FacultyProjectReviewSerializer(review).data,
            "project_status": project.status_id,
            "remaining_stages": remaining_stages,
            "awaiting_hod": project.status_id == ProjectStatus.UNDER_REVIEW and remaining_stages == 0 and bool(project.workflow_require_hod_approval),
        }, status=status.HTTP_201_CREATED)


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
        department_id = getattr(getattr(request.user, "app_profile", None), "department_id", None)
        queryset = Project.objects.none()
        if department_id is not None:
            queryset = Project.objects.filter(
                department_id=department_id,
                status__status_code="APPROVED",
            )
        queryset = queryset.order_by("-approved_at")
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
