from unittest.mock import patch

from django.contrib.auth import get_user_model
from rest_framework.test import APIClient, APITestCase

from core.errors import ConflictError, ForbiddenError
from core.models import (
    AppUser,
    Department,
    Project,
    ProjectFacultyReview,
    ProjectJoinRequest,
    ProjectMember,
    ProjectStatus,
    Role,
)
from core.services import create_join_request, create_project, review_join_request


User = get_user_model()


class JoinRequestApiTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.department = Department.objects.create(code="JOIN", name="Join Requests")
        self.other_department = Department.objects.create(code="OTHER", name="Other Department")
        self.faculty = self.make_user(Role.FACULTY, self.department)
        self.leader = self.make_user(Role.STUDENT, self.department)
        self.hod = self.make_user(Role.HOD, self.department)
        self.admin = self.make_user(Role.ADMIN, None)

    def make_user(self, role, department, *, active=True):
        number = User.objects.count() + 1
        username = f"join-{role.lower()}-{number}"
        user = User.objects.create_user(
            username=username,
            email=f"{username}@example.edu",
            password="test-password",
            is_active=active,
        )
        AppUser.objects.create(user=user, role_code_id=role, department=department, is_active=active)
        return user

    def make_project(self, *, department=None, leader=None, mentor=None, status=ProjectStatus.APPROVED):
        leader = leader or self.make_user(Role.STUDENT, department or self.department)
        project = Project.objects.create(
            department=department or self.department,
            mentor_faculty=mentor or self.faculty,
            team_leader_student=leader,
            title=f"Project {leader.username}",
            abstract="Join request test project",
            status=ProjectStatus.objects.get(status_code=status),
        )
        ProjectMember.objects.get_or_create(project=project, student=leader)
        return project

    def client_as(self, user):
        client = APIClient()
        client.force_authenticate(user=user)
        return client

    def request_join(self, student, project):
        return self.client_as(student).post(
            "/api/join-requests/",
            {"project": project.id},
            format="json",
        )

    def test_join_unapproved_project_returns_conflict(self):
        project = self.make_project(status=ProjectStatus.SUBMITTED)
        student = self.make_user(Role.STUDENT, self.department)

        response = self.request_join(student, project)

        self.assertEqual(response.status_code, 409, response.data)
        self.assertFalse(ProjectJoinRequest.objects.filter(project=project, student=student).exists())

    def test_project_leader_cannot_request_to_join_own_project(self):
        project = self.make_project()

        response = self.request_join(project.team_leader_student, project)

        self.assertEqual(response.status_code, 409, response.data)
        self.assertFalse(ProjectJoinRequest.objects.filter(project=project).exists())

    def test_duplicate_pending_request_returns_conflict(self):
        project = self.make_project()
        student = self.make_user(Role.STUDENT, self.department)
        ProjectJoinRequest.objects.create(project=project, student=student)

        response = self.request_join(student, project)

        self.assertEqual(response.status_code, 409, response.data)
        self.assertEqual(ProjectJoinRequest.objects.filter(project=project, student=student).count(), 1)

    def test_student_from_another_department_cannot_request_to_join(self):
        project = self.make_project()
        student = self.make_user(Role.STUDENT, self.other_department)

        response = self.request_join(student, project)

        self.assertEqual(response.status_code, 409, response.data)
        self.assertIn("department", response.data["detail"].lower())

    def test_student_with_an_active_membership_elsewhere_cannot_request(self):
        project = self.make_project()
        student = self.make_user(Role.STUDENT, self.department)
        another_project = self.make_project()
        ProjectMember.objects.create(project=another_project, student=student)

        response = self.request_join(student, project)

        self.assertEqual(response.status_code, 409, response.data)
        self.assertIn("active member", response.data["detail"].lower())

    def test_student_who_leads_another_project_cannot_request(self):
        project = self.make_project()
        student = self.make_user(Role.STUDENT, self.department)
        self.make_project(leader=student)

        response = self.request_join(student, project)

        self.assertEqual(response.status_code, 409, response.data)
        self.assertIn("leads", response.data["detail"].lower())

    def test_project_at_four_active_members_rejects_new_request(self):
        project = self.make_project()
        for _ in range(3):
            ProjectMember.objects.create(project=project, student=self.make_user(Role.STUDENT, self.department))
        student = self.make_user(Role.STUDENT, self.department)

        response = self.request_join(student, project)

        self.assertEqual(response.status_code, 409, response.data)
        self.assertFalse(ProjectJoinRequest.objects.filter(project=project, student=student).exists())

    def test_member_limit_is_rechecked_when_request_is_approved(self):
        project = self.make_project()
        for _ in range(2):
            ProjectMember.objects.create(project=project, student=self.make_user(Role.STUDENT, self.department))
        requester = self.make_user(Role.STUDENT, self.department)
        request_response = self.request_join(requester, project)
        join_request = ProjectJoinRequest.objects.get(id=request_response.data["id"])
        ProjectMember.objects.create(project=project, student=self.make_user(Role.STUDENT, self.department))

        approval = self.client_as(project.team_leader_student).post(
            f"/api/join-requests/{join_request.id}/approve/",
            {},
            format="json",
        )

        self.assertEqual(request_response.status_code, 201, request_response.data)
        self.assertEqual(approval.status_code, 409, approval.data)
        self.assertFalse(ProjectMember.objects.filter(project=project, student=requester).exists())

    def test_leader_and_mentor_can_approve_different_requests(self):
        leader_project = self.make_project()
        leader_requester = self.make_user(Role.STUDENT, self.department)
        leader_request_response = self.request_join(leader_requester, leader_project)
        leader_approval = self.client_as(leader_project.team_leader_student).post(
            f"/api/join-requests/{leader_request_response.data['id']}/approve/",
            {},
            format="json",
        )

        mentor_project = self.make_project()
        mentor_requester = self.make_user(Role.STUDENT, self.department)
        mentor_request_response = self.request_join(mentor_requester, mentor_project)
        mentor_approval = self.client_as(self.faculty).post(
            f"/api/join-requests/{mentor_request_response.data['id']}/approve/",
            {},
            format="json",
        )

        self.assertEqual(leader_request_response.status_code, 201, leader_request_response.data)
        self.assertEqual(leader_approval.status_code, 200, leader_approval.data)
        self.assertTrue(ProjectMember.objects.filter(project=leader_project, student=leader_requester, left_at__isnull=True).exists())
        self.assertEqual(mentor_request_response.status_code, 201, mentor_request_response.data)
        self.assertEqual(mentor_approval.status_code, 200, mentor_approval.data)
        self.assertTrue(ProjectMember.objects.filter(project=mentor_project, student=mentor_requester, left_at__isnull=True).exists())

    def test_approved_request_cannot_be_approved_twice(self):
        project = self.make_project()
        student = self.make_user(Role.STUDENT, self.department)
        created = self.request_join(student, project)
        review_client = self.client_as(project.team_leader_student)
        path = f"/api/join-requests/{created.data['id']}/approve/"
        first = review_client.post(path, {}, format="json")
        second = review_client.post(path, {}, format="json")

        self.assertEqual(first.status_code, 200, first.data)
        self.assertEqual(second.status_code, 409, second.data)
        self.assertEqual(ProjectMember.objects.filter(project=project, student=student, left_at__isnull=True).count(), 1)

    def test_rejected_request_cannot_be_approved_and_rejection_creates_no_member(self):
        project = self.make_project()
        student = self.make_user(Role.STUDENT, self.department)
        created = self.request_join(student, project)
        review_client = self.client_as(project.team_leader_student)
        path = f"/api/join-requests/{created.data['id']}"
        rejected = review_client.post(f"{path}/reject/", {}, format="json")
        approve_after_rejection = review_client.post(f"{path}/approve/", {}, format="json")

        self.assertEqual(rejected.status_code, 200, rejected.data)
        self.assertEqual(approve_after_rejection.status_code, 409, approve_after_rejection.data)
        self.assertFalse(ProjectMember.objects.filter(project=project, student=student).exists())

    def test_unrelated_user_cannot_approve_request(self):
        project = self.make_project()
        student = self.make_user(Role.STUDENT, self.department)
        unrelated = self.make_user(Role.STUDENT, self.department)
        created = self.request_join(student, project)

        response = self.client_as(unrelated).post(
            f"/api/join-requests/{created.data['id']}/approve/",
            {},
            format="json",
        )

        self.assertEqual(created.status_code, 201, created.data)
        self.assertEqual(response.status_code, 403, response.data)
        self.assertEqual(ProjectJoinRequest.objects.get(pk=created.data["id"]).status, ProjectJoinRequest.PENDING)

    def test_student_can_cancel_own_pending_request_but_not_approved_request(self):
        pending_project = self.make_project()
        student = self.make_user(Role.STUDENT, self.department)
        pending = self.request_join(student, pending_project)
        client = self.client_as(student)
        cancelled = client.post(f"/api/join-requests/{pending.data['id']}/cancel/", {}, format="json")

        approved_project = self.make_project()
        approved_student = self.make_user(Role.STUDENT, self.department)
        approved_request = self.request_join(approved_student, approved_project)
        approved = self.client_as(approved_project.team_leader_student).post(
            f"/api/join-requests/{approved_request.data['id']}/approve/",
            {},
            format="json",
        )
        cancel_approved = self.client_as(approved_student).post(
            f"/api/join-requests/{approved_request.data['id']}/cancel/",
            {},
            format="json",
        )

        self.assertEqual(cancelled.status_code, 200, cancelled.data)
        self.assertEqual(cancelled.data["status"], ProjectJoinRequest.CANCELLED)
        self.assertEqual(approved.status_code, 200, approved.data)
        self.assertEqual(cancel_approved.status_code, 409, cancel_approved.data)

    def test_another_student_cannot_cancel_someone_elses_request(self):
        project = self.make_project()
        requester = self.make_user(Role.STUDENT, self.department)
        other_student = self.make_user(Role.STUDENT, self.department)
        created = self.request_join(requester, project)

        response = self.client_as(other_student).post(
            f"/api/join-requests/{created.data['id']}/cancel/",
            {},
            format="json",
        )

        self.assertEqual(response.status_code, 404)
        self.assertEqual(ProjectJoinRequest.objects.get(pk=created.data["id"]).status, ProjectJoinRequest.PENDING)

    def test_hod_user_list_is_department_scoped_and_admin_sees_everyone(self):
        other_hod = self.make_user(Role.HOD, self.other_department)
        other_student = self.make_user(Role.STUDENT, self.other_department)
        own_student = self.make_user(Role.STUDENT, self.department)
        hod_response = self.client_as(self.hod).get("/api/admin/users/")
        admin_response = self.client_as(self.admin).get("/api/admin/users/")
        hod_ids = {item["id"] for item in hod_response.data["results"]}
        admin_ids = {item["id"] for item in admin_response.data["results"]}

        self.assertEqual(hod_response.status_code, 200, hod_response.data)
        self.assertIn(own_student.id, hod_ids)
        self.assertNotIn(other_hod.id, hod_ids)
        self.assertNotIn(other_student.id, hod_ids)
        self.assertEqual(admin_response.status_code, 200, admin_response.data)
        self.assertIn(other_hod.id, admin_ids)
        self.assertIn(other_student.id, admin_ids)

    def test_student_approved_project_list_is_department_scoped(self):
        own_project = self.make_project(leader=self.make_user(Role.STUDENT, self.department))
        foreign_project = self.make_project(
            department=self.other_department,
            leader=self.make_user(Role.STUDENT, self.other_department),
        )

        response = self.client_as(self.leader).get("/api/student/projects/approved/")
        project_ids = {item["id"] for item in response.data["results"]}

        self.assertEqual(response.status_code, 200, response.data)
        self.assertIn(own_project.id, project_ids)
        self.assertNotIn(foreign_project.id, project_ids)

    def test_student_without_department_gets_empty_approved_project_list(self):
        unassigned_student = self.make_user(Role.STUDENT, None)
        self.make_project()

        response = self.client_as(unassigned_student).get("/api/student/projects/approved/")

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["results"], [])

    def test_create_project_works_when_database_trigger_already_added_leader_membership(self):
        faculty = self.make_user(Role.FACULTY, self.department)
        original_create = Project.objects.create

        def create_project_and_simulate_trigger(**kwargs):
            project = original_create(**kwargs)
            ProjectMember.objects.get_or_create(project=project, student=kwargs["team_leader_student"])
            return project

        with patch.object(Project.objects, "create", side_effect=create_project_and_simulate_trigger):
            project = create_project(
                actor=self.leader,
                payload={"mentor_faculty": faculty, "title": "Trigger-safe project", "abstract": "Test"},
            )

        self.assertEqual(project.team_leader_student_id, self.leader.id)
        self.assertEqual(ProjectMember.objects.filter(project=project, student=self.leader).count(), 1)

    def test_create_join_request_rejects_inactive_or_non_student_profiles(self):
        project = self.make_project()
        inactive = self.make_user(Role.STUDENT, self.department, active=False)
        faculty = self.make_user(Role.FACULTY, self.department)

        with self.assertRaises(ConflictError):
            create_join_request(actor=inactive, project=project)
        with self.assertRaises(ConflictError):
            create_join_request(actor=faculty, project=project)

    def test_review_service_rechecks_reviewer_identity(self):
        project = self.make_project()
        student = self.make_user(Role.STUDENT, self.department)
        created = self.request_join(student, project)
        join_request = ProjectJoinRequest.objects.get(pk=created.data["id"])
        unrelated = self.make_user(Role.FACULTY, self.department)

        with self.assertRaises(ForbiddenError):
            review_join_request(
                actor=unrelated,
                join_request=join_request,
                status=ProjectJoinRequest.APPROVED,
                note=None,
            )
