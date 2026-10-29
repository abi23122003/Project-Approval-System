import re
from urllib.parse import parse_qs, urlparse
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.core import mail
from django.test import TestCase, override_settings
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework.test import APIClient

from core.models import AppUser, AuditEvent, Department, Role


User = get_user_model()


@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    DEFAULT_FROM_EMAIL="no-reply@example.edu",
    PASSWORD_RESET_FRONTEND_URL="https://app.example.edu/reset-password",
)
class UserAccountManagementTests(TestCase):
    def setUp(self):
        for code, _label in Role.ROLE_CHOICES:
            Role.objects.get_or_create(role_code=code)
        self.department = Department.objects.create(code="SCI", name="Science")
        self.admin = self.make_user("account-admin", Role.ADMIN)
        self.faculty = self.make_user("guide-demo", Role.FACULTY, self.department)
        self.faculty.email = "guide@example.edu"
        self.faculty.save(update_fields=["email"])
        self.faculty.is_active = False
        self.faculty.save(update_fields=["is_active"])
        self.faculty.app_profile.is_active = False
        self.faculty.app_profile.save(update_fields=["is_active"])
        self.client = APIClient()
        self.admin_client = self.client_as(self.admin)

    def make_user(self, username, role, department=None):
        user = User.objects.create_user(
            username=username,
            email=f"{username}@example.edu",
            password="Current-Password-472!",
        )
        AppUser.objects.create(user=user, role_code_id=role, department=department)
        return user

    def client_as(self, user):
        client = APIClient()
        client.force_authenticate(user=user)
        return client

    def test_admin_must_confirm_status_change_and_both_flags_change_with_audit(self):
        activated = self.admin_client.patch(
            f"/api/admin/users/{self.faculty.id}/status/", {"is_active": True}, format="json"
        )
        self.assertEqual(activated.status_code, 200, activated.data)
        self.faculty.refresh_from_db()
        self.faculty.app_profile.refresh_from_db()
        self.assertTrue(self.faculty.is_active)
        self.assertTrue(self.faculty.app_profile.is_active)
        self.assertTrue(activated.data["is_active"])
        self.assertEqual(AuditEvent.objects.filter(event_type="USER_STATUS_CHANGED").count(), 1)

        self.admin_client.patch(
            f"/api/admin/users/{self.faculty.id}/status/", {"is_active": True}, format="json"
        )
        self.assertEqual(AuditEvent.objects.filter(event_type="USER_STATUS_CHANGED").count(), 1)
        deactivated = self.admin_client.patch(
            f"/api/admin/users/{self.faculty.id}/status/", {"is_active": False}, format="json"
        )
        self.assertEqual(deactivated.status_code, 200)
        self.faculty.refresh_from_db()
        self.faculty.app_profile.refresh_from_db()
        self.assertFalse(self.faculty.is_active)
        self.assertFalse(self.faculty.app_profile.is_active)
        self.assertEqual(AuditEvent.objects.filter(event_type="USER_STATUS_CHANGED").count(), 2)

    def test_only_admin_can_change_status_or_request_password_reset(self):
        student = self.make_user("account-student", Role.STUDENT, self.department)
        anonymous = self.client.patch(
            f"/api/admin/users/{self.faculty.id}/status/", {"is_active": True}, format="json"
        )
        denied_status = self.client_as(student).patch(
            f"/api/admin/users/{self.faculty.id}/status/", {"is_active": True}, format="json"
        )
        denied_department = self.client_as(student).post(
            f"/api/admin/users/{self.faculty.id}/department/", {"department": self.department.id}, format="json"
        )
        denied_reset = self.client_as(student).post(f"/api/admin/users/{self.faculty.id}/password-reset/", {}, format="json")
        anonymous_reset = self.client.post(f"/api/admin/users/{self.faculty.id}/password-reset/", {}, format="json")

        self.assertEqual(anonymous.status_code, 401)
        self.assertEqual(denied_status.status_code, 403)
        self.assertEqual(denied_department.status_code, 403)
        self.assertEqual(denied_reset.status_code, 403)
        self.assertEqual(anonymous_reset.status_code, 401)
        self.assertFalse(self.faculty.is_active)
        self.assertEqual(len(mail.outbox), 0)

    def test_faculty_without_department_must_be_assigned_before_activation(self):
        unassigned = self.make_user("unassigned-guide", Role.FACULTY)
        unassigned.is_active = False
        unassigned.save(update_fields=["is_active"])
        unassigned.app_profile.is_active = False
        unassigned.app_profile.save(update_fields=["is_active"])

        denied = self.admin_client.patch(
            f"/api/admin/users/{unassigned.id}/status/", {"is_active": True}, format="json"
        )
        assigned = self.admin_client.post(
            f"/api/admin/users/{unassigned.id}/department/", {"department": self.department.id}, format="json"
        )
        activated = self.admin_client.patch(
            f"/api/admin/users/{unassigned.id}/status/", {"is_active": True}, format="json"
        )

        self.assertEqual(denied.status_code, 400)
        self.assertFalse(unassigned.is_active)
        self.assertEqual(assigned.status_code, 200)
        self.assertEqual(activated.status_code, 200, activated.data)
        unassigned.refresh_from_db()
        unassigned.app_profile.refresh_from_db()
        self.assertTrue(unassigned.is_active)
        self.assertTrue(unassigned.app_profile.is_active)
        self.assertEqual(unassigned.app_profile.department_id, self.department.id)

    def test_last_administrator_cannot_be_deactivated(self):
        response = self.admin_client.patch(
            f"/api/admin/users/{self.admin.id}/status/", {"is_active": False}, format="json"
        )
        self.assertEqual(response.status_code, 409)
        self.admin.refresh_from_db()
        self.admin.app_profile.refresh_from_db()
        self.assertTrue(self.admin.is_active)
        self.assertTrue(self.admin.app_profile.is_active)
        self.assertFalse(AuditEvent.objects.filter(event_type="USER_STATUS_CHANGED").exists())

    def test_deactivation_and_reactivation_invalidate_previously_issued_access_tokens(self):
        self.admin_client.patch(
            f"/api/admin/users/{self.faculty.id}/status/", {"is_active": True}, format="json"
        )
        login = self.client.post(
            "/api/auth/login/",
            {"username": self.faculty.username, "password": "Current-Password-472!", "expected_role": Role.FACULTY},
            format="json",
        )
        self.assertEqual(login.status_code, 200, login.data)
        self.admin_client.patch(
            f"/api/admin/users/{self.faculty.id}/status/", {"is_active": False}, format="json"
        )
        self.admin_client.patch(
            f"/api/admin/users/{self.faculty.id}/status/", {"is_active": True}, format="json"
        )

        stale_client = APIClient()
        stale_client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['access']}")
        stale_access = stale_client.get("/api/faculty/projects/mentored/")
        self.assertEqual(stale_access.status_code, 401)

    def test_admin_password_reset_sends_one_time_link_without_logging_secrets(self):
        login = self.client.post(
            "/api/auth/login/",
            {"username": self.faculty.username, "password": "Current-Password-472!", "expected_role": Role.FACULTY},
            format="json",
        )
        self.assertEqual(login.status_code, 401)  # This account is inactive until an admin activates it.
        self.admin_client.patch(f"/api/admin/users/{self.faculty.id}/status/", {"is_active": True}, format="json")
        login = self.client.post(
            "/api/auth/login/",
            {"username": self.faculty.username, "password": "Current-Password-472!", "expected_role": Role.FACULTY},
            format="json",
        )
        self.assertEqual(login.status_code, 200, login.data)

        response = self.admin_client.post(f"/api/admin/users/{self.faculty.id}/password-reset/", {}, format="json")
        self.assertEqual(response.status_code, 202, response.data)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["guide@example.edu"])
        self.assertNotIn("Current-Password-472!", mail.outbox[0].body)
        url = re.search(r"https://\S+", mail.outbox[0].body).group(0)
        query = parse_qs(urlparse(url).query)
        event = AuditEvent.objects.get(event_type="USER_PASSWORD_RESET_REQUESTED")
        self.assertNotIn("password", str(event.details_json).lower())
        self.assertNotIn("token", str(event.details_json).lower())

        confirmed = self.client.post(
            "/api/auth/password-reset/confirm/",
            {"uid": query["uid"][0], "token": query["token"][0], "new_password": "New-Strong-Password-358!"},
            format="json",
        )
        self.assertEqual(confirmed.status_code, 204, confirmed.data)
        old_password = self.client.post(
            "/api/auth/login/",
            {"username": self.faculty.username, "password": "Current-Password-472!", "expected_role": Role.FACULTY},
            format="json",
        )
        new_password = self.client.post(
            "/api/auth/login/",
            {"username": self.faculty.username, "password": "New-Strong-Password-358!", "expected_role": Role.FACULTY},
            format="json",
        )
        self.assertEqual(old_password.status_code, 401)
        self.assertEqual(new_password.status_code, 200)
        reused_refresh = self.client.post(
            "/api/auth/token/refresh/", {"refresh": login.data["refresh"]}, format="json"
        )
        stale_client = APIClient()
        stale_client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['access']}")
        stale_access = stale_client.get("/api/faculty/projects/mentored/")
        reused_reset_link = self.client.post(
            "/api/auth/password-reset/confirm/",
            {"uid": query["uid"][0], "token": query["token"][0], "new_password": "Another-Strong-Password-492!"},
            format="json",
        )
        self.assertEqual(reused_refresh.status_code, 401)
        self.assertEqual(stale_access.status_code, 401)
        self.assertEqual(reused_reset_link.status_code, 400)

    def test_password_reset_email_failure_and_invalid_link_do_not_change_password(self):
        with patch("core.views.send_mail", return_value=0):
            unavailable = self.admin_client.post(f"/api/admin/users/{self.faculty.id}/password-reset/", {}, format="json")
        weak_password = self.client.post(
            "/api/auth/password-reset/confirm/",
            {
                "uid": urlsafe_base64_encode(force_bytes(self.faculty.pk)),
                "token": default_token_generator.make_token(self.faculty),
                "new_password": "password",
            },
            format="json",
        )
        invalid = self.client.post(
            "/api/auth/password-reset/confirm/",
            {"uid": "invalid", "token": "invalid", "new_password": "New-Strong-Password-358!"},
            format="json",
        )

        self.assertEqual(unavailable.status_code, 503)
        self.assertEqual(weak_password.status_code, 400)
        self.assertEqual(invalid.status_code, 400)
        self.assertTrue(self.faculty.check_password("Current-Password-472!"))
        self.assertFalse(AuditEvent.objects.filter(event_type="USER_PASSWORD_RESET_REQUESTED").exists())

    def test_production_password_reset_refuses_console_email_backend(self):
        with override_settings(
            EMAIL_BACKEND="django.core.mail.backends.console.EmailBackend",
            IS_PRODUCTION=True,
        ):
            response = self.admin_client.post(f"/api/admin/users/{self.faculty.id}/password-reset/", {}, format="json")
        self.assertEqual(response.status_code, 503)
        self.assertIn("disabled for production", response.data["detail"])
        self.assertFalse(AuditEvent.objects.filter(event_type="USER_PASSWORD_RESET_REQUESTED").exists())
