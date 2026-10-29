from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from core.errors import ConflictError, ForbiddenError
from core.models import (
    AppUser,
    AuditEvent,
    Department,
    Project,
    ProjectFacultyReview,
    ProjectHodDecision,
    ProjectStatus,
    ProjectStatusHistory,
    Role,
    WorkflowConfiguration,
)
from core.services import create_faculty_project_review, create_hod_decision, create_project


User = get_user_model()


class WorkflowConfigurationApiTests(TestCase):
    def setUp(self):
        self.department = Department.objects.create(code="WF", name="Workflow Dept")
        self.admin = self.make_user("workflow-admin", Role.ADMIN)
        self.student = self.make_user("workflow-student", Role.STUDENT, self.department)

    def make_user(self, username, role, department=None):
        user = User.objects.create_user(username=username, password="test-password")
        AppUser.objects.create(user=user, role_code_id=role, department=department)
        return user

    def client_as(self, user):
        client = APIClient()
        client.force_authenticate(user=user)
        return client

    def payload(self, **overrides):
        return {
            "workflow_name": "Mentor and HOD Review",
            "review_stages": 2,
            "require_hod_approval": True,
            "parallel_reviews": False,
            **overrides,
        }

    def test_admin_creates_reads_and_updates_configuration_with_audit(self):
        client = self.client_as(self.admin)
        self.assertIsNone(client.get("/api/admin/workflow-configuration/").data)
        created = client.post("/api/admin/workflow-configuration/", self.payload(), format="json")
        self.assertEqual(created.status_code, 201, created.data)
        config_id = created.data["id"]
        self.assertEqual(client.get("/api/admin/workflow-configuration/").data["id"], config_id)
        self.assertEqual(client.get(f"/api/admin/workflow-configuration/{config_id}/").status_code, 200)
        duplicate = client.post("/api/admin/workflow-configuration/", self.payload(), format="json")
        self.assertEqual(duplicate.status_code, 409)
        updated = client.patch(
            f"/api/admin/workflow-configuration/{config_id}/",
            {"workflow_name": "Parallel Review", "parallel_reviews": True},
            format="json",
        )
        self.assertEqual(updated.status_code, 200, updated.data)
        self.assertEqual(updated.data["workflow_name"], "Parallel Review")
        self.assertTrue(updated.data["parallel_reviews"])
        self.assertEqual(AuditEvent.objects.filter(event_type__startswith="WORKFLOW_CONFIGURATION_").count(), 2)

    def test_configuration_validation_and_permissions(self):
        client = self.client_as(self.admin)
        invalid_payloads = [
            self.payload(workflow_name=" "),
            self.payload(review_stages=0),
            self.payload(review_stages=5),
            self.payload(require_hod_approval=False, parallel_reviews=True),
        ]
        for payload in invalid_payloads:
            response = client.post("/api/admin/workflow-configuration/", payload, format="json")
            self.assertEqual(response.status_code, 400, response.data)
        student = self.client_as(self.student)
        self.assertIn(student.get("/api/admin/workflow-configuration/").status_code, (401, 403))
        self.assertIn(student.post("/api/admin/workflow-configuration/", self.payload(), format="json").status_code, (401, 403))
        self.assertIn(APIClient().get("/api/admin/workflow-configuration/").status_code, (401, 403))
        self.assertEqual(WorkflowConfiguration.objects.count(), 0)

    def test_new_projects_snapshot_workflow_and_updates_do_not_change_snapshot(self):
        faculty = self.make_user("workflow-faculty", Role.FACULTY, self.department)
        WorkflowConfiguration.objects.create(**self.payload())
        project = create_project(actor=self.student, payload={"mentor_faculty": faculty, "title": "Snapshot test", "abstract": "Abstract"})
        self.assertEqual(project.workflow_review_stages, 2)
        self.assertTrue(project.workflow_require_hod_approval)
        self.assertFalse(project.workflow_parallel_reviews)
        configuration = WorkflowConfiguration.objects.get()
        configuration.review_stages = 4
        configuration.save()
        project.refresh_from_db()
        self.assertEqual(project.workflow_review_stages, 2)


