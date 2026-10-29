from django.contrib.auth import get_user_model
from rest_framework.test import APIClient, APITestCase

from core.models import (
    AppUser,
    Department,
    Project,
    ProjectHodDecision,
    ProjectStatus,
    Role,
)


User = get_user_model()


class ProjectSecurityAndStatusTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.department = Department.objects.create(code="SEC", name="Security Studies")
        self.other_department = Department.objects.create(code="OTH", name="Other Department")
        self.admin = self.make_user("security-admin", Role.ADMIN, self.department)
        self.hod = self.make_user("security-hod", Role.HOD, self.department)
        self.faculty = self.make_user("security-faculty", Role.FACULTY, self.department)
        self.student = self.make_user("security-student", Role.STUDENT, self.department)
        self.other_faculty = self.make_user("other-faculty", Role.FACULTY, self.other_department)
        self.other_student = self.make_user("other-student", Role.STUDENT, self.department)

    def make_user(self, username, role_code, department):
        user = User.objects.create_user(
            username=username,
            email=f"{username}@example.edu",
            password="secure-test-password",
        )
        AppUser.objects.create(
            user=user,
            role_code=Role.objects.get(role_code=role_code),
            department=department,
        )
        return user

    def make_project(self, *, status_code=ProjectStatus.DRAFT, student=None, mentor=None):
        return Project.objects.create(
            department=self.department,
            mentor_faculty=mentor or self.faculty,
            team_leader_student=student or self.student,
            title="Original title",
            abstract="A project abstract",
            status=ProjectStatus.objects.get(status_code=status_code),
        )

    def authenticate(self, user):
        self.client.force_authenticate(user=user)

    def register(self, role_code):
        return self.client.post(
            "/api/auth/register/",
            {
                "email": f"new-{role_code.lower()}@example.edu",
                "password": "secure-password",
                "role_code": role_code,
            },
            format="json",
        )

    def test_public_registration_rejects_faculty_and_allows_student(self):
        faculty_response = self.register(Role.FACULTY)
        student_response = self.register(Role.STUDENT)

        self.assertEqual(faculty_response.status_code, 403, faculty_response.data)
        self.assertEqual(student_response.status_code, 201, student_response.data)
        self.assertTrue(AppUser.objects.filter(user__email="new-student@example.edu", role_code_id=Role.STUDENT).exists())

    def test_student_can_patch_own_draft_project_title(self):
        project = self.make_project(status_code=ProjectStatus.DRAFT)
        self.authenticate(self.student)

        response = self.client.patch(
            f"/api/student/project/{project.id}/",
            {"title": "Updated title"},
            format="json",
        )

        self.assertEqual(response.status_code, 200, response.data)
        project.refresh_from_db()
        self.assertEqual(project.title, "Updated title")

    def test_faculty_cannot_create_admin_through_users_endpoint(self):
        self.authenticate(self.faculty)

        response = self.client.post(
            "/api/users/",
            {
                "username": "attempted-admin",
                "email": "attempted-admin@example.edu",
                "password": "secure-password",
                "role_code": Role.ADMIN,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 403, response.data)
        self.assertFalse(User.objects.filter(username="attempted-admin").exists())

    def test_admin_can_create_student_through_users_endpoint(self):
        self.authenticate(self.admin)

        response = self.client.post(
            "/api/users/",
            {
                "username": "admin-created-student",
                "email": "admin-created-student@example.edu",
                "password": "secure-password",
                "role_code": Role.STUDENT,
                "department": self.department.id,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201, response.data)
        self.assertTrue(AppUser.objects.filter(user__username="admin-created-student", role_code_id=Role.STUDENT).exists())

    def test_student_create_rejects_approved_status_with_field_error(self):
        self.authenticate(self.student)

        response = self.client.post(
            "/api/student/project/",
            {"mentor_faculty": self.faculty.id, "title": "Proposal", "abstract": "Abstract", "status": "APPROVED"},
            format="json",
        )

        self.assertEqual(response.status_code, 400, response.data)
        self.assertIn("status", response.data)
        self.assertFalse(Project.objects.filter(team_leader_student=self.student).exists())

    def test_student_create_can_explicitly_create_draft(self):
        self.authenticate(self.student)

        response = self.client.post(
            "/api/student/project/",
            {"mentor_faculty": self.faculty.id, "title": "Draft proposal", "abstract": "Abstract", "status": "DRAFT"},
            format="json",
        )

        self.assertEqual(response.status_code, 201, response.data)
        project = Project.objects.get(team_leader_student=self.student)
        self.assertEqual(project.status_id, ProjectStatus.DRAFT)
        self.assertIsNone(project.submitted_at)

    def test_student_create_defaults_to_submitted_and_sets_timestamp(self):
        self.authenticate(self.student)

        response = self.client.post(
            "/api/student/project/",
            {"mentor_faculty": self.faculty.id, "title": "Submitted proposal", "abstract": "Abstract"},
            format="json",
        )

        self.assertEqual(response.status_code, 201, response.data)
        project = Project.objects.get(team_leader_student=self.student)
        self.assertEqual(project.status_id, ProjectStatus.SUBMITTED)
        self.assertIsNotNone(project.submitted_at)

    def test_student_patch_status_to_approved_is_rejected(self):
        project = self.make_project(status_code=ProjectStatus.DRAFT)
        self.authenticate(self.student)

        response = self.client.patch(
            f"/api/student/project/{project.id}/",
            {"status": ProjectStatus.APPROVED},
            format="json",
        )

        self.assertEqual(response.status_code, 400, response.data)
        self.assertIn("status", response.data)
        project.refresh_from_db()
        self.assertEqual(project.status_id, ProjectStatus.DRAFT)

    def test_student_can_submit_draft_and_submitted_at_is_set(self):
        project = self.make_project(status_code=ProjectStatus.DRAFT)
        self.authenticate(self.student)

        response = self.client.patch(
            f"/api/student/project/{project.id}/",
            {"status": ProjectStatus.SUBMITTED},
            format="json",
        )

        self.assertEqual(response.status_code, 200, response.data)
        project.refresh_from_db()
        self.assertEqual(project.status_id, ProjectStatus.SUBMITTED)
        self.assertIsNotNone(project.submitted_at)

    def test_student_can_resubmit_rejected_project_and_refreshes_submitted_at(self):
        project = self.make_project(status_code=ProjectStatus.REJECTED)
        self.authenticate(self.student)

        response = self.client.patch(
            f"/api/student/project/{project.id}/",
            {"status": ProjectStatus.SUBMITTED},
            format="json",
        )

        self.assertEqual(response.status_code, 200, response.data)
        project.refresh_from_db()
        self.assertEqual(project.status_id, ProjectStatus.SUBMITTED)
        self.assertIsNotNone(project.submitted_at)

    def test_student_cannot_edit_title_after_project_is_approved(self):
        project = self.make_project(status_code=ProjectStatus.APPROVED)
        self.authenticate(self.student)

        response = self.client.patch(
            f"/api/student/project/{project.id}/",
            {"title": "Attempted update"},
            format="json",
        )

        self.assertEqual(response.status_code, 409, response.data)
        self.assertEqual(response.data["detail"], "Project can no longer be edited.")
        project.refresh_from_db()
        self.assertEqual(project.title, "Original title")

    def test_student_cannot_select_student_as_project_mentor(self):
        self.authenticate(self.student)

        response = self.client.post(
            "/api/student/project/",
            {"mentor_faculty": self.other_student.id, "title": "Proposal", "abstract": "Abstract"},
            format="json",
        )

        self.assertEqual(response.status_code, 400, response.data)
        self.assertIn("mentor_faculty", response.data)

    def test_student_cannot_select_faculty_from_another_department(self):
        self.authenticate(self.student)

        response = self.client.post(
            "/api/student/project/",
            {"mentor_faculty": self.other_faculty.id, "title": "Proposal", "abstract": "Abstract"},
            format="json",
        )

        self.assertEqual(response.status_code, 400, response.data)
        self.assertIn("mentor_faculty", response.data)

    def test_student_cannot_update_mentor_to_faculty_from_another_department(self):
        project = self.make_project(status_code=ProjectStatus.DRAFT)
        self.authenticate(self.student)

        response = self.client.patch(
            f"/api/student/project/{project.id}/",
            {"mentor_faculty": self.other_faculty.id},
            format="json",
        )

        self.assertEqual(response.status_code, 400, response.data)
        self.assertIn("mentor_faculty", response.data)

    def test_hod_approval_sets_approved_status_and_timestamp(self):
        project = self.make_project(status_code=ProjectStatus.SUBMITTED)
        self.authenticate(self.hod)

        response = self.client.post(
            f"/api/hod/projects/{project.id}/decision/",
            {"decision": ProjectHodDecision.APPROVE},
            format="json",
        )

        self.assertEqual(response.status_code, 201, response.data)
        project.refresh_from_db()
        self.assertEqual(project.status_id, ProjectStatus.APPROVED)
        self.assertIsNotNone(project.approved_at)

    def test_hod_rejection_requires_nonblank_reason(self):
        project = self.make_project(status_code=ProjectStatus.SUBMITTED)
        self.authenticate(self.hod)

        response = self.client.post(
            f"/api/hod/projects/{project.id}/decision/",
            {"decision": ProjectHodDecision.REJECT},
            format="json",
        )

        self.assertEqual(response.status_code, 400, response.data)
        self.assertIn("reason", response.data)
        project.refresh_from_db()
        self.assertEqual(project.status_id, ProjectStatus.SUBMITTED)

    def test_hod_rejection_with_reason_sets_rejected_status(self):
        project = self.make_project(status_code=ProjectStatus.SUBMITTED)
        self.authenticate(self.hod)

        response = self.client.post(
            f"/api/hod/projects/{project.id}/decision/",
            {"decision": ProjectHodDecision.REJECT, "reason": "Please revise the proposal."},
            format="json",
        )

        self.assertEqual(response.status_code, 201, response.data)
        project.refresh_from_db()
        self.assertEqual(project.status_id, ProjectStatus.REJECTED)
        self.assertEqual(response.data["reason"], "Please revise the proposal.")

    def test_hod_cannot_decide_draft_project(self):
        project = self.make_project(status_code=ProjectStatus.DRAFT)
        self.authenticate(self.hod)

        response = self.client.post(
            f"/api/hod/projects/{project.id}/decision/",
            {"decision": ProjectHodDecision.APPROVE},
            format="json",
        )

        self.assertEqual(response.status_code, 409, response.data)
        self.assertEqual(response.data["detail"], "Project is not awaiting a decision.")
        self.assertFalse(ProjectHodDecision.objects.filter(project=project).exists())

    def test_hod_cannot_decide_already_approved_project_twice(self):
        project = self.make_project(status_code=ProjectStatus.SUBMITTED)
        self.authenticate(self.hod)
        first_response = self.client.post(
            f"/api/hod/projects/{project.id}/decision/",
            {"decision": ProjectHodDecision.APPROVE},
            format="json",
        )
        second_response = self.client.post(
            f"/api/hod/projects/{project.id}/decision/",
            {"decision": ProjectHodDecision.REJECT, "reason": "Late decision"},
            format="json",
        )

        self.assertEqual(first_response.status_code, 201, first_response.data)
        self.assertEqual(second_response.status_code, 409, second_response.data)
        self.assertEqual(second_response.data["detail"], "Project is not awaiting a decision.")
        self.assertEqual(ProjectHodDecision.objects.filter(project=project).count(), 1)
