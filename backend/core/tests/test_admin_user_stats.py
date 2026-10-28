from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from core.models import AppUser, Role


User = get_user_model()


class AdminUserListStatusTests(TestCase):
    def setUp(self):
        self.admin = self.make_user("stats-admin", Role.ADMIN)
        self.make_user("active-student", Role.STUDENT)
        self.make_user("inactive-student", Role.STUDENT, is_active=False)
        self.make_user("active-faculty", Role.FACULTY)

    def make_user(self, username, role, is_active=True):
        user = User.objects.create_user(
            username=username,
            password="test-password",
            is_active=is_active,
        )
        AppUser.objects.create(user=user, role_code_id=role)
        return user

    def test_admin_user_list_includes_active_state_for_all_accounts(self):
        client = APIClient()
        client.force_authenticate(user=self.admin)

        response = client.get("/api/admin/users/?page_size=100")

        self.assertEqual(response.status_code, 200)
        rows = response.data["results"]
        self.assertEqual(response.data["count"], 4)
        self.assertEqual(
            {row["username"]: row["is_active"] for row in rows},
            {
                "stats-admin": True,
                "active-student": True,
                "inactive-student": False,
                "active-faculty": True,
            },
        )
