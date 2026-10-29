from __future__ import annotations

from django.conf import settings
from django.db import models


class Department(models.Model):
    code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=120, unique=True)
    is_active = models.BooleanField(default=True)

    def __str__(self) -> str:
        return f"{self.code} - {self.name}"


class AcademicTerm(models.Model):
    term_name = models.CharField(max_length=120)
    start_date = models.DateField()
    end_date = models.DateField()
    is_active = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-start_date", "-id"]
        constraints = [
            models.CheckConstraint(condition=models.Q(end_date__gte=models.F("start_date")), name="core_term_end_after_start"),
            models.UniqueConstraint(fields=["is_active"], condition=models.Q(is_active=True), name="core_one_active_term"),
        ]

    def __str__(self) -> str:
        return self.term_name


class GradingScale(models.Model):
    PERCENTAGE = "percentage"
    POINTS = "points"
    LETTER = "letter"
    GRADE_TYPE_CHOICES = [
        (PERCENTAGE, "Percentage Based"),
        (POINTS, "Points Based"),
        (LETTER, "Letter Grade"),
    ]

    scale_name = models.CharField(max_length=120)
    maximum_points = models.DecimalField(max_digits=8, decimal_places=2)
    grade_type = models.CharField(max_length=20, choices=GRADE_TYPE_CHOICES)
    criteria = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["scale_name", "id"]
        constraints = [models.CheckConstraint(condition=models.Q(maximum_points__gt=0), name="core_grading_scale_max_positive")]

    def __str__(self) -> str:
        return self.scale_name


class NotificationTemplate(models.Model):
    SUBMISSION = "submission"
    REVIEW = "review"
    DEADLINE = "deadline"
    APPROVAL = "approval"
    TRIGGER_EVENT_CHOICES = [
        (SUBMISSION, "Project Submission"),
        (REVIEW, "Review Completed"),
        (DEADLINE, "Deadline Approaching"),
        (APPROVAL, "Approval Required"),
    ]

    template_name = models.CharField(max_length=120)
    trigger_event = models.CharField(max_length=20, choices=TRIGGER_EVENT_CHOICES)
    email_enabled = models.BooleanField(default=False)
    in_app_enabled = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["template_name", "id"]

    def __str__(self) -> str:
        return self.template_name


class WorkflowConfiguration(models.Model):
    SINGLETON_KEY = "active"

    workflow_name = models.CharField(max_length=120)
    review_stages = models.PositiveSmallIntegerField(choices=[(number, f"{number} Stage{'s' if number != 1 else ''}") for number in range(1, 5)], default=2)
    require_hod_approval = models.BooleanField(default=True)
    parallel_reviews = models.BooleanField(default=False)
    configuration_key = models.CharField(max_length=20, unique=True, default=SINGLETON_KEY, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["id"]
        constraints = [
            models.CheckConstraint(condition=models.Q(review_stages__gte=1) & models.Q(review_stages__lte=4), name="core_workflow_stages_1_4"),
            models.CheckConstraint(condition=~models.Q(parallel_reviews=True) | models.Q(require_hod_approval=True), name="core_parallel_requires_hod"),
        ]

    def __str__(self) -> str:
        return self.workflow_name


class Role(models.Model):
    ADMIN = "ADMIN"
    HOD = "HOD"
    FACULTY = "FACULTY"
    STUDENT = "STUDENT"

    ROLE_CHOICES = [
        (ADMIN, "Admin"),
        (HOD, "Head of Department"),
        (FACULTY, "Faculty"),
        (STUDENT, "Student"),
    ]

    role_code = models.CharField(max_length=10, primary_key=True, choices=ROLE_CHOICES)

    def __str__(self) -> str:
        return self.role_code


class AppUser(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="app_profile",
    )
    role_code = models.ForeignKey(Role, on_delete=models.PROTECT, db_column="role_code")
    department = models.ForeignKey(Department, null=True, blank=True, on_delete=models.SET_NULL)
    is_active = models.BooleanField(default=True)
    auth_version = models.PositiveIntegerField(default=0)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="created_app_profiles",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["role_code"], name="core_appus_role_co_6fdcc5_idx"),
            models.Index(fields=["department"], name="core_appus_departm_ee3c98_idx"),
        ]


class ProjectStatus(models.Model):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    UNDER_REVIEW = "UNDER_REVIEW"
    REJECTED = "REJECTED"
    APPROVED = "APPROVED"

    status_code = models.CharField(max_length=20, primary_key=True)
    description = models.CharField(max_length=200)

    def __str__(self) -> str:
        return self.status_code


class ProjectStatusTransition(models.Model):
    from_status = models.ForeignKey(
        ProjectStatus,
        on_delete=models.CASCADE,
        related_name="transitions_from",
        db_column="from_status_code",
    )
    to_status = models.ForeignKey(
        ProjectStatus,
        on_delete=models.CASCADE,
        related_name="transitions_to",
        db_column="to_status_code",
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["from_status", "to_status"],
                name="uq_project_status_transition",
            )
        ]


