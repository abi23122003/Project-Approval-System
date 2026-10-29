from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from core.models import AppUser, AuditEvent, Department, Role


User = get_user_model()


class DepartmentManagementTests(TestCase):
    def setUp(self):
        self.admin = self.make_user("department-admin", Role.ADMIN)
        self.student = self.make_user("department-student", Role.STUDENT)
        self.active = Department.objects.create(code="ENG", name="Engineering")
        self.inactive = Department.objects.create(code="OLD", name="Former Department", is_active=False)
        self.seeded = Department.objects.get(code="GEN")

    def make_user(self, username, role):
        user = User.objects.create_user(username=username, password="test-password")
        AppUser.objects.create(user=user, role_code_id=role)
        return user

    def client_as(self, user):
        client = APIClient()
        client.force_authenticate(user=user)
        return client

    def test_admin_lists_active_and_inactive_departments(self):
        response = self.client_as(self.admin).get("/api/admin/departments/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            {row["id"]: row["is_active"] for row in response.data},
            {self.seeded.id: True, self.active.id: True, self.inactive.id: False},
        )

    def test_admin_creates_department_and_audit_event_atomically(self):
        response = self.client_as(self.admin).post(
            "/api/admin/departments/",
            {"code": "SCI", "name": "Science"},
            format="json",
        )

        self.assertEqual(response.status_code, 201, response.data)
        department = Department.objects.get(code="SCI")
        self.assertTrue(department.is_active)
        event = AuditEvent.objects.get(event_type="DEPARTMENT_CREATED", entity_id=department.id)
        self.assertEqual(event.actor_id, self.admin.id)
        self.assertEqual(event.details_json["code"], "SCI")

    def test_admin_edits_and_activates_or_deactivates_department(self):
        client = self.client_as(self.admin)

        edited = client.patch(
            f"/api/admin/departments/{self.active.id}/",
            {"code": "COMP", "name": "Computing"},
            format="json",
        )
        deactivated = client.patch(
            f"/api/admin/departments/{self.active.id}/",
            {"is_active": False},
            format="json",
        )
        activated = client.patch(
            f"/api/admin/departments/{self.active.id}/",
            {"is_active": True},
            format="json",
        )

        self.assertEqual(edited.status_code, 200, edited.data)
        self.assertEqual((edited.data["code"], edited.data["name"]), ("COMP", "Computing"))
        self.assertFalse(deactivated.data["is_active"])
        self.assertTrue(activated.data["is_active"])
        events = AuditEvent.objects.filter(event_type="DEPARTMENT_UPDATED", entity_id=self.active.id)
        self.assertEqual(events.count(), 3)
        self.assertEqual(events.first().actor_id, self.admin.id)
        self.assertEqual(events.first().details_json["before"]["code"], "ENG")
        transitions = list(events.order_by("event_time").values_list("details_json", flat=True))
        self.assertEqual(
            [(row["before"]["is_active"], row["after"]["is_active"]) for row in transitions],
            [(True, True), (True, False), (False, True)],
        )

    def test_repeated_department_state_patch_does_not_create_duplicate_audit_event(self):
        client = self.client_as(self.admin)
        path = f"/api/admin/departments/{self.active.id}/"

        first = client.patch(path, {"is_active": False}, format="json")
        repeated = client.patch(path, {"is_active": False}, format="json")

        self.assertEqual(first.status_code, 200, first.data)
        self.assertEqual(repeated.status_code, 200, repeated.data)
        events = AuditEvent.objects.filter(event_type="DEPARTMENT_UPDATED", entity_id=self.active.id)
        self.assertEqual(events.count(), 1)
        event = events.get()
        self.assertTrue(event.details_json["before"]["is_active"])
        self.assertFalse(event.details_json["after"]["is_active"])

    def test_duplicate_code_or_name_is_rejected_without_changes(self):
        client = self.client_as(self.admin)
        duplicate_code = client.post(
            "/api/admin/departments/",
            {"code": "ENG", "name": "Another Name"},
            format="json",
        )
        duplicate_name = client.post(
            "/api/admin/departments/",
            {"code": "OTHER", "name": "Engineering"},
            format="json",
        )
        duplicate_update = client.patch(
            f"/api/admin/departments/{self.inactive.id}/",
            {"name": "Engineering"},
            format="json",
        )

        self.assertEqual(duplicate_code.status_code, 400)
        self.assertEqual(duplicate_name.status_code, 400)
        self.assertEqual(duplicate_update.status_code, 400)
        self.assertEqual(Department.objects.count(), 3)
        self.assertFalse(AuditEvent.objects.filter(event_type__startswith="DEPARTMENT_").exists())

    def test_missing_required_fields_are_rejected(self):
        response = self.client_as(self.admin).post(
            "/api/admin/departments/", {"code": "MISSING"}, format="json"
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("name", response.data)
        self.assertEqual(Department.objects.count(), 3)

    def test_inactive_department_cannot_be_assigned_when_creating_user(self):
        response = self.client_as(self.admin).post(
            "/api/admin/users/",
            {
                "username": "new-unassigned-user",
                "password": "test-password",
                "role_code": Role.STUDENT,
                "department": self.active.id,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201, response.data)

        inactive_assignment = self.client_as(self.admin).post(
            "/api/admin/users/",
            {
                "username": "new-inactive-user",
                "password": "test-password",
                "role_code": Role.STUDENT,
                "department": self.inactive.id,
            },
            format="json",
        )

        self.assertEqual(inactive_assignment.status_code, 400)
        self.assertFalse(User.objects.filter(username="new-inactive-user").exists())

    def test_department_admin_endpoints_require_authenticated_admin(self):
        anonymous = APIClient()
        student = self.client_as(self.student)

        for client in (anonymous, student):
            with self.subTest(client=client):
                self.assertEqual(client.get("/api/admin/departments/").status_code, 401 if client is anonymous else 403)
                self.assertEqual(
                    client.post("/api/admin/departments/", {"code": "NEW", "name": "New"}, format="json").status_code,
                    401 if client is anonymous else 403,
                )
                self.assertEqual(
                    client.patch(
                        f"/api/admin/departments/{self.active.id}/",
                        {"is_active": False},
                        format="json",
                    ).status_code,
                    401 if client is anonymous else 403,
                )

        self.assertTrue(self.active.is_active)
        self.assertEqual(Department.objects.count(), 3)
