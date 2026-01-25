from django.db import migrations


def seed_lookups(apps, schema_editor):
    Role = apps.get_model("core", "Role")
    Department = apps.get_model("core", "Department")
    ProjectStatus = apps.get_model("core", "ProjectStatus")
    ProjectStatusTransition = apps.get_model("core", "ProjectStatusTransition")

    for role_code in ["ADMIN", "HOD", "FACULTY", "STUDENT"]:
        Role.objects.get_or_create(role_code=role_code)

    # Optional placeholder department (safe default if you want at least one)
    Department.objects.get_or_create(code="GEN", defaults={"name": "General"})

    statuses = {
        "DRAFT": "Draft",
        "SUBMITTED": "Submitted",
        "UNDER_REVIEW": "Under Review",
        "REJECTED": "Rejected",
        "APPROVED": "Approved",
    }

    for code, desc in statuses.items():
        ProjectStatus.objects.get_or_create(status_code=code, defaults={"description": desc})

    allowed = [
        ("DRAFT", "SUBMITTED"),
        ("SUBMITTED", "UNDER_REVIEW"),
        ("UNDER_REVIEW", "APPROVED"),
        ("UNDER_REVIEW", "REJECTED"),
        ("REJECTED", "SUBMITTED"),
    ]

    for from_code, to_code in allowed:
        from_status = ProjectStatus.objects.get(status_code=from_code)
        to_status = ProjectStatus.objects.get(status_code=to_code)
        ProjectStatusTransition.objects.get_or_create(from_status=from_status, to_status=to_status)


def unseed_lookups(apps, schema_editor):
    # Keep data (audit-safe); no reverse.
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0002_postgres_constraints_and_triggers"),
    ]

    operations = [
        migrations.RunPython(seed_lookups, unseed_lookups),
    ]