class WorkflowApprovalTransitionTests(TestCase):
    def setUp(self):
        self.department = Department.objects.create(code="AP", name="Approvals")
        self.other_department = Department.objects.create(code="OT", name="Other")
        self.student = self.make_user("approval-student", Role.STUDENT, self.department)
        self.faculty = self.make_user("approval-faculty", Role.FACULTY, self.department)
        self.other_faculty = self.make_user("other-faculty", Role.FACULTY, self.other_department)
        self.hod = self.make_user("approval-hod", Role.HOD, self.department)

    def make_user(self, username, role, department):
        user = User.objects.create_user(username=username, password="test-password")
        AppUser.objects.create(user=user, role_code_id=role, department=department)
        return user

    def make_project(self, *, stages=2, require_hod=True, parallel=False):
        return Project.objects.create(
            department=self.department,
            mentor_faculty=self.faculty,
            team_leader_student=self.student,
            title="Workflow project",
            abstract="Workflow project abstract",
            status=ProjectStatus.objects.get(status_code=ProjectStatus.SUBMITTED),
            workflow_review_stages=stages,
            workflow_require_hod_approval=require_hod,
            workflow_parallel_reviews=parallel,
        )

    def test_sequential_stages_must_finish_before_hod_approval(self):
        project = self.make_project(stages=2, require_hod=True, parallel=False)
        first = create_faculty_project_review(actor=self.faculty, project=project, decision=ProjectFacultyReview.APPROVE, reason="Stage one")
        self.assertEqual(first.stage, 1)
        project.refresh_from_db()
        self.assertEqual(project.status_id, ProjectStatus.UNDER_REVIEW)
        with self.assertRaises(ConflictError):
            create_hod_decision(actor=self.hod, project=project, decision=ProjectHodDecision.APPROVE, reason=None)
        create_faculty_project_review(actor=self.faculty, project=project, decision=ProjectFacultyReview.APPROVE, reason="Stage two")
        create_hod_decision(actor=self.hod, project=project, decision=ProjectHodDecision.APPROVE, reason="Final approval")
        project.refresh_from_db()
        self.assertEqual(project.status_id, ProjectStatus.APPROVED)
        self.assertEqual(list(ProjectStatusHistory.objects.filter(project=project).values_list("to_status_id", flat=True)), [ProjectStatus.UNDER_REVIEW, ProjectStatus.APPROVED])

    def test_parallel_hod_approval_waits_for_all_faculty_stages(self):
        project = self.make_project(stages=2, require_hod=True, parallel=True)
        create_hod_decision(actor=self.hod, project=project, decision=ProjectHodDecision.APPROVE, reason="HOD ready")
        project.refresh_from_db()
        self.assertEqual(project.status_id, ProjectStatus.UNDER_REVIEW)
        create_faculty_project_review(actor=self.faculty, project=project, decision=ProjectFacultyReview.APPROVE, reason="Stage one")
        project.refresh_from_db()
        self.assertEqual(project.status_id, ProjectStatus.UNDER_REVIEW)
        create_faculty_project_review(actor=self.faculty, project=project, decision=ProjectFacultyReview.APPROVE, reason="Stage two")
        project.refresh_from_db()
        self.assertEqual(project.status_id, ProjectStatus.APPROVED)

    def test_faculty_approval_is_final_when_hod_is_not_required(self):
        project = self.make_project(stages=1, require_hod=False, parallel=False)
        create_faculty_project_review(actor=self.faculty, project=project, decision=ProjectFacultyReview.APPROVE, reason=None)
        project.refresh_from_db()
        self.assertEqual(project.status_id, ProjectStatus.APPROVED)
        with self.assertRaises(ConflictError):
            create_hod_decision(actor=self.hod, project=project, decision=ProjectHodDecision.APPROVE, reason=None)

    def test_rejection_by_either_reviewer_is_terminal(self):
        faculty_project = self.make_project(stages=3, parallel=True)
        create_faculty_project_review(actor=self.faculty, project=faculty_project, decision=ProjectFacultyReview.REJECT, reason="Needs revision")
        faculty_project.refresh_from_db()
        self.assertEqual(faculty_project.status_id, ProjectStatus.REJECTED)

        hod_project = Project.objects.create(
            department=self.department,
            mentor_faculty=self.faculty,
            team_leader_student=self.make_user("second-student", Role.STUDENT, self.department),
            title="Second workflow project",
            abstract="Abstract",
            status=ProjectStatus.objects.get(status_code=ProjectStatus.SUBMITTED),
            workflow_review_stages=2,
            workflow_require_hod_approval=True,
            workflow_parallel_reviews=False,
        )
        create_hod_decision(actor=self.hod, project=hod_project, decision=ProjectHodDecision.REJECT, reason="Not approved")
        hod_project.refresh_from_db()
        self.assertEqual(hod_project.status_id, ProjectStatus.REJECTED)

    def test_only_assigned_mentor_can_submit_faculty_review(self):
        project = self.make_project()
        with self.assertRaises(ForbiddenError):
            create_faculty_project_review(actor=self.other_faculty, project=project, decision=ProjectFacultyReview.APPROVE, reason=None)
        client = APIClient()
        client.force_authenticate(user=self.other_faculty)
        response = client.post(f"/api/faculty/projects/{project.id}/review/", {"decision": "APPROVE"}, format="json")
        self.assertEqual(response.status_code, 404)
        self.assertFalse(ProjectFacultyReview.objects.filter(project=project).exists())

    def test_review_api_records_decisions_and_exposes_remaining_stage_count(self):
        project = self.make_project(stages=2)
        client = APIClient()
        client.force_authenticate(user=self.faculty)
        first = client.post(f"/api/faculty/projects/{project.id}/review/", {"decision": "APPROVE"}, format="json")
        self.assertEqual(first.status_code, 201, first.data)
        self.assertEqual(first.data["stage"], 1)
        self.assertEqual(first.data["remaining_stages"], 1)
        second = client.post(f"/api/faculty/projects/{project.id}/review/", {"decision": "APPROVE"}, format="json")
        self.assertEqual(second.status_code, 201, second.data)
        self.assertEqual(second.data["remaining_stages"], 0)
        self.assertTrue(second.data["awaiting_hod"])

    def test_configured_faculty_and_hod_api_flow_approves_only_after_both_steps(self):
        project = self.make_project(stages=1, require_hod=True, parallel=False)
        faculty_client = APIClient()
        faculty_client.force_authenticate(user=self.faculty)
        faculty_response = faculty_client.post(
            f"/api/faculty/projects/{project.id}/review/",
            {"decision": "APPROVE", "reason": "Faculty approved"},
            format="json",
        )
        self.assertEqual(faculty_response.status_code, 201, faculty_response.data)
        project.refresh_from_db()
        self.assertEqual(project.status_id, ProjectStatus.UNDER_REVIEW)

        hod_client = APIClient()
        hod_client.force_authenticate(user=self.hod)
        hod_response = hod_client.post(
            f"/api/hod/projects/{project.id}/decision/",
            {"decision": "APPROVE"},
            format="json",
        )
        self.assertEqual(hod_response.status_code, 201, hod_response.data)
        project.refresh_from_db()
        self.assertEqual(project.status_id, ProjectStatus.APPROVED)
        self.assertTrue(ProjectFacultyReview.objects.filter(project=project, decision=ProjectFacultyReview.APPROVE).exists())
        self.assertTrue(ProjectHodDecision.objects.filter(project=project, decision=ProjectHodDecision.APPROVE).exists())

