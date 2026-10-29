from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from core.models import AppUser, AuditEvent, Role


User = get_user_model()


class AuditActivityApiTests(TestCase):
    def setUp(self):
        self.admin = self.make_user("audit-admin", Role.ADMIN)
        self.student = self.make_user("audit-student", Role.STUDENT)
        self.event_details = {
            "actor_user_id": self.admin.id,
            "before": {"name": "QA Test Department", "is_active": True},
            "after": {"name": "QA Test Department", "is_active": False},
        }
        self.event = AuditEvent.objects.create(
            actor=self.admin,
            event_type="DEPARTMENT_UPDATED",
            entity_type="Department",
            entity_id=17,
            details_json=self.event_details,
        )

    def make_user(self, username, role):
        user = User.objects.create_user(username=username, password="test-password")
        AppUser.objects.create(user=user, role_code_id=role)
        return user

    def test_admin_can_fetch_audit_event_without_mutating_nested_history(self):
        client = APIClient()
        client.force_authenticate(user=self.admin)

        response = client.get("/api/admin/audit-events/")

        self.assertEqual(response.status_code, 200)
        payload = response.data["results"][0]
        self.assertEqual(payload["id"], self.event.id)
        self.assertEqual(payload["details_json"], self.event_details)
        self.event.refresh_from_db()
        self.assertEqual(self.event.details_json, self.event_details)

    def test_audit_event_feed_remains_admin_only(self):
        client = APIClient()
        self.assertEqual(client.get("/api/admin/audit-events/").status_code, 401)

        client.force_authenticate(user=self.student)
        self.assertEqual(client.get("/api/admin/audit-events/").status_code, 403)