class Project(models.Model):
    department = models.ForeignKey(Department, on_delete=models.PROTECT)
    mentor_faculty = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="mentored_projects",
    )
    team_leader_student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="led_projects",
    )
    title = models.CharField(max_length=200)
    abstract = models.TextField()
    status = models.ForeignKey(ProjectStatus, on_delete=models.PROTECT, db_column="status_code")
    submitted_at = models.DateTimeField(null=True, blank=True)
    review_round = models.PositiveIntegerField(default=1)
    approved_at = models.DateTimeField(null=True, blank=True)
    workflow_review_stages = models.PositiveSmallIntegerField(null=True, blank=True)
    workflow_require_hod_approval = models.BooleanField(null=True, blank=True)
    workflow_parallel_reviews = models.BooleanField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["team_leader_student"],
                name="uq_project_team_leader_single_project",
            )
        ]
        indexes = [
            models.Index(fields=["department"], name="core_projec_departm_7c16d0_idx"),
            models.Index(fields=["mentor_faculty"], name="core_projec_mentor__56c1d5_idx"),
            models.Index(fields=["status"], name="core_projec_status__5adf6a_idx"),
        ]


class ProjectMember(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    joined_at = models.DateTimeField(auto_now_add=True)
    left_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["project", "student"], name="pk_project_member"),
        ]
        indexes = [
            models.Index(fields=["project", "left_at"], name="core_projec_project_e4a7c3_idx"),
            models.Index(fields=["student", "left_at"], name="core_projec_student_08f08c_idx"),
        ]


class ProjectStatusHistory(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    from_status = models.ForeignKey(
        ProjectStatus,
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="history_from",
        db_column="from_status_code",
    )
    to_status = models.ForeignKey(
        ProjectStatus,
        on_delete=models.PROTECT,
        related_name="history_to",
        db_column="to_status_code",
    )
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    changed_at = models.DateTimeField(auto_now_add=True)
    note = models.TextField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["project", "changed_at"], name="core_projec_project_0f6a51_idx"),
        ]


class ProjectHodDecision(models.Model):
    APPROVE = "APPROVE"
    REJECT = "REJECT"

    DECISION_CHOICES = [
        (APPROVE, "Approve"),
        (REJECT, "Reject"),
    ]

    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    hod = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    decision = models.CharField(max_length=10, choices=DECISION_CHOICES)
    reason = models.TextField(null=True, blank=True)
    review_round = models.PositiveIntegerField(default=1)
    decided_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["project", "decided_at"], name="core_projec_project_5c0a86_idx"),
        ]


class ProjectFacultyReview(models.Model):
    APPROVE = "APPROVE"
    REJECT = "REJECT"
    DECISION_CHOICES = [(APPROVE, "Approve"), (REJECT, "Reject")]

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="faculty_reviews")
    faculty = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    stage = models.PositiveSmallIntegerField()
    review_round = models.PositiveIntegerField(default=1)
    decision = models.CharField(max_length=10, choices=DECISION_CHOICES)
    reason = models.TextField(null=True, blank=True)
    reviewed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["stage", "id"]
        constraints = [
            models.UniqueConstraint(fields=["project", "review_round", "stage"], name="uq_project_faculty_review_round_stage"),
            models.CheckConstraint(condition=models.Q(stage__gte=1) & models.Q(stage__lte=4), name="core_faculty_review_stage_1_4"),
        ]
        indexes = [models.Index(fields=["project", "decision"], name="core_fac_rev_proj_dec_idx")]


class ProjectJoinRequest(models.Model):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"

    STATUS_CHOICES = [
        (PENDING, "Pending"),
        (APPROVED, "Approved"),
        (REJECTED, "Rejected"),
        (CANCELLED, "Cancelled"),
    ]

    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=PENDING)
    requested_at = models.DateTimeField(auto_now_add=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="reviewed_join_requests",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    review_note = models.TextField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["project", "status"], name="core_projec_project_0ac8cc_idx"),
            models.Index(fields=["student", "status"], name="core_projec_student_11a0dd_idx"),
        ]


class ProjectProgressUpdate(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    updated_by_student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    percent_complete = models.SmallIntegerField()
    steps_completed = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=models.Q(percent_complete__gte=0) & models.Q(percent_complete__lte=100),
                name="ck_progress_percent_0_100",
            )
        ]
        indexes = []


class ProgressDocument(models.Model):
    progress_update = models.ForeignKey(ProjectProgressUpdate, on_delete=models.CASCADE)
    storage_path = models.CharField(max_length=500)
    original_filename = models.CharField(max_length=255)
    mime_type = models.CharField(max_length=100, null=True, blank=True)
    byte_size = models.BigIntegerField(null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)


class ProjectComment(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    faculty = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    comment_text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["project", "created_at"], name="core_projec_project_4e5b32_idx"),
        ]


class AuditEvent(models.Model):
    event_time = models.DateTimeField(auto_now_add=True)
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    event_type = models.CharField(max_length=50)
    entity_type = models.CharField(max_length=50)
    entity_id = models.BigIntegerField(null=True, blank=True)
    details_json = models.JSONField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["event_time"], name="core_audit_event_35fc25_idx"),
            models.Index(fields=["entity_type", "entity_id"], name="core_audit_entity__3d1a1a_idx"),
        ]
