from __future__ import annotations

import unicodedata
from decimal import Decimal, InvalidOperation
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from .models import (
    AppUser,
    AcademicTerm,
    AuditEvent,
    Department,
    GradingScale,
    NotificationTemplate,
    ProjectFacultyReview,
    ProgressDocument,
    Project,
    ProjectComment,
    ProjectHodDecision,
    ProjectJoinRequest,
    ProjectMember,
    ProjectProgressUpdate,
    ProjectStatus,
    ProjectStatusHistory,
    Role,
    WorkflowConfiguration,
)
from .config import MAX_UPLOAD_BYTES

User = get_user_model()


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()


class PublicRegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=6)
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    role_code = serializers.SlugRelatedField(
        slug_field="role_code",
        queryset=Role.objects.all(),
    )

    def to_internal_value(self, data):
        if "department" in data:
            raise serializers.ValidationError({"department": "Department assignment is managed by an administrator."})
        return super().to_internal_value(data)

    def validate_email(self, value):
        return value.strip().lower()

    def validate(self, attrs):
        candidate = User(
            username=attrs["email"],
            email=attrs["email"],
            first_name=attrs.get("first_name", ""),
            last_name=attrs.get("last_name", ""),
        )
        try:
            validate_password(attrs["password"], user=candidate)
        except DjangoValidationError as exc:
            raise serializers.ValidationError({"password": exc.messages}) from exc
        return attrs


class UserCreateSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    role_code = serializers.SlugRelatedField(slug_field="role_code", queryset=Role.objects.all())
    department = serializers.PrimaryKeyRelatedField(queryset=Department.objects.filter(is_active=True), allow_null=True, required=False)

    def validate_email(self, value):
        return value.strip().lower()

    def validate(self, attrs):
        role = attrs.get("role_code")
        if role and role.role_code != Role.ADMIN and not attrs.get("department"):
            raise serializers.ValidationError({"department": "A department is required for non-admin accounts."})
        candidate = User(
            username=attrs["username"],
            email=attrs.get("email", ""),
            first_name=attrs.get("first_name", ""),
            last_name=attrs.get("last_name", ""),
        )
        try:
            validate_password(attrs["password"], user=candidate)
        except DjangoValidationError as exc:
            raise serializers.ValidationError({"password": exc.messages}) from exc
        return attrs


class DepartmentAssignmentSerializer(serializers.Serializer):
    department = serializers.PrimaryKeyRelatedField(queryset=Department.objects.filter(is_active=True))


class UserAccountStatusSerializer(serializers.Serializer):
    is_active = serializers.BooleanField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, trim_whitespace=False)


class UserListSerializer(serializers.ModelSerializer):
    role_code = serializers.CharField(source="app_profile.role_code_id")
    department_id = serializers.IntegerField(source="app_profile.department_id", allow_null=True)
    is_active = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "is_active", "role_code", "department_id"]

    def get_is_active(self, obj):
        profile = getattr(obj, "app_profile", None)
        return bool(obj.is_active and profile and profile.is_active)


class ProjectCreateSerializer(serializers.ModelSerializer):
    status = serializers.SlugRelatedField(
        slug_field="status_code",
        queryset=ProjectStatus.objects.filter(status_code__in=[ProjectStatus.DRAFT, ProjectStatus.SUBMITTED]),
        required=False,
    )

    class Meta:
        model = Project
        fields = ["mentor_faculty", "title", "abstract", "status"]

    def to_internal_value(self, data):
        errors = {}
        if "department" in data:
            errors["department"] = "Department is assigned from your account profile."
        if errors:
            raise serializers.ValidationError(errors)
        return super().to_internal_value(data)

    def validate_mentor_faculty(self, value):
        request = self.context["request"]
        student_profile = getattr(request.user, "app_profile", None)
        faculty_profile = getattr(value, "app_profile", None)
        if (
            not student_profile
            or not student_profile.department_id
            or not student_profile.department.is_active
            or not faculty_profile
            or faculty_profile.role_code_id != Role.FACULTY
            or faculty_profile.department_id != student_profile.department_id
            or not faculty_profile.is_active
            or not value.is_active
        ):
            raise serializers.ValidationError("Select an active faculty mentor in your department.")
        return value


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ["id", "code", "name"]


class DepartmentManagementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ["id", "code", "name", "is_active"]
        read_only_fields = ["id"]


class AcademicTermSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicTerm
        fields = ["id", "term_name", "start_date", "end_date", "is_active", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate(self, attrs):
        start_date = attrs.get("start_date", getattr(self.instance, "start_date", None))
        end_date = attrs.get("end_date", getattr(self.instance, "end_date", None))
        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError({"end_date": "End date must be on or after the start date."})
        is_active = attrs.get("is_active", getattr(self.instance, "is_active", False))
        if is_active and AcademicTerm.objects.exclude(pk=getattr(self.instance, "pk", None)).filter(is_active=True).exists():
            raise serializers.ValidationError({"is_active": "Another academic term is already active. Deactivate it before activating this term."})
        return attrs


class GradingScaleSerializer(serializers.ModelSerializer):
    maximum_points = serializers.DecimalField(max_digits=8, decimal_places=2, min_value=Decimal("0.01"))

    class Meta:
        model = GradingScale
        fields = ["id", "scale_name", "maximum_points", "grade_type", "criteria", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_criteria(self, value):
        if not isinstance(value, list) or not value:
            raise serializers.ValidationError("Add at least one grading criterion.")
        normalized = []
        for index, item in enumerate(value):
            if not isinstance(item, dict) or set(item) != {"min_value", "max_value", "grade"}:
                raise serializers.ValidationError(f"Criterion {index + 1} must include minimum, maximum, and grade.")
            try:
                minimum = serializers.DecimalField(max_digits=8, decimal_places=2).run_validation(item["min_value"])
                maximum = serializers.DecimalField(max_digits=8, decimal_places=2).run_validation(item["max_value"])
            except serializers.ValidationError as exc:
                raise serializers.ValidationError(f"Criterion {index + 1} has an invalid range.") from exc
            grade = item["grade"]
            if not isinstance(grade, str) or not grade.strip():
                raise serializers.ValidationError(f"Criterion {index + 1} needs a grade label.")
            if minimum < 0 or maximum <= minimum:
                raise serializers.ValidationError(f"Criterion {index + 1} must have a positive, increasing range.")
            normalized.append({"min_value": str(minimum), "max_value": str(maximum), "grade": grade.strip()})
        return normalized

    def validate(self, attrs):
        maximum_points = attrs.get("maximum_points", getattr(self.instance, "maximum_points", None))
        grade_type = attrs.get("grade_type", getattr(self.instance, "grade_type", None))
        criteria = attrs.get("criteria", getattr(self.instance, "criteria", None))
        if not attrs.get("scale_name", getattr(self.instance, "scale_name", "")).strip():
            raise serializers.ValidationError({"scale_name": "Scale name is required."})
        if maximum_points is None or maximum_points <= 0:
            raise serializers.ValidationError({"maximum_points": "Maximum points must be greater than zero."})
        if grade_type not in dict(GradingScale.GRADE_TYPE_CHOICES):
            raise serializers.ValidationError({"grade_type": "Select a supported grade type."})
        upper_bound = maximum_points if grade_type == GradingScale.POINTS else 100
        try:
            ranges = [(Decimal(item["min_value"]), Decimal(item["max_value"])) for item in criteria]
        except (TypeError, KeyError, ValueError, InvalidOperation):
            raise serializers.ValidationError({"criteria": "Criteria must contain valid minimum and maximum values."})
        if ranges[0][0] != 0:
            raise serializers.ValidationError({"criteria": "Criteria must start at 0."})
        for index, (minimum, maximum) in enumerate(ranges):
            if maximum > upper_bound:
                raise serializers.ValidationError({"criteria": f"Criterion {index + 1} exceeds the maximum of {upper_bound}."})
            if index and minimum != ranges[index - 1][1]:
                raise serializers.ValidationError({"criteria": "Criteria must be ordered, contiguous, and non-overlapping."})
        if ranges[-1][1] != upper_bound:
            raise serializers.ValidationError({"criteria": f"Criteria must cover the full range from 0 to {upper_bound}."})
        return attrs


class NotificationTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationTemplate
        fields = ["id", "template_name", "trigger_event", "email_enabled", "in_app_enabled", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_template_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Notification template name is required.")
        return value


class WorkflowConfigurationSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkflowConfiguration
        fields = ["id", "workflow_name", "review_stages", "require_hod_approval", "parallel_reviews", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_workflow_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Workflow name is required.")
        return value

    def validate_review_stages(self, value):
        if value not in range(1, 5):
            raise serializers.ValidationError("Review stages must be between 1 and 4.")
        return value

    def validate(self, attrs):
        requires_hod = attrs.get("require_hod_approval", getattr(self.instance, "require_hod_approval", True))
        parallel = attrs.get("parallel_reviews", getattr(self.instance, "parallel_reviews", False))
        if parallel and not requires_hod:
            raise serializers.ValidationError({"parallel_reviews": "Parallel review requires HOD approval."})
        return attrs


class FacultyProjectReviewCreateSerializer(serializers.Serializer):
    decision = serializers.ChoiceField(choices=ProjectFacultyReview.DECISION_CHOICES)
    reason = serializers.CharField(required=False, allow_blank=True)


class FacultyProjectReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectFacultyReview
        fields = ["id", "project", "faculty", "stage", "review_round", "decision", "reason", "reviewed_at"]
        read_only_fields = fields


class StudentMentorSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "name"]

    def get_name(self, obj):
        full_name = f"{obj.first_name} {obj.last_name}".strip()
        return full_name or obj.username


class ProjectUpdateSerializer(serializers.ModelSerializer):
    status = serializers.SlugRelatedField(
        slug_field="status_code",
        queryset=ProjectStatus.objects.filter(status_code=ProjectStatus.SUBMITTED),
        required=False,
    )

    class Meta:
        model = Project
        fields = ["mentor_faculty", "title", "abstract", "status"]
        extra_kwargs = {"mentor_faculty": {"required": False}}

    def validate_mentor_faculty(self, value):
        faculty_profile = getattr(value, "app_profile", None)
        student_profile = getattr(self.instance.team_leader_student, "app_profile", None)
        if (
            not faculty_profile
            or faculty_profile.role_code_id != Role.FACULTY
            or not student_profile
            or not student_profile.department_id
            or faculty_profile.department_id != student_profile.department_id
            or faculty_profile.department_id != self.instance.department_id
            or not faculty_profile.is_active
            or not value.is_active
        ):
            raise serializers.ValidationError("Select active faculty assigned to this project's department.")
        return value


class ProjectDetailSerializer(serializers.ModelSerializer):
    status = serializers.CharField(source="status.status_code")

    class Meta:
        model = Project
        fields = [
            "id",
            "department",
            "mentor_faculty",
            "team_leader_student",
            "title",
            "abstract",
            "status",
            "submitted_at",
            "approved_at",
            "created_at",
            "updated_at",
        ]


class ProjectListSerializer(serializers.ModelSerializer):
    status = serializers.CharField(source="status.status_code")

    class Meta:
        model = Project
        fields = [
            "id", "title", "status", "department", "mentor_faculty", "team_leader_student", "created_at",
            "workflow_review_stages", "workflow_require_hod_approval", "workflow_parallel_reviews",
        ]


class ProjectStatusHistorySerializer(serializers.ModelSerializer):
    from_status = serializers.CharField(source="from_status.status_code", allow_null=True)
    to_status = serializers.CharField(source="to_status.status_code")

    class Meta:
        model = ProjectStatusHistory
        fields = ["id", "project", "from_status", "to_status", "changed_by", "changed_at", "note"]


class HodDecisionCreateSerializer(serializers.Serializer):
    decision = serializers.ChoiceField(choices=ProjectHodDecision.DECISION_CHOICES)
    reason = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        if attrs["decision"] == ProjectHodDecision.REJECT and not attrs.get("reason", "").strip():
            raise serializers.ValidationError({"reason": "A reason is required when rejecting a project."})
        return attrs


class HodDecisionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectHodDecision
        fields = ["id", "project", "hod", "review_round", "decision", "reason", "decided_at"]


class JoinRequestCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectJoinRequest
        fields = ["project"]


class JoinRequestListQuerySerializer(serializers.Serializer):
    project = serializers.IntegerField(min_value=1, required=False)


class JoinRequestReviewSerializer(serializers.Serializer):
    note = serializers.CharField(required=False, allow_blank=True)


class JoinRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectJoinRequest
        fields = ["id", "project", "student", "status", "requested_at", "reviewed_by", "reviewed_at", "review_note"]


class ProgressUpdateCreateSerializer(serializers.ModelSerializer):
    percent_complete = serializers.IntegerField(min_value=0, max_value=100)
    steps_completed = serializers.CharField(trim_whitespace=True, allow_blank=False, max_length=5000)

    class Meta:
        model = ProjectProgressUpdate
        fields = ["percent_complete", "steps_completed"]


class ProgressUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectProgressUpdate
        fields = ["id", "project", "updated_by_student", "percent_complete", "steps_completed", "created_at"]


class ProgressDocumentCreateSerializer(serializers.ModelSerializer):
    storage_path = serializers.CharField(required=False, allow_blank=True, write_only=True)
    original_filename = serializers.CharField(min_length=1, max_length=255, trim_whitespace=True)
    byte_size = serializers.IntegerField(min_value=0, max_value=MAX_UPLOAD_BYTES)
    mime_type = serializers.RegexField(
        regex=r"^[A-Za-z0-9.+-]+/[A-Za-z0-9.+-]+$",
        max_length=100,
        required=False,
        allow_null=True,
        allow_blank=True,
    )

    class Meta:
        model = ProgressDocument
        fields = ["storage_path", "original_filename", "mime_type", "byte_size"]

    def validate_original_filename(self, value):
        if "/" in value or "\\" in value or ".." in value:
            raise serializers.ValidationError("Filename must not contain path components.")
        if any(unicodedata.category(character) == "Cc" for character in value):
            raise serializers.ValidationError("Filename must not contain control characters.")
        extension = "." + value.rsplit(".", 1)[-1].lower() if "." in value else ""
        if extension not in {".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".zip", ".rar"}:
            raise serializers.ValidationError("File extension is not supported.")
        return value


class ProgressDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProgressDocument
        fields = ["id", "progress_update", "storage_path", "original_filename", "mime_type", "byte_size", "uploaded_at"]


class ProjectMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectMember
        fields = ["project", "student", "joined_at", "left_at"]


class ProjectCommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectComment
        fields = ["id", "project", "faculty", "comment_text", "created_at"]


class AuditEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditEvent
        fields = ["id", "event_time", "actor", "event_type", "entity_type", "entity_id", "details_json"]
