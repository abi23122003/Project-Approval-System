from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient, APITestCase

from core.models import (
    AppUser,
    Department,
    Project,
    ProjectFacultyReview,
    ProjectHodDecision,
    ProjectStatus,
    ProjectStatusHistory,
    Role,
)


User = get_user_model()


class ReviewRoundApiTests(APITestCase):
    def setUp(self):
        self.department = Department.objects.create(code="ROUND", name="Review Rounds")
        self.student = self.make_user("round-student", Role.STUDENT)
        self.faculty = self.make_user("round-faculty", Role.FACULTY)
        self.hod = self.make_user("round-hod", Role.HOD)

    def make_user(self, username, role_code):
        user = User.objects.create_user(
            username=username,
            email=f"{username}@example.edu",
            password="round-test-password",
        )
        AppUser.objects.create(user=user, role_code_id=role_code, department=self.department)
        return user

    def make_project(self, *, status=ProjectStatus.SUBMITTED, student=None, stages=1, parallel=False):
        return Project.objects.create(
            department=self.department,
            mentor_faculty=self.faculty,
            team_leader_student=student or self.student,
            title="Configured review round",
            abstract="Review round test project",
            status=ProjectStatus.objects.get(status_code=status),
            submitted_at=timezone.now() if status == ProjectStatus.SUBMITTED else None,
            workflow_review_stages=stages,
            workflow_require_hod_approval=True,
            workflow_parallel_reviews=parallel,
        )

    def client_as(self, user):
        client = APIClient()
        client.force_authenticate(user=user)
        return client

    def test_hod_rejection_resubmission_and_approval_use_round_two(self):
        project = self.make_project(stages=1)
        hod_client = self.client_as(self.hod)
        rejected = hod_client.post(
            f"/api/hod/projects/{project.id}/decision/",
            {"decision": ProjectHodDecision.REJECT, "reason": "Please revise."},
            format="json",
        )
        project.refresh_from_db()
        self.assertEqual(rejected.status_code, 201, rejected.data)
        self.assertEqual(project.status_id, ProjectStatus.REJECTED)
        self.assertEqual(project.review_round, 1)

        resubmitted = self.client_as(self.student).patch(
            f"/api/student/project/{project.id}/",
            {"status": ProjectStatus.SUBMITTED},
            format="json",
        )
        project.refresh_from_db()
        self.assertEqual(resubmitted.status_code, 200, resubmitted.data)
        self.assertEqual(project.review_round, 2)
        self.assertTrue(ProjectHodDecision.objects.filter(
            project=project,
            review_round=1,
            decision=ProjectHodDecision.REJECT,
        ).exists())

        faculty_response = self.client_as(self.faculty).post(
            f"/api/faculty/projects/{project.id}/review/",
            {"decision": ProjectFacultyReview.APPROVE, "reason": "Round two stage one."},
            format="json",
        )
        project.refresh_from_db()
        self.assertEqual(faculty_response.status_code, 201, faculty_response.data)
        self.assertEqual(faculty_response.data["review_round"], 2)

        approved = hod_client.post(
            f"/api/hod/projects/{project.id}/decision/",
            {"decision": ProjectHodDecision.APPROVE},
            format="json",
        )
        project.refresh_from_db()
        self.assertEqual(approved.status_code, 201, approved.data)
        self.assertEqual(project.status_id, ProjectStatus.APPROVED)
        self.assertEqual(project.review_round, 2)
        self.assertIsNotNone(project.approved_at)
        self.assertEqual(ProjectHodDecision.objects.filter(project=project).count(), 2)
        self.assertTrue(ProjectHodDecision.objects.filter(
            project=project,
            review_round=2,
            decision=ProjectHodDecision.APPROVE,
        ).exists())
        self.assertEqual(ProjectStatusHistory.objects.filter(project=project).count(), 5)

    def test_faculty_stage_and_queues_only_count_the_current_round(self):
        project = self.make_project(stages=2)
        faculty_client = self.client_as(self.faculty)
        first_round_review = faculty_client.post(
            f"/api/faculty/projects/{project.id}/review/",
            {"decision": ProjectFacultyReview.APPROVE, "reason": "Round one stage one."},
            format="json",
        )
        self.assertEqual(first_round_review.status_code, 201, first_round_review.data)
        self.assertEqual(first_round_review.data["review_round"], 1)

        rejected = self.client_as(self.hod).post(
            f"/api/hod/projects/{project.id}/decision/",
            {"decision": ProjectHodDecision.REJECT, "reason": "Restart the review."},
            format="json",
        )
        project.refresh_from_db()
        self.assertEqual(rejected.status_code, 201, rejected.data)
        self.assertEqual(project.status_id, ProjectStatus.REJECTED)

        resubmitted = self.client_as(self.student).patch(
            f"/api/student/project/{project.id}/",
            {"status": ProjectStatus.SUBMITTED},
            format="json",
        )
        project.refresh_from_db()
        self.assertEqual(resubmitted.status_code, 200, resubmitted.data)
        self.assertEqual(project.review_round, 2)

        hod_queue = self.client_as(self.hod).get("/api/hod/projects/")
        faculty_queue = faculty_client.get("/api/faculty/projects/review-queue/")
        self.assertIn(project.id, [item["id"] for item in hod_queue.data["results"]])
        self.assertIn(project.id, [item["id"] for item in faculty_queue.data["results"]])

        second_round_review = faculty_client.post(
            f"/api/faculty/projects/{project.id}/review/",
            {"decision": ProjectFacultyReview.APPROVE, "reason": "Round two stage one."},
            format="json",
        )
        self.assertEqual(second_round_review.status_code, 201, second_round_review.data)
        self.assertEqual(second_round_review.data["review_round"], 2)
        self.assertEqual(second_round_review.data["stage"], 1)
        self.assertEqual(second_round_review.data["remaining_stages"], 1)
        self.assertEqual(
            list(ProjectFacultyReview.objects.filter(project=project).order_by("review_round").values_list("review_round", "stage")),
            [(1, 1), (2, 1)],
        )
        current_queue = faculty_client.get("/api/faculty/projects/review-queue/")
        self.assertIn(project.id, [item["id"] for item in current_queue.data["results"]])

    def test_first_submission_keeps_review_round_one(self):
        draft_student = self.make_user("round-draft-student", Role.STUDENT)
        project = self.make_project(status=ProjectStatus.DRAFT, student=draft_student, stages=1)

        response = self.client_as(draft_student).patch(
            f"/api/student/project/{project.id}/",
            {"status": ProjectStatus.SUBMITTED},
            format="json",
        )

        project.refresh_from_db()
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(project.status_id, ProjectStatus.SUBMITTED)
        self.assertEqual(project.review_round, 1)
        self.assertIsNotNone(project.submitted_at)
