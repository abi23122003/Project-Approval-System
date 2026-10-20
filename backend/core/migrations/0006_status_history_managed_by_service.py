from django.db import migrations


# Status history is now written by the transactional service layer. Keep the
# PostgreSQL trigger's transition guard, but remove its history insert so a
# decision creates exactly one history row per transition.
REPLACE_STATUS_TRIGGER = r"""
CREATE OR REPLACE FUNCTION core_validate_project_status_transition() RETURNS trigger AS $$
DECLARE
    allowed integer;
BEGIN
    IF TG_OP = 'UPDATE' AND NEW.status_code IS DISTINCT FROM OLD.status_code THEN
        SELECT 1 INTO allowed
        FROM core_projectstatustransition t
        WHERE t.from_status_code = OLD.status_code
          AND t.to_status_code = NEW.status_code
        LIMIT 1;

        IF allowed IS NULL THEN
            RAISE EXCEPTION 'Illegal project status transition: % -> %', OLD.status_code, NEW.status_code;
        END IF;

        IF NEW.status_code = 'APPROVED' AND NEW.approved_at IS NULL THEN
            NEW.approved_at := NOW();
        END IF;

        IF OLD.approved_at IS NOT NULL AND NEW.approved_at IS DISTINCT FROM OLD.approved_at THEN
            RAISE EXCEPTION 'approved_at is immutable once set';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
"""


def update_postgres_trigger(apps, schema_editor):
    if schema_editor.connection.vendor == "postgresql":
        with schema_editor.connection.cursor() as cursor:
            cursor.execute(REPLACE_STATUS_TRIGGER)


class Migration(migrations.Migration):
    dependencies = [("core", "0005_merge_0004_branches")]

    operations = [
        migrations.RunPython(update_postgres_trigger, migrations.RunPython.noop),
    ]
