from django.conf import settings
from django.core.management import call_command
from django.db import migrations

FALLBACK_TABLE_NAME = "project_approval_cache"


def create_cache_table(apps, schema_editor):
    caches = getattr(settings, "CACHES", {})
    default_cache = caches.get("default", {})
    backend_class = default_cache.get("BACKEND", "")
    if "DatabaseCache" not in backend_class:
        return

    table_name = default_cache.get("LOCATION", FALLBACK_TABLE_NAME)
    existing_tables = schema_editor.connection.introspection.table_names()
    if table_name not in existing_tables:
        call_command("createcachetable", table_name, database=schema_editor.connection.alias)


def drop_cache_table(apps, schema_editor):
    """Reversal is a documented no-op to avoid dropping shared or pre-existing cache tables across processes; drop manually if cleanup is needed."""
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0012_remove_projectfacultyreview_uq_project_faculty_review_stage_and_more"),
    ]

    operations = [
        migrations.RunPython(create_cache_table, drop_cache_table),
    ]
