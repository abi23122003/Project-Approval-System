from django.contrib.auth import get_user_model
from rest_framework.test import APIClient, APITestCase

from core.config import MAX_UPLOAD_BYTES
from core.errors import ConflictError, ForbiddenError
from core.models import (
    AppUser,
    Department,
    Project,
    ProjectProgressUpdate,
    ProjectStatus,
    Role,
)
from core.services import add_progress_document, create_progress_update


User = get_user_model()


class ProgressAndRegistrationApiTests(APITestCase):
    def setUp(self):
        self.department = Department.objects.create(code="PROG", name="Progress Department")
        self.student = self.make_user("progress-student", Role.STUDENT, self.department)
        self.other_student = self.make_user("other-student", Role.STUDENT, self.department)
        self.faculty = self.make_user("progress-faculty", Role.FACULTY, self.department)
        self.hod = self.make_user("progress-hod", Role.HOD, self.department)
        self.admin = self.make_user("progress-admin", Role.ADMIN, None)
        self.project = self.make_project(self.student, ProjectStatus.APPROVED)

    def make_user(self, username, role_code, department, *, active=True):
        user = User.objects.create_user(
            username=username,
            email=f"{username}@example.edu",
            password="Str0ng-Test-Pass-91!",
            is_active=active,
        )
        AppUser.objects.create(
            user=user,
            role_code_id=role_code,
            department=department,
            is_active=active,
        )
        return user

    def make_project(self, leader, status):
        return Project.objects.create(
            department=self.department,
            mentor_faculty=self.faculty,
            team_leader_student=leader,
            title=f"Project for {leader.username}",
            abstract="Progress API test project",
            status=ProjectStatus.objects.get(status_code=status),
        )

    def client_as(self, user):
        client = APIClient()
        client.force_authenticate(user=user)
        return client

    def create_progress(self, user, project, *, percent=25, steps="Completed initial work"):
        return self.client_as(user).post(
            f"/api/projects/{project.id}/progress/",
            {"percent_complete": percent, "steps_completed": steps},
            format="json",
        )

    def create_document(self, user, update, **overrides):
        payload = {
            "storage_path": "client/controlled/path.pdf",
            "original_filename": "report.pdf",
            "mime_type": "application/pdf",
            "byte_size": 0,
        }
        payload.update(overrides)
        return self.client_as(user).post(
            f"/api/progress-updates/{update.id}/documents/",
            payload,
            format="json",
        )

    def test_progress_requires_approved_project_and_active_student_leader(self):
        submitted_project = self.make_project(self.other_student, ProjectStatus.SUBMITTED)
        not_approved = self.create_progress(self.other_student, submitted_project)
        non_leader = self.create_progress(self.other_student, self.project)
        hod = self.create_progress(self.hod, self.project)

        self.assertEqual(not_approved.status_code, 409, not_approved.data)
        self.assertEqual(not_approved.data["detail"], "Progress updates are only allowed for approved projects.")
        self.assertEqual(non_leader.status_code, 403, non_leader.data)
        self.assertEqual(hod.status_code, 403, hod.data)
        self.assertFalse(ProjectProgressUpdate.objects.filter(project=submitted_project).exists())

    def test_progress_serializer_rejects_out_of_range_and_non_integer_values(self):
        for value in (101, -1, "abc"):
            with self.subTest(percent_complete=value):
                response = self.create_progress(self.student, self.project, percent=value)
                self.assertEqual(response.status_code, 400, response.data)
                self.assertIn("percent_complete", response.data)

    def test_progress_serializer_rejects_blank_steps(self):
        for value in ("", "   "):
            with self.subTest(steps_completed=value):
                response = self.create_progress(self.student, self.project, steps=value)
                self.assertEqual(response.status_code, 400, response.data)
                self.assertIn("steps_completed", response.data)

    def test_valid_progress_update_is_created(self):
        response = self.create_progress(self.student, self.project, percent=100, steps="Final work complete")

        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response.data["percent_complete"], 100)
        self.assertEqual(response.data["steps_completed"], "Final work complete")

    def test_progress_service_rechecks_project_and_actor(self):
        with self.assertRaisesMessage(ConflictError, "Progress updates are only allowed for approved projects."):
            create_progress_update(
                actor=self.other_student,
                project=self.make_project(self.other_student, ProjectStatus.SUBMITTED),
                payload={"percent_complete": 10, "steps_completed": "Work"},
            )

        with self.assertRaisesMessage(ForbiddenError, "Only the active student project leader can add progress updates."):
            create_progress_update(
                actor=self.other_student,
                project=self.project,
                payload={"percent_complete": 10, "steps_completed": "Work"},
            )

    def test_document_filename_validation(self):
        update = ProjectProgressUpdate.objects.create(
            project=self.project,
            updated_by_student=self.student,
            percent_complete=10,
            steps_completed="Work",
        )
        for filename in ("../x.pdf", "a/b.pdf", "a\\b.pdf", "run.exe", "bad\nname.pdf"):
            with self.subTest(original_filename=filename):
                response = self.create_document(self.student, update, original_filename=filename)
                self.assertEqual(response.status_code, 400, response.data)
                self.assertIn("original_filename", response.data)

    def test_document_byte_size_and_mime_validation(self):
        update = ProjectProgressUpdate.objects.create(
            project=self.project,
            updated_by_student=self.student,
            percent_complete=10,
            steps_completed="Work",
        )
        for size in (-1, MAX_UPLOAD_BYTES + 1):
            with self.subTest(byte_size=size):
                response = self.create_document(self.student, update, byte_size=size)
                self.assertEqual(response.status_code, 400, response.data)
                self.assertIn("byte_size", response.data)
        bad_mime = self.create_document(self.student, update, mime_type="not a mime type")
        self.assertEqual(bad_mime.status_code, 400, bad_mime.data)
        self.assertIn("mime_type", bad_mime.data)

    def test_valid_document_uses_server_generated_storage_path(self):
        update = ProjectProgressUpdate.objects.create(
            project=self.project,
            updated_by_student=self.student,
            percent_complete=10,
            steps_completed="Work",
        )

        response = self.create_document(self.student, update, original_filename="Report.PDF")

        self.assertEqual(response.status_code, 201, response.data)
        expected_prefix = f"progress/{self.project.id}/{update.id}/"
        self.assertTrue(response.data["storage_path"].startswith(expected_prefix))
        self.assertNotEqual(response.data["storage_path"], "client/controlled/path.pdf")
        self.assertTrue(response.data["storage_path"].endswith("_Report.PDF"))

    def test_document_upload_rejects_another_leaders_update(self):
        other_project = self.make_project(self.other_student, ProjectStatus.APPROVED)
        update = ProjectProgressUpdate.objects.create(
            project=other_project,
            updated_by_student=self.other_student,
            percent_complete=10,
            steps_completed="Work",
        )

        response = self.create_document(self.student, update)

        self.assertEqual(response.status_code, 403, response.data)

    def test_document_upload_rejects_project_that_is_no_longer_approved(self):
        update = ProjectProgressUpdate.objects.create(
            project=self.project,
            updated_by_student=self.student,
            percent_complete=10,
            steps_completed="Work",
        )
        self.project.status = ProjectStatus.objects.get(status_code=ProjectStatus.SUBMITTED)
        self.project.save(update_fields=["status"])

        response = self.create_document(self.student, update)

        self.assertEqual(response.status_code, 409, response.data)

    def test_document_service_rechecks_leader_and_status(self):
        update = ProjectProgressUpdate.objects.create(
            project=self.project,
            updated_by_student=self.student,
            percent_complete=10,
            steps_completed="Work",
        )
        payload = {"original_filename": "report.pdf", "storage_path": "ignored", "byte_size": 0}

        with self.assertRaisesMessage(ForbiddenError, "Only the active student project leader can add project documents."):
            add_progress_document(actor=self.other_student, progress_update=update, payload=payload)

        self.project.status = ProjectStatus.objects.get(status_code=ProjectStatus.SUBMITTED)
        self.project.save(update_fields=["status"])
        with self.assertRaisesMessage(ConflictError, "Documents can only be added to progress updates for approved projects."):
            add_progress_document(actor=self.student, progress_update=update, payload=payload)

    def test_registration_normalizes_email_and_rejects_case_insensitive_duplicate(self):
        first = APIClient().post(
            "/api/auth/register/",
            {"email": "  Dup@x.com ", "password": "Str0ng-Test-Pass-91!", "role_code": Role.STUDENT},
            format="json",
        )
        second = APIClient().post(
            "/api/auth/register/",
            {"email": "dup@x.com", "password": "Other-Str0ng-Pass-82!", "role_code": Role.STUDENT},
            format="json",
        )

        self.assertEqual(first.status_code, 201, first.data)
        self.assertEqual(second.status_code, 409, second.data)
        self.assertEqual(second.data["detail"], "An account with this email already exists.")
        created = User.objects.get(pk=first.data["id"])
        self.assertEqual(created.username, "dup@x.com")
        self.assertEqual(created.email, "dup@x.com")

    def test_registration_validates_password_strength_and_accepts_strong_password(self):
        weak = APIClient().post(
            "/api/auth/register/",
            {"email": "weak@example.edu", "password": "12345678", "role_code": Role.STUDENT},
            format="json",
        )
        strong = APIClient().post(
            "/api/auth/register/",
            {"email": "strong@example.edu", "password": "Str0ng-Test-Pass-91!", "role_code": Role.STUDENT},
            format="json",
        )

        self.assertEqual(weak.status_code, 400, weak.data)
        self.assertIn("password", weak.data)
        self.assertEqual(strong.status_code, 201, strong.data)

    def test_admin_user_creation_validates_password_strength(self):
        response = self.client_as(self.admin).post(
            "/api/users/",
            {
                "username": "weak-admin-created",
                "email": "weak-admin-created@example.edu",
                "password": "12345678",
                "role_code": Role.STUDENT,
                "department": self.department.id,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400, response.data)
        self.assertIn("password", response.data)
        self.assertFalse(User.objects.filter(username="weak-admin-created").exists())

    def test_admin_user_email_is_lowercased_and_stripped(self):
        response = self.client_as(self.admin).post(
            "/api/users/",
            {
                "username": "preserved-username",
                "email": " Admin.Created@Example.edu ",
                "password": "Str0ng-Test-Pass-91!",
                "role_code": Role.STUDENT,
                "department": self.department.id,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201, response.data)
        created = User.objects.get(username="preserved-username")
        self.assertEqual(created.email, "admin.created@example.edu")
        self.assertEqual(created.username, "preserved-username")

    def test_root_redirects_to_json_health_endpoint(self):
        response = APIClient().get("/", follow=True)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok"})
