from __future__ import annotations

from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import (
    AppUser,
    AuditEvent,
    Department,
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
)

User = get_user_model()


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()


class PublicRegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=6)
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    role_code = serializers.SlugRelatedField(slug_field="role_code", queryset=Role.objects.all())


class UserCreateSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    role_code = serializers.SlugRelatedField(slug_field="role_code", queryset=Role.objects.all())
    department = serializers.PrimaryKeyRelatedField(queryset=Department.objects.all(), allow_null=True, required=False)


class UserListSerializer(serializers.ModelSerializer):
    role_code = serializers.CharField(source="app_profile.role_code_id")
    department_id = serializers.IntegerField(source="app_profile.department_id", allow_null=True)

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "is_active", "role_code", "department_id"]


class ProjectCreateSerializer(serializers.ModelSerializer):
    status = serializers.SlugRelatedField(slug_field="status_code", queryset=ProjectStatus.objects.all())

    class Meta:
        model = Project
        fields = ["department", "mentor_faculty", "title", "abstract", "status"]


class ProjectUpdateSerializer(serializers.ModelSerializer):
    status = serializers.SlugRelatedField(slug_field="status_code", queryset=ProjectStatus.objects.all(), required=False)

    class Meta:
        model = Project
        fields = ["mentor_faculty", "title", "abstract", "status"]
        extra_kwargs = {"mentor_faculty": {"required": False}}


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
        fields = ["id", "title", "status", "department", "mentor_faculty", "team_leader_student", "created_at"]


class ProjectStatusHistorySerializer(serializers.ModelSerializer):
    from_status = serializers.CharField(source="from_status.status_code", allow_null=True)
    to_status = serializers.CharField(source="to_status.status_code")

    class Meta:
        model = ProjectStatusHistory
        fields = ["id", "project", "from_status", "to_status", "changed_by", "changed_at", "note"]


class HodDecisionCreateSerializer(serializers.Serializer):
    decision = serializers.ChoiceField(choices=ProjectHodDecision.DECISION_CHOICES)
    reason = serializers.CharField(required=False, allow_blank=True)


class HodDecisionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectHodDecision
        fields = ["id", "project", "hod", "decision", "reason", "decided_at"]


class JoinRequestCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectJoinRequest
        fields = ["project"]


class JoinRequestReviewSerializer(serializers.Serializer):
    note = serializers.CharField(required=False, allow_blank=True)


class JoinRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectJoinRequest
        fields = ["id", "project", "student", "status", "requested_at", "reviewed_by", "reviewed_at", "review_note"]


class ProgressUpdateCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectProgressUpdate
        fields = ["percent_complete", "steps_completed"]


class ProgressUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectProgressUpdate
        fields = ["id", "project", "updated_by_student", "percent_complete", "steps_completed", "created_at"]


class ProgressDocumentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProgressDocument
        fields = ["storage_path", "original_filename", "mime_type", "byte_size"]


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
