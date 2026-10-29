from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from core.errors import ConflictError
from core.models import (
    AppUser,
    AuditEvent,
    Department,
    Project,
    ProjectHodDecision,
    ProjectStatus,
    ProjectStatusHistory,
    ProjectStatusTransition,
    Role,
)
from core.serializers import ProjectUpdateSerializer
from core.services import create_hod_decision


User = get_user_model()


class ProjectApprovalTests(TestCase):
    def setUp(self):
        self.department = Department.objects.create(code="ENG", name="Engineering")
        self.student = self.make_user("student", Role.STUDENT)
        self.hod = self.make_user("hod", Role.HOD)
        self.faculty = self.make_user("faculty", Role.FACULTY)
        self.project = self.make_project(ProjectStatus.SUBMITTED)

    def make_user(self, username, role_code):
        user = User.objects.create_user(username=username, password="test-password")
        AppUser.objects.create(
            user=user,
            role_code=Role.objects.get(role_code=role_code),
            department=self.department,
        )
        return user

    def make_project(self, status_code, student=None):
        return Project.objects.create(
            department=self.department,
            mentor_faculty=self.faculty,
            team_leader_student=student or self.student,
            title="Approval test project",
            abstract="Test abstract",
            status=ProjectStatus.objects.get(status_code=status_code),
        )

    def test_approval_persists_project_decision_history_and_audit(self):
        decision = create_hod_decision(
            actor=self.hod,
            project=self.project,
            decision=ProjectHodDecision.APPROVE,
            reason="Meets the requirements",
        )

        self.project.refresh_from_db()
        self.assertEqual(self.project.status_id, ProjectStatus.APPROVED)
        self.assertIsNotNone(self.project.approved_at)
        self.assertEqual(decision.project_id, self.project.id)
        self.assertEqual(
            list(ProjectStatusHistory.objects.filter(project=self.project).values_list("to_status_id", flat=True)),
            [ProjectStatus.UNDER_REVIEW, ProjectStatus.APPROVED],
        )
        self.assertEqual(ProjectStatusHistory.objects.filter(project=self.project, changed_by=self.hod).count(), 2)
        self.assertTrue(AuditEvent.objects.filter(event_type="HOD_DECISION", entity_id=decision.id).exists())

    def test_rejection_persists_rejected_status_history_and_audit(self):
        decision = create_hod_decision(
            actor=self.hod,
            project=self.project,
            decision=ProjectHodDecision.REJECT,
            reason="Please revise the scope",
        )

        self.project.refresh_from_db()
        self.assertEqual(self.project.status_id, ProjectStatus.REJECTED)
        self.assertIsNone(self.project.approved_at)
        self.assertEqual(decision.decision, ProjectHodDecision.REJECT)
        history = ProjectStatusHistory.objects.filter(project=self.project).order_by("id")
        self.assertEqual(list(history.values_list("to_status_id", flat=True)), [
            ProjectStatus.UNDER_REVIEW,
            ProjectStatus.REJECTED,
        ])
        self.assertEqual(history.last().note, "Please revise the scope")
        self.assertTrue(AuditEvent.objects.filter(event_type="HOD_DECISION", entity_id=decision.id).exists())

    def test_invalid_transition_rolls_back_all_decision_side_effects(self):
        other_student = self.make_user("other-student", Role.STUDENT)
        project = self.make_project(ProjectStatus.DRAFT, student=other_student)

        with self.assertRaises(ConflictError):
            create_hod_decision(
                actor=self.hod,
                project=project,
                decision=ProjectHodDecision.APPROVE,
                reason=None,
            )

        project.refresh_from_db()
        self.assertEqual(project.status_id, ProjectStatus.DRAFT)
        self.assertFalse(ProjectHodDecision.objects.filter(project=project).exists())
        self.assertFalse(ProjectStatusHistory.objects.filter(project=project).exists())
        self.assertFalse(AuditEvent.objects.filter(event_type="HOD_DECISION").exists())

    def test_failure_after_intermediate_transition_rolls_back_all_writes(self):
        ProjectStatusTransition.objects.filter(
            from_status_id=ProjectStatus.UNDER_REVIEW,
            to_status_id=ProjectStatus.APPROVED,
        ).delete()

        with self.assertRaises(ConflictError):
            create_hod_decision(
                actor=self.hod,
                project=self.project,
                decision=ProjectHodDecision.APPROVE,
                reason="Should roll back",
            )

        self.project.refresh_from_db()
        self.assertEqual(self.project.status_id, ProjectStatus.SUBMITTED)
        self.assertFalse(ProjectHodDecision.objects.filter(project=self.project).exists())
        self.assertFalse(ProjectStatusHistory.objects.filter(project=self.project).exists())
        self.assertFalse(AuditEvent.objects.filter(event_type="HOD_DECISION").exists())

    def test_student_cannot_submit_hod_decision(self):
        client = APIClient()
        client.force_authenticate(user=self.student)

        response = client.post(
            f"/api/hod/projects/{self.project.id}/decision/",
            {"decision": ProjectHodDecision.APPROVE},
            format="json",
        )

        self.assertEqual(response.status_code, 403)
        self.project.refresh_from_db()
        self.assertEqual(self.project.status_id, ProjectStatus.SUBMITTED)
        self.assertFalse(ProjectHodDecision.objects.filter(project=self.project).exists())

    def test_student_cannot_change_status_to_approved_through_project_update(self):
        client = APIClient()
        client.force_authenticate(user=self.student)

        response = client.patch(
            f"/api/student/project/{self.project.id}/",
            {"status": ProjectStatus.APPROVED},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.project.refresh_from_db()
        self.assertEqual(self.project.status_id, ProjectStatus.SUBMITTED)

    def test_project_update_serializer_rejects_status(self):
        serializer = ProjectUpdateSerializer(
            self.project,
            data={"status": ProjectStatus.APPROVED},
            partial=True,
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("status", serializer.errors)

    def test_student_project_read_returns_persisted_status(self):
        create_hod_decision(
            actor=self.hod,
            project=self.project,
            decision=ProjectHodDecision.APPROVE,
            reason=None,
        )
        client = APIClient()
        client.force_authenticate(user=self.student)

        response = client.get("/api/student/project/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["status"], ProjectStatus.APPROVED)
