from django.db import migrations


SQL = r"""
-- 1) One active membership per student (Postgres partial unique index)
CREATE UNIQUE INDEX IF NOT EXISTS uq_core_projectmember_one_active_per_student
ON core_projectmember(student_id)
WHERE left_at IS NULL;

-- 2) One APPROVE per project (Postgres partial unique index)
CREATE UNIQUE INDEX IF NOT EXISTS uq_core_hoddecision_one_approve_per_project
ON core_projecthoddecision(project_id)
WHERE decision = 'APPROVE';

-- 3) One pending join request per (project, student)
CREATE UNIQUE INDEX IF NOT EXISTS uq_core_joinrequest_one_pending
ON core_projectjoinrequest(project_id, student_id)
WHERE status = 'PENDING';

-- 4) Trigger function: validate project status transitions + write history
CREATE OR REPLACE FUNCTION core_validate_project_status_transition() RETURNS trigger AS $$
DECLARE
    allowed integer;
    actor_id bigint;
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

        actor_id := NULLIF(current_setting('app.actor_user_id', true), '')::bigint;

        INSERT INTO core_projectstatushistory(project_id, from_status_code, to_status_code, changed_by_id, changed_at, note)
        VALUES (NEW.id, OLD.status_code, NEW.status_code, actor_id, NOW(), NULL);

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

DROP TRIGGER IF EXISTS trg_core_project_validate_transition ON core_project;
CREATE TRIGGER trg_core_project_validate_transition
BEFORE UPDATE OF status_code, approved_at ON core_project
FOR EACH ROW
EXECUTE FUNCTION core_validate_project_status_transition();

-- 4b) Trigger function: enforce mentor/leader roles and auto-add leader to members
CREATE OR REPLACE FUNCTION core_enforce_project_roles_and_leader_membership() RETURNS trigger AS $$
DECLARE
    mentor_role text;
    leader_role text;
BEGIN
    SELECT au.role_code INTO mentor_role FROM core_appuser au WHERE au.user_id = NEW.mentor_faculty_id;
    IF mentor_role IS DISTINCT FROM 'FACULTY' THEN
        RAISE EXCEPTION 'mentor_faculty must have role FACULTY';
    END IF;

    SELECT au.role_code INTO leader_role FROM core_appuser au WHERE au.user_id = NEW.team_leader_student_id;
    IF leader_role IS DISTINCT FROM 'STUDENT' THEN
        RAISE EXCEPTION 'team_leader_student must have role STUDENT';
    END IF;

    INSERT INTO core_projectmember(project_id, student_id, joined_at, left_at)
    VALUES (NEW.id, NEW.team_leader_student_id, NOW(), NULL)
    ON CONFLICT (project_id, student_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_core_project_roles_membership ON core_project;
CREATE TRIGGER trg_core_project_roles_membership
AFTER INSERT ON core_project
FOR EACH ROW
EXECUTE FUNCTION core_enforce_project_roles_and_leader_membership();

-- 5) Trigger function: enforce project member rules (max 4 active + student active uniqueness handled by partial index)
CREATE OR REPLACE FUNCTION core_enforce_project_member_rules() RETURNS trigger AS $$
DECLARE
    active_count integer;
    student_role text;
BEGIN
    SELECT au.role_code INTO student_role FROM core_appuser au WHERE au.user_id = NEW.student_id;
    IF student_role IS DISTINCT FROM 'STUDENT' THEN
        RAISE EXCEPTION 'project member must have role STUDENT';
    END IF;

    IF NEW.left_at IS NULL THEN
        SELECT COUNT(*) INTO active_count
        FROM core_projectmember
        WHERE project_id = NEW.project_id
          AND left_at IS NULL;

        IF active_count >= 4 THEN
            RAISE EXCEPTION 'Max group size exceeded (4 students per project)';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_core_projectmember_enforce ON core_projectmember;
CREATE TRIGGER trg_core_projectmember_enforce
BEFORE INSERT OR UPDATE OF left_at ON core_projectmember
FOR EACH ROW
EXECUTE FUNCTION core_enforce_project_member_rules();

-- 6) Trigger function: enforce join approval rules and auto-add membership
CREATE OR REPLACE FUNCTION core_enforce_join_request_rules() RETURNS trigger AS $$
DECLARE
    proj_status text;
    leader_id bigint;
    mentor_id bigint;
    active_count integer;
    student_role text;
BEGIN
    IF TG_OP = 'UPDATE' AND NEW.status = 'APPROVED' AND OLD.status IS DISTINCT FROM NEW.status THEN
        SELECT p.status_code, p.team_leader_student_id, p.mentor_faculty_id
          INTO proj_status, leader_id, mentor_id
        FROM core_project p
        WHERE p.id = NEW.project_id;

        IF proj_status IS DISTINCT FROM 'APPROVED' THEN
            RAISE EXCEPTION 'Join approvals only allowed for approved projects';
        END IF;

        IF NEW.reviewed_by_id IS NULL THEN
            RAISE EXCEPTION 'reviewed_by is required to approve join request';
        END IF;

        IF NEW.reviewed_by_id <> leader_id AND NEW.reviewed_by_id <> mentor_id THEN
            RAISE EXCEPTION 'Join request approver must be team leader or assigned mentor';
        END IF;

        SELECT COUNT(*) INTO active_count
        FROM core_projectmember
        WHERE project_id = NEW.project_id
          AND left_at IS NULL;

        IF active_count >= 4 THEN
            RAISE EXCEPTION 'Max group size exceeded (4 students per project)';
        END IF;

        SELECT au.role_code INTO student_role FROM core_appuser au WHERE au.user_id = NEW.student_id;
        IF student_role IS DISTINCT FROM 'STUDENT' THEN
            RAISE EXCEPTION 'Join request student must have role STUDENT';
        END IF;

        -- Insert membership (will fail if student already has active membership due to partial unique index)
        INSERT INTO core_projectmember(project_id, student_id, joined_at, left_at)
        VALUES (NEW.project_id, NEW.student_id, NOW(), NULL)
        ON CONFLICT (project_id, student_id) DO NOTHING;

        NEW.reviewed_at := COALESCE(NEW.reviewed_at, NOW());
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_core_joinrequest_enforce ON core_projectjoinrequest;
CREATE TRIGGER trg_core_joinrequest_enforce
BEFORE UPDATE OF status, reviewed_by_id, reviewed_at ON core_projectjoinrequest
FOR EACH ROW
EXECUTE FUNCTION core_enforce_join_request_rules();

-- 7) Trigger function: enforce progress updates only by leader on approved projects
CREATE OR REPLACE FUNCTION core_enforce_progress_update_rules() RETURNS trigger AS $$
DECLARE
    proj_status text;
    leader_id bigint;
BEGIN
    SELECT p.status_code, p.team_leader_student_id
      INTO proj_status, leader_id
    FROM core_project p
    WHERE p.id = NEW.project_id;

    IF proj_status IS DISTINCT FROM 'APPROVED' THEN
        RAISE EXCEPTION 'Progress updates only allowed for approved projects';
    END IF;

    IF NEW.updated_by_student_id <> leader_id THEN
        RAISE EXCEPTION 'Only team leader can create progress updates';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_core_progress_enforce ON core_projectprogressupdate;
CREATE TRIGGER trg_core_progress_enforce
BEFORE INSERT ON core_projectprogressupdate
FOR EACH ROW
EXECUTE FUNCTION core_enforce_progress_update_rules();

-- 8) Trigger function: enforce faculty comments only on approved projects
CREATE OR REPLACE FUNCTION core_enforce_comment_rules() RETURNS trigger AS $$
DECLARE
    proj_status text;
    faculty_role text;
BEGIN
    SELECT p.status_code INTO proj_status
    FROM core_project p
    WHERE p.id = NEW.project_id;

    IF proj_status IS DISTINCT FROM 'APPROVED' THEN
        RAISE EXCEPTION 'Comments only allowed for approved projects';
    END IF;

    SELECT au.role_code INTO faculty_role FROM core_appuser au WHERE au.user_id = NEW.faculty_id;
    IF faculty_role IS DISTINCT FROM 'FACULTY' THEN
        RAISE EXCEPTION 'Only FACULTY can comment';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_core_comment_enforce ON core_projectcomment;
CREATE TRIGGER trg_core_comment_enforce
BEFORE INSERT ON core_projectcomment
FOR EACH ROW
EXECUTE FUNCTION core_enforce_comment_rules();

-- 9) Trigger function: enforce HOD decisions actor role + single approval is handled by partial index
CREATE OR REPLACE FUNCTION core_enforce_hod_decision_role() RETURNS trigger AS $$
DECLARE
    hod_role text;
BEGIN
    SELECT au.role_code INTO hod_role FROM core_appuser au WHERE au.user_id = NEW.hod_id;
    IF hod_role IS DISTINCT FROM 'HOD' THEN
        RAISE EXCEPTION 'Only HOD can create HOD decisions';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_core_hoddecision_role ON core_projecthoddecision;
CREATE TRIGGER trg_core_hoddecision_role
BEFORE INSERT ON core_projecthoddecision
FOR EACH ROW
EXECUTE FUNCTION core_enforce_hod_decision_role();
"""


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0001_initial"),
    ]

    operations = [
        migrations.RunSQL(SQL),
    ]
