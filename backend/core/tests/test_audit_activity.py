from unittest.mock import patch
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.core.cache import cache
from django.test import TestCase
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework.test import APIClient

from core.models import AppUser, AuditEvent, Role


User = get_user_model()


class AuditActivityApiTests(TestCase):
    def setUp(self):
        cache.clear()
        for code, _label in Role.ROLE_CHOICES:
            Role.objects.get_or_create(role_code=code)
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

    def tearDown(self):
        cache.clear()
        super().tearDown()

    def make_user(self, username, role):
        user = User.objects.create_user(username=username, email=f"{username}@example.edu", password="test-password-123!")
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

    def test_auth_events_recorded_and_visible_in_admin_audit_feed(self):
        client = APIClient()

        # 1. REGISTERED event
        reg_response = client.post(
            "/api/auth/register/",
            {
                "email": "newaudituser@example.edu",
                "password": "SecurePassword123!",
                "first_name": "Audit",
                "last_name": "User",
                "role_code": Role.STUDENT,
            },
            format="json",
        )
        self.assertEqual(reg_response.status_code, 201)
        reg_event = AuditEvent.objects.filter(event_type="REGISTERED").first()
        self.assertIsNotNone(reg_event)
        self.assertEqual(reg_event.details_json.get("username"), "newaudituser@example.edu")
        self.assertNotIn("password", str(reg_event.details_json).lower())

        # 2. LOGIN_SUCCEEDED event
        login_ok = client.post(
            "/api/auth/login/",
            {"username": "audit-student", "password": "test-password-123!", "expected_role": Role.STUDENT},
            format="json",
        )
        self.assertEqual(login_ok.status_code, 200)
        success_event = AuditEvent.objects.filter(event_type="LOGIN_SUCCEEDED").first()
        self.assertIsNotNone(success_event)
        self.assertEqual(success_event.details_json.get("username"), "audit-student")
        self.assertNotIn("password", str(success_event.details_json).lower())

        # 3. LOGIN_FAILED event
        login_fail = client.post(
            "/api/auth/login/",
            {"username": "audit-student", "password": "wrong-secret-password", "expected_role": Role.STUDENT},
            format="json",
        )
        self.assertEqual(login_fail.status_code, 401)
        fail_event = AuditEvent.objects.filter(event_type="LOGIN_FAILED").first()
        self.assertIsNotNone(fail_event)
        self.assertEqual(fail_event.details_json.get("username"), "audit-student")
        self.assertNotIn("password", str(fail_event.details_json).lower())
        self.assertNotIn("wrong-secret-password", str(fail_event.details_json))

        # 4. PASSWORD_RESET_COMPLETED event
        token = default_token_generator.make_token(self.student)
        uid = urlsafe_base64_encode(force_bytes(self.student.pk))
        reset_res = client.post(
            "/api/auth/password-reset/confirm/",
            {"uid": uid, "token": token, "new_password": "Another-New-Password-999!"},
            format="json",
        )
        self.assertEqual(reset_res.status_code, 204)
        reset_event = AuditEvent.objects.filter(event_type="PASSWORD_RESET_COMPLETED").first()
        self.assertIsNotNone(reset_event)
        self.assertEqual(reset_event.entity_id, self.student.id)
        self.assertNotIn("password", str(reset_event.details_json).lower())

        # Verify all are present in the admin audit events API view
        admin_client = APIClient()
        admin_client.force_authenticate(user=self.admin)
        feed = admin_client.get("/api/admin/audit-events/?limit=50")
        self.assertEqual(feed.status_code, 200)
        event_types = {item["event_type"] for item in feed.data["results"]}
        self.assertIn("REGISTERED", event_types)
        self.assertIn("LOGIN_SUCCEEDED", event_types)
        self.assertIn("LOGIN_FAILED", event_types)
        self.assertIn("PASSWORD_RESET_COMPLETED", event_types)

    def test_login_failed_truncates_oversized_username(self):
        client = APIClient()
        oversized = "a" * 300
        response = client.post(
            "/api/auth/login/",
            {"username": oversized, "password": "any-password", "expected_role": Role.STUDENT},
            format="json",
        )
        self.assertEqual(response.status_code, 401)
        fail_event = AuditEvent.objects.filter(event_type="LOGIN_FAILED").order_by("-id").first()
        self.assertIsNotNone(fail_event)
        self.assertEqual(len(fail_event.details_json.get("username")), 150)
        self.assertEqual(fail_event.details_json.get("username"), "a" * 150)

    def test_login_audit_write_failure_does_not_mask_authentication(self):
        client = APIClient()
        with patch.object(AuditEvent.objects, "create", side_effect=RuntimeError("Audit write failure")):
            # Invalid credentials still returns 401
            fail_resp = client.post(
                "/api/auth/login/",
                {"username": "audit-student", "password": "wrong-password", "expected_role": Role.STUDENT},
                format="json",
            )
            self.assertEqual(fail_resp.status_code, 401)

            # Valid credentials still returns 200
            ok_resp = client.post(
                "/api/auth/login/",
                {"username": "audit-student", "password": "test-password-123!", "expected_role": Role.STUDENT},
                format="json",
            )
            self.assertEqual(ok_resp.status_code, 200)
            self.assertIn("access", ok_resp.data)
