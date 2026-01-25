from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Department",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("code", models.CharField(max_length=20, unique=True)),
                ("name", models.CharField(max_length=120, unique=True)),
                ("is_active", models.BooleanField(default=True)),
            ],
        ),
        migrations.CreateModel(
            name="Role",
            fields=[
                (
                    "role_code",
                    models.CharField(
                        choices=[
                            ("ADMIN", "Admin"),
                            ("HOD", "Head of Department"),
                            ("FACULTY", "Faculty"),
                            ("STUDENT", "Student"),
                        ],
                        max_length=10,
                        primary_key=True,
                        serialize=False,
                    ),
                )
            ],
        ),
        migrations.CreateModel(
            name="ProjectStatus",
            fields=[
                (
                    "status_code",
                    models.CharField(max_length=20, primary_key=True, serialize=False),
                ),
                ("description", models.CharField(max_length=200)),
            ],
        ),
        migrations.CreateModel(
            name="Project",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("title", models.CharField(max_length=200)),
                ("abstract", models.TextField()),
                ("submitted_at", models.DateTimeField(blank=True, null=True)),
                ("approved_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "department",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        to="core.department",
                    ),
                ),
                (
                    "mentor_faculty",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="mentored_projects",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "status",
                    models.ForeignKey(
                        db_column="status_code",
                        on_delete=django.db.models.deletion.PROTECT,
                        to="core.projectstatus",
                    ),
                ),
                (
                    "team_leader_student",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="led_projects",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "indexes": [
                    models.Index(fields=["department"], name="core_projec_departm_7c16d0_idx"),
                    models.Index(fields=["mentor_faculty"], name="core_projec_mentor__56c1d5_idx"),
                    models.Index(fields=["status"], name="core_projec_status__5adf6a_idx"),
                ],
            },
        ),
        migrations.CreateModel(
            name="AppUser",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="created_app_profiles",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "department",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to="core.department",
                    ),
                ),
                (
                    "role_code",
                    models.ForeignKey(
                        db_column="role_code",
                        on_delete=django.db.models.deletion.PROTECT,
                        to="core.role",
                    ),
                ),
                (
                    "user",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="app_profile",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "indexes": [
                    models.Index(fields=["role_code"], name="core_appus_role_co_6fdcc5_idx"),
                    models.Index(fields=["department"], name="core_appus_departm_ee3c98_idx"),
                ],
            },
        ),
        migrations.CreateModel(
            name="ProjectStatusTransition",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "from_status",
                    models.ForeignKey(
                        db_column="from_status_code",
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="transitions_from",
                        to="core.projectstatus",
                    ),
                ),
                (
                    "to_status",
                    models.ForeignKey(
                        db_column="to_status_code",
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="transitions_to",
                        to="core.projectstatus",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="ProjectMember",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("joined_at", models.DateTimeField(auto_now_add=True)),
                ("left_at", models.DateTimeField(blank=True, null=True)),
                (
                    "project",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="core.project",
                    ),
                ),
                (
                    "student",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "indexes": [
                    models.Index(fields=["project", "left_at"], name="core_projec_project_e4a7c3_idx"),
                    models.Index(fields=["student", "left_at"], name="core_projec_student_08f08c_idx"),
                ],
            },
        ),
        migrations.CreateModel(
            name="ProjectStatusHistory",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("changed_at", models.DateTimeField(auto_now_add=True)),
                ("note", models.TextField(blank=True, null=True)),
                (
                    "changed_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "from_status",
                    models.ForeignKey(
                        blank=True,
                        db_column="from_status_code",
                        null=True,
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="history_from",
                        to="core.projectstatus",
                    ),
                ),
                (
                    "project",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="core.project",
                    ),
                ),
                (
                    "to_status",
                    models.ForeignKey(
                        db_column="to_status_code",
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="history_to",
                        to="core.projectstatus",
                    ),
                ),
            ],
            options={
                "indexes": [
                    models.Index(fields=["project", "changed_at"], name="core_projec_project_0f6a51_idx"),
                ],
            },
        ),
        migrations.CreateModel(
            name="ProjectHodDecision",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "decision",
                    models.CharField(
                        choices=[("APPROVE", "Approve"), ("REJECT", "Reject")],
                        max_length=10,
                    ),
                ),
                ("reason", models.TextField(blank=True, null=True)),
                ("decided_at", models.DateTimeField(auto_now_add=True)),
                (
                    "hod",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "project",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="core.project",
                    ),
                ),
            ],
            options={
                "indexes": [
                    models.Index(fields=["project", "decided_at"], name="core_projec_project_5c0a86_idx"),
                ],
            },
        ),
        migrations.CreateModel(
            name="ProjectJoinRequest",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("PENDING", "Pending"),
                            ("APPROVED", "Approved"),
                            ("REJECTED", "Rejected"),
                            ("CANCELLED", "Cancelled"),
                        ],
                        default="PENDING",
                        max_length=10,
                    ),
                ),
                ("requested_at", models.DateTimeField(auto_now_add=True)),
                ("reviewed_at", models.DateTimeField(blank=True, null=True)),
                ("review_note", models.TextField(blank=True, null=True)),
                (
                    "project",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="core.project",
                    ),
                ),
                (
                    "reviewed_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="reviewed_join_requests",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "student",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "indexes": [
                    models.Index(fields=["project", "status"], name="core_projec_project_0ac8cc_idx"),
                    models.Index(fields=["student", "status"], name="core_projec_student_11a0dd_idx"),
                ],
            },
        ),
        migrations.CreateModel(
            name="ProjectProgressUpdate",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("percent_complete", models.SmallIntegerField()),
                ("steps_completed", models.TextField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "project",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="core.project",
                    ),
                ),
                (
                    "updated_by_student",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="ProgressDocument",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("storage_path", models.CharField(max_length=500)),
                ("original_filename", models.CharField(max_length=255)),
                ("mime_type", models.CharField(blank=True, max_length=100, null=True)),
                ("byte_size", models.BigIntegerField(blank=True, null=True)),
                ("uploaded_at", models.DateTimeField(auto_now_add=True)),
                (
                    "progress_update",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="core.projectprogressupdate",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="ProjectComment",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("comment_text", models.TextField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "faculty",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "project",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="core.project",
                    ),
                ),
            ],
            options={
                "indexes": [
                    models.Index(fields=["project", "created_at"], name="core_projec_project_4e5b32_idx"),
                ],
            },
        ),
        migrations.CreateModel(
            name="AuditEvent",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("event_time", models.DateTimeField(auto_now_add=True)),
                ("event_type", models.CharField(max_length=50)),
                ("entity_type", models.CharField(max_length=50)),
                ("entity_id", models.BigIntegerField(blank=True, null=True)),
                ("details_json", models.JSONField(blank=True, null=True)),
                (
                    "actor",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "indexes": [
                    models.Index(fields=["event_time"], name="core_audit_event_35fc25_idx"),
                    models.Index(fields=["entity_type", "entity_id"], name="core_audit_entity__3d1a1a_idx"),
                ],
            },
        ),
        migrations.AddConstraint(
            model_name="project",
            constraint=models.UniqueConstraint(
                fields=("team_leader_student",),
                name="uq_project_team_leader_single_project",
            ),
        ),
        migrations.AddConstraint(
            model_name="projectmember",
            constraint=models.UniqueConstraint(
                fields=("project", "student"),
                name="pk_project_member",
            ),
        ),
        migrations.AddConstraint(
            model_name="projectprogressupdate",
            constraint=models.CheckConstraint(
                condition=models.Q(percent_complete__gte=0) & models.Q(percent_complete__lte=100),
                name="ck_progress_percent_0_100",
            ),
        ),
        migrations.AddConstraint(
            model_name="projectstatustransition",
            constraint=models.UniqueConstraint(
                fields=("from_status", "to_status"),
                name="uq_project_status_transition",
            ),
        ),
    ]
