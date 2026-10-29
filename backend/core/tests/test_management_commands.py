import os
from io import StringIO
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.management import call_command, CommandError
from django.test import TestCase
from rest_framework.test import APIClient

from core.models import AppUser, Department, Role


User = get_user_model()


class ManagementCommandTests(TestCase):
    def setUp(self):
        for role_code, _label in Role.ROLE_CHOICES:
            Role.objects.get_or_create(role_code=role_code)

    def create_admin(self, username="new-app-admin", password="Safe-Admin-Password-947!", **extra):
        output = StringIO()
        with patch.dict(os.environ, {"APP_ADMIN_PASSWORD": password}):
            call_command(
                "create_app_admin", "--username", username,
                "--email", f"{username}@example.edu", stdout=output, **extra,
            )
        return output.getvalue()

    def test_create_app_admin_can_log_in_and_call_admin_api(self):
        self.create_admin()
        created = User.objects.get(username="new-app-admin")
        self.assertEqual(created.app_profile.role_code_id, Role.ADMIN)
        self.assertIsNone(created.app_profile.department)

        client = APIClient()
        login = client.post(
            "/api/auth/login/",
            {
                "username": created.username,
                "password": "Safe-Admin-Password-947!",
                "expected_role": Role.ADMIN,
            },
            format="json",
        )
        self.assertEqual(login.status_code, 200, login.data)
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['access']}")
        response = client.get("/api/admin/users/")
        self.assertEqual(response.status_code, 200, response.data)

    def test_create_app_admin_rejects_weak_password_and_duplicate_username(self):
        with self.assertRaises(CommandError):
            self.create_admin(password="weak")

        self.create_admin()
        with patch.dict(os.environ, {"APP_ADMIN_PASSWORD": "Another-Safe-Password-903!"}):
            with self.assertRaises(CommandError):
                call_command(
                    "create_app_admin", "--username", "new-app-admin",
                    "--email", "duplicate@example.edu", stdout=StringIO(),
                )

    def make_demo(self, username, active=True):
        user = User.objects.create_user(username=username, email=f"{username}@example.edu", password="Demo-Account-278!")
        AppUser.objects.create(user=user, role_code=Role.objects.get(role_code=Role.STUDENT), is_active=active)
        return user

    def test_deactivate_demo_dry_run_and_apply_only_match_suffix(self):
        demo = self.make_demo("student_demo")
        unrelated = self.make_demo("student-live")

        output = StringIO()
        call_command("deactivate_demo_accounts", stdout=output)
        demo.refresh_from_db()
        self.assertTrue(demo.is_active)
        self.assertTrue(demo.app_profile.is_active)
        self.assertIn("username=student_demo", output.getvalue())

        call_command("deactivate_demo_accounts", "--apply", stdout=StringIO())
        demo.refresh_from_db()
        unrelated.refresh_from_db()
        self.assertFalse(demo.is_active)
        self.assertFalse(demo.app_profile.is_active)
        self.assertTrue(unrelated.is_active)
        self.assertTrue(unrelated.app_profile.is_active)

        login = APIClient().post(
            "/api/auth/login/",
            {
                "username": demo.username,
                "password": "Demo-Account-278!",
                "expected_role": Role.STUDENT,
            },
            format="json",
        )
        self.assertEqual(login.status_code, 401)
