from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from core.models import (
    AppUser,
    Department,
    Project,
    ProjectComment,
    ProjectHodDecision,
    ProjectJoinRequest,
    ProjectProgressUpdate,
    ProjectStatus,
    ProjectStatusHistory,
    Role,
)


User = get_user_model()


class AuthorizationIntegrationTests(TestCase):
    def setUp(self):
        self.department_a = Department.objects.create(code="A", name="Department A")
        self.department_b = Department.objects.create(code="B", name="Department B")
        self.hod_a = self.make_user("hod-a", Role.HOD, self.department_a)
        self.hod_b = self.make_user("hod-b", Role.HOD, self.department_b)
        self.faculty_a = self.make_user("faculty-a", Role.FACULTY, self.department_a)
        self.faculty_b = self.make_user("faculty-b", Role.FACULTY, self.department_b)
        self.student_a = self.make_user("student-a", Role.STUDENT, self.department_a)
        self.student_b = self.make_user("student-b", Role.STUDENT, self.department_b)
        self.project_a = self.make_project(self.department_a, self.faculty_a, self.student_a)
        self.project_b = self.make_project(self.department_b, self.faculty_b, self.student_b)

    def make_user(self, username, role, department):
        user = User.objects.create_user(username=username, password="test-password")
        AppUser.objects.create(
            user=user,
            role_code=Role.objects.get(role_code=role),
            department=department,
        )
        return user

    def make_project(self, department, mentor, leader, status=ProjectStatus.SUBMITTED):
        return Project.objects.create(
            department=department,
            mentor_faculty=mentor,
            team_leader_student=leader,
            title=f"Project {department.code}",
            abstract="Test project",
            status=ProjectStatus.objects.get(status_code=status),
        )

    def client_as(self, user):
        client = APIClient()
        client.force_authenticate(user=user)
        return client

    def test_hod_project_list_and_detail_are_department_scoped(self):
        client = self.client_as(self.hod_a)

        listing = client.get("/api/hod/projects/")
        detail = client.get(f"/api/hod/projects/{self.project_b.id}/")

        self.assertEqual([p["id"] for p in listing.data["results"]], [self.project_a.id])
        self.assertEqual(detail.status_code, 404)

    def test_hod_cross_department_approval_and_lifecycle_are_hidden(self):
        client = self.client_as(self.hod_a)

        decision = client.post(
            f"/api/hod/projects/{self.project_b.id}/decision/",
            {"decision": ProjectHodDecision.APPROVE},
            format="json",
        )
        lifecycle = client.get(f"/api/hod/lifecycle/{self.project_b.id}/")

        self.assertEqual(decision.status_code, 404)
        self.assertEqual(lifecycle.status_code, 404)
        self.assertFalse(ProjectHodDecision.objects.filter(project=self.project_b).exists())
        self.assertFalse(ProjectStatusHistory.objects.filter(project=self.project_b).exists())

    def test_hod_approval_and_progress_lists_only_include_own_department(self):
        ProjectHodDecision.objects.create(project=self.project_a, hod=self.hod_a, decision="REJECT")
        ProjectHodDecision.objects.create(project=self.project_b, hod=self.hod_b, decision="REJECT")
        ProjectProgressUpdate.objects.create(
            project=self.project_a,
            updated_by_student=self.student_a,
            percent_complete=10,
            steps_completed="A",
        )
        ProjectProgressUpdate.objects.create(
            project=self.project_b,
            updated_by_student=self.student_b,
            percent_complete=20,
            steps_completed="B",
        )
        client = self.client_as(self.hod_a)

        approvals = client.get("/api/hod/approvals/")
        progress = client.get("/api/hod/progress/")

        self.assertEqual([item["project"] for item in approvals.data["results"]], [self.project_a.id])
        self.assertEqual([item["project"] for item in progress.data["results"]], [self.project_a.id])

    def test_hod_faculty_list_is_department_scoped_and_hod_users_are_department_scoped(self):
        response = self.client_as(self.hod_a).get("/api/hod/faculty/")
        readable_users = self.client_as(self.hod_a).get("/api/admin/users/")
        visible_user_ids = {item["id"] for item in readable_users.data["results"]}
        department_user_ids = set(
            User.objects.filter(app_profile__department=self.department_a).values_list("id", flat=True)
        )

        self.assertEqual([item["id"] for item in response.data["results"]], [self.faculty_a.id])
        self.assertEqual(readable_users.status_code, 200, readable_users.data)
        self.assertEqual(visible_user_ids, department_user_ids)
        self.assertNotIn(self.hod_b.id, visible_user_ids)

    def test_faculty_comment_and_progress_reads_require_mentor_assignment(self):
        assigned_student = self.make_user("assigned-student", Role.STUDENT, self.department_a)
        unrelated_student = self.make_user("unrelated-student", Role.STUDENT, self.department_b)
        approved_a = self.make_project(
            self.department_a, self.faculty_a, assigned_student, ProjectStatus.APPROVED
        )
        approved_b = self.make_project(
            self.department_b, self.faculty_b, unrelated_student, ProjectStatus.APPROVED
        )
        ProjectComment.objects.create(project=approved_b, faculty=self.faculty_b, comment_text="Private")
        ProjectProgressUpdate.objects.create(
            project=approved_b,
            updated_by_student=self.student_b,
            percent_complete=20,
            steps_completed="Private",
        )
        client = self.client_as(self.faculty_a)

        unrelated_comments = client.get(f"/api/faculty/projects/{approved_b.id}/comments/")
        unrelated_progress = client.get(f"/api/faculty/projects/{approved_b.id}/progress/")
        own_comments = client.get(f"/api/faculty/projects/{approved_a.id}/comments/")

        self.assertEqual(unrelated_comments.status_code, 404)
        self.assertEqual(unrelated_progress.status_code, 404)
        self.assertEqual(own_comments.status_code, 200)

    def test_join_request_get_is_scoped_and_supports_project_filter(self):
        own = ProjectJoinRequest.objects.create(project=self.project_a, student=self.student_b)
        unrelated = ProjectJoinRequest.objects.create(project=self.project_b, student=self.student_a)
        client = self.client_as(self.faculty_a)

        all_visible = client.get("/api/join-requests/")
        filtered = client.get(f"/api/join-requests/?project={self.project_b.id}")
        invalid = client.get("/api/join-requests/?project=not-an-id")

        self.assertEqual([item["id"] for item in all_visible.data["results"]], [own.id])
        self.assertEqual(filtered.data["results"], [])
        self.assertEqual(invalid.status_code, 400)
        self.assertNotIn(unrelated.id, [item["id"] for item in all_visible.data["results"]])

    def test_student_join_request_list_only_shows_own_and_led_project_requests(self):
        own = ProjectJoinRequest.objects.create(project=self.project_b, student=self.student_a)
        unrelated_student = self.make_user("requester-c", Role.STUDENT, self.department_b)
        unrelated = ProjectJoinRequest.objects.create(project=self.project_b, student=unrelated_student)
        response = self.client_as(self.student_a).get("/api/join-requests/")

        self.assertEqual([item["id"] for item in response.data["results"]], [own.id])
        self.assertNotIn(unrelated.id, [item["id"] for item in response.data["results"]])

    def test_reviewer_queue_is_faculty_scoped_and_does_not_grant_hod_access(self):
        approved_student_a = self.make_user("approved-student-a", Role.STUDENT, self.department_a)
        approved_student_b = self.make_user("approved-student-b", Role.STUDENT, self.department_b)
        approved_a = self.make_project(self.department_a, self.faculty_a, approved_student_a, ProjectStatus.APPROVED)
        approved_b = self.make_project(self.department_b, self.faculty_b, approved_student_b, ProjectStatus.APPROVED)
        queue = self.client_as(self.faculty_a).get("/api/faculty/projects/review-queue/")
        approved = self.client_as(self.faculty_a).get("/api/faculty/projects/approved/")
        hod_endpoint = self.client_as(self.faculty_a).get("/api/hod/projects/")

        self.assertEqual([item["id"] for item in queue.data["results"]], [self.project_a.id])
        self.assertEqual([item["id"] for item in approved.data["results"]], [approved_a.id])
        self.assertNotIn(approved_b.id, [item["id"] for item in approved.data["results"]])
        self.assertEqual(hod_endpoint.status_code, 403)

    def test_student_mentor_lookup_only_returns_active_faculty_in_assigned_department(self):
        inactive_faculty = self.make_user("inactive-faculty", Role.FACULTY, self.department_a)
        inactive_faculty.app_profile.is_active = False
        inactive_faculty.app_profile.save(update_fields=["is_active"])

        response = self.client_as(self.student_a).get("/api/student/mentors/")
        forbidden = self.client_as(self.hod_a).get("/api/student/mentors/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["department"]["id"], self.department_a.id)
        self.assertEqual([mentor["id"] for mentor in response.data["mentors"]], [self.faculty_a.id])
        self.assertEqual(forbidden.status_code, 403)

    def test_student_mentor_lookup_returns_an_empty_result_without_a_department_and_rejects_unauthorized_users(self):
        unassigned_student = self.make_user("unassigned-mentor-student", Role.STUDENT, None)
        unassigned_response = self.client_as(unassigned_student).get("/api/student/mentors/")
        submission_response = self.client_as(unassigned_student).post(
            "/api/student/project/",
            {"mentor_faculty": self.faculty_a.id, "title": "Unassigned department", "abstract": "Test"},
            format="json",
        )
        anonymous_response = APIClient().get("/api/student/mentors/")
        faculty_response = self.client_as(self.faculty_a).get("/api/student/mentors/")

        self.assertEqual(unassigned_response.status_code, 200)
        self.assertIsNone(unassigned_response.data["department"])
        self.assertEqual(unassigned_response.data["mentors"], [])
        self.assertEqual(submission_response.status_code, 400)
        self.assertEqual(anonymous_response.status_code, 401)
        self.assertEqual(faculty_response.status_code, 403)

    def test_project_submission_rejects_inactive_faculty_user_and_inactive_student_department(self):
        inactive_faculty_user = self.make_user("inactive-faculty-user", Role.FACULTY, self.department_a)
        inactive_faculty_user.is_active = False
        inactive_faculty_user.save(update_fields=["is_active"])
        inactive_user_response = self.client_as(self.student_a).post(
            "/api/student/project/",
            {"mentor_faculty": inactive_faculty_user.id, "title": "Inactive guide", "abstract": "Test"},
            format="json",
        )

        inactive_department = Department.objects.create(code="PAUSED", name="Paused Department", is_active=False)
        student_in_inactive_department = self.make_user("student-in-paused-dept", Role.STUDENT, inactive_department)
        faculty_in_inactive_department = self.make_user("faculty-in-paused-dept", Role.FACULTY, inactive_department)
        inactive_department_response = self.client_as(student_in_inactive_department).post(
            "/api/student/project/",
            {"mentor_faculty": faculty_in_inactive_department.id, "title": "Paused department", "abstract": "Test"},
            format="json",
        )

        self.assertEqual(inactive_user_response.status_code, 400)
        self.assertEqual(inactive_department_response.status_code, 400)
        self.assertFalse(Project.objects.filter(title__in=["Inactive guide", "Paused department"]).exists())

    def test_join_request_creation_requires_approved_project_and_valid_student(self):
        target_student = self.make_user("joiner", Role.STUDENT, self.department_b)
        client = self.client_as(target_student)
        pending_project = client.post(
            "/api/join-requests/",
            {"project": self.project_a.id},
            format="json",
        )
        self.project_b.status = ProjectStatus.objects.get(status_code=ProjectStatus.APPROVED)
        self.project_b.save(update_fields=["status"])
        valid = client.post(
            "/api/join-requests/",
            {"project": self.project_b.id},
            format="json",
        )
        duplicate = client.post(
            "/api/join-requests/",
            {"project": self.project_b.id},
            format="json",
        )

        self.assertEqual(pending_project.status_code, 409)
        self.assertEqual(valid.status_code, 201)
        self.assertEqual(duplicate.status_code, 409)

    def test_registration_creates_unassigned_student_and_rejects_privileged_role(self):
        inactive = Department.objects.create(code="OFF", name="Inactive Department", is_active=False)
        client = APIClient()
        departments = client.get("/api/departments/")
        valid = client.post(
            "/api/auth/register/",
            {
                "email": "new-student@example.edu",
                "password": "example-password",
                "role_code": Role.STUDENT,
            },
            format="json",
        )
        invalid_department = client.post(
            "/api/auth/register/",
            {
                "email": "inactive-student@example.edu",
                "password": "example-password",
                "role_code": Role.STUDENT,
                "department": inactive.id,
            },
            format="json",
        )
        privileged_role = client.post(
            "/api/auth/register/",
            {
                "email": "self-made-faculty@example.edu",
                "password": "example-password",
                "role_code": Role.FACULTY,
                "department": self.department_a.id,
            },
            format="json",
        )

        department_ids = {row["id"] for row in departments.data}
        self.assertTrue({self.department_a.id, self.department_b.id}.issubset(department_ids))
        self.assertNotIn(inactive.id, department_ids)
        self.assertEqual(valid.status_code, 201)
        created = User.objects.get(username="new-student@example.edu")
        self.assertIsNone(created.app_profile.department_id)
        self.assertEqual(created.app_profile.role_code_id, Role.STUDENT)
        self.assertEqual(invalid_department.status_code, 400)
        self.assertEqual(privileged_role.status_code, 400)

    def test_admin_can_assign_an_active_department_but_hod_cannot(self):
        admin = self.make_user("admin-a", Role.ADMIN, None)
        unassigned = self.make_user("unassigned", Role.STUDENT, None)
        payload = {
            "username": "assigned-student",
            "email": "assigned-student@example.edu",
            "password": "example-password",
            "role_code": Role.STUDENT,
            "department": self.department_a.id,
        }
        assigned = self.client_as(admin).post("/api/admin/users/", payload, format="json")
        assignment = self.client_as(admin).post(
            f"/api/admin/users/{unassigned.id}/department/",
            {"department": self.department_a.id},
            format="json",
        )
        denied = self.client_as(self.hod_a).post(
            "/api/admin/users/",
            {**payload, "username": "hod-created", "email": "hod-created@example.edu"},
            format="json",
        )
        project = self.client_as(unassigned).post(
            "/api/student/project/",
            {"mentor_faculty": self.faculty_a.id, "title": "No dept", "abstract": "Blocked"},
            format="json",
        )

        self.assertEqual(assigned.status_code, 201)
        self.assertEqual(User.objects.get(username="assigned-student").app_profile.department_id, self.department_a.id)
        self.assertEqual(assignment.status_code, 200)
        unassigned.app_profile.refresh_from_db()
        self.assertEqual(unassigned.app_profile.department_id, self.department_a.id)
        self.assertEqual(denied.status_code, 403)
        self.assertEqual(project.status_code, 400)

    def test_department_assignment_rejects_inactive_department_and_reassignment(self):
        admin = self.make_user("admin-assign", Role.ADMIN, None)
        unassigned = self.make_user("unassigned-assign", Role.STUDENT, None)
        inactive = Department.objects.create(code="OFF", name="Inactive", is_active=False)
        client = self.client_as(admin)

        invalid = client.post(
            f"/api/admin/users/{unassigned.id}/department/",
            {"department": inactive.id},
            format="json",
        )
        valid = client.post(
            f"/api/admin/users/{unassigned.id}/department/",
            {"department": self.department_a.id},
            format="json",
        )
        repeated = client.post(
            f"/api/admin/users/{unassigned.id}/department/",
            {"department": self.department_b.id},
            format="json",
        )

        self.assertEqual(invalid.status_code, 400)
        self.assertEqual(valid.status_code, 200)
        self.assertEqual(repeated.status_code, 409)
        unassigned.app_profile.refresh_from_db()
        self.assertEqual(unassigned.app_profile.department_id, self.department_a.id)

    def test_faculty_cannot_create_users_with_privileged_roles(self):
        response = self.client_as(self.faculty_a).post(
            "/api/users/",
            {
                "username": "faculty-created-admin",
                "email": "created-admin@example.edu",
                "password": "example-password",
                "role_code": Role.ADMIN,
                "department": self.department_a.id,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 403)
        self.assertFalse(User.objects.filter(username="faculty-created-admin").exists())

    def test_client_cannot_choose_project_department_or_foreign_mentor(self):
        new_student = self.make_user("proposal-student", Role.STUDENT, self.department_a)
        client = self.client_as(new_student)
        good = client.post(
            "/api/student/project/",
            {
                "mentor_faculty": self.faculty_a.id,
                "title": "Derived department",
                "abstract": "Server chooses department",
            },
            format="json",
        )
        foreign_mentor = client.post(
            "/api/student/project/",
            {
                "mentor_faculty": self.faculty_b.id,
                "title": "Foreign mentor",
                "abstract": "Must be rejected",
            },
            format="json",
        )

        self.assertEqual(good.status_code, 201)
        self.assertEqual(good.data["department"], self.department_a.id)
        self.assertEqual(good.data["status"], ProjectStatus.SUBMITTED)
        self.assertEqual(foreign_mentor.status_code, 400)

    def test_client_cannot_supply_project_department_or_initial_status(self):
        student = self.make_user("untrusted-project-student", Role.STUDENT, self.department_a)
        client = self.client_as(student)

        response = client.post(
            "/api/student/project/",
            {
                "department": self.department_b.id,
                "mentor_faculty": self.faculty_a.id,
                "title": "Attempted status bypass",
                "abstract": "Must be rejected",
                "status": ProjectStatus.APPROVED,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400, response.data)
        self.assertFalse(Project.objects.filter(team_leader_student=student).exists())
