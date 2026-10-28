from django.contrib.auth import get_user_model
from rest_framework.test import APIClient, APITestCase
from rest_framework_simplejwt.tokens import AccessToken

from core.models import AppUser, Role


User = get_user_model()


class AuthenticationTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        for code, label in Role.ROLE_CHOICES:
            Role.objects.get_or_create(role_code=code, defaults={"role_code": code})
            self.make_user(code.lower(), code)

    def make_user(self, username, role=None):
        user = User.objects.create_user(
            username=username,
            email=f"{username}@example.edu",
            password="correct-password",
        )
        if role:
            AppUser.objects.create(user=user, role_code_id=role)
        return user

    def test_each_role_authenticates_and_returns_authoritative_identity(self):
        for code, _label in Role.ROLE_CHOICES:
            with self.subTest(role=code):
                username = code.lower()
                response = self.client.post(
                    "/api/auth/login/",
                    {
                        "username": f"{username}@example.edu",
                        "password": "correct-password",
                        "expected_role": code,
                    },
                    format="json",
                )
                self.assertEqual(response.status_code, 200, response.data)
                self.assertEqual(response.data["user"]["role_code"], code)
                self.assertEqual(response.data["user"]["username"], username)
                self.assertEqual(AccessToken(response.data["access"])["role_code"], code)
                self.assertEqual(AccessToken(response.data["access"])["user_id"], response.data["user"]["id"])
                self.assertNotIn("password", response.data)

    def test_every_wrong_role_is_rejected_before_tokens_are_issued(self):
        for actual_role, _label in Role.ROLE_CHOICES:
            username = actual_role.lower()
            for expected_role, _expected_label in Role.ROLE_CHOICES:
                if expected_role == actual_role:
                    continue
                with self.subTest(actual=actual_role, expected=expected_role):
                    response = self.client.post(
                        "/api/auth/login/",
                        {
                            "username": f"{username}@example.edu",
                            "password": "correct-password",
                            "expected_role": expected_role,
                        },
                        format="json",
                    )
                    self.assertEqual(response.status_code, 403, response.data)
                    self.assertEqual(
                        response.data["detail"],
                        "Role mismatch: select the login area assigned to this account.",
                    )
                    self.assertNotIn("access", response.data)
                    self.assertNotIn("refresh", response.data)
                    self.assertNotIn("password", response.data)

    def test_invalid_credentials_and_unknown_user_are_rejected(self):
        for username, password in (("student@example.edu", "wrong-password"), ("missing@example.edu", "correct-password")):
            with self.subTest(username=username):
                response = self.client.post(
                    "/api/auth/login/",
                    {"username": username, "password": password, "expected_role": Role.STUDENT},
                    format="json",
                )
                self.assertEqual(response.status_code, 401)
                self.assertNotIn("access", response.data)
                self.assertNotIn("refresh", response.data)

    def test_account_without_active_role_profile_cannot_authenticate(self):
        user = self.make_user("no-profile")
        inactive = self.make_user("inactive-profile", Role.STUDENT)
        inactive.app_profile.is_active = False
        inactive.app_profile.save(update_fields=["is_active"])
        for username in (user.username, inactive.username):
            with self.subTest(username=username):
                response = self.client.post(
                    "/api/auth/login/",
                    {"username": username, "password": "correct-password", "expected_role": Role.STUDENT},
                    format="json",
                )
                self.assertEqual(response.status_code, 401)
                self.assertNotIn("access", response.data)

    def test_invalid_access_and_unauthenticated_protected_request_are_denied(self):
        self.client.credentials(HTTP_AUTHORIZATION="Bearer not-a-jwt")
        response = self.client.get("/api/admin/users/")
        self.assertEqual(response.status_code, 401)

    def test_refresh_rotates_tokens_and_rejects_role_profile_changes(self):
        login = self.client.post(
            "/api/auth/login/",
            {
                "username": "student@example.edu",
                "password": "correct-password",
                "expected_role": Role.STUDENT,
            },
            format="json",
        )
        refreshed = self.client.post(
            "/api/auth/token/refresh/", {"refresh": login.data["refresh"]}, format="json"
        )
        self.assertEqual(refreshed.status_code, 200, refreshed.data)
        self.assertIn("refresh", refreshed.data)
        self.assertNotEqual(refreshed.data["refresh"], login.data["refresh"])
        self.assertEqual(AccessToken(refreshed.data["access"])["role_code"], Role.STUDENT)
        reused = self.client.post(
            "/api/auth/token/refresh/", {"refresh": login.data["refresh"]}, format="json"
        )
        self.assertEqual(reused.status_code, 401)

        student = User.objects.get(username="student")
        student.app_profile.role_code_id = Role.FACULTY
        student.app_profile.save(update_fields=["role_code"])
        denied = self.client.post(
            "/api/auth/token/refresh/", {"refresh": refreshed.data["refresh"]}, format="json"
        )
        self.assertEqual(denied.status_code, 401)
        self.client.credentials()
        response = self.client.get("/api/admin/users/")
        self.assertEqual(response.status_code, 401)

    def test_logout_blacklists_refresh_and_cleared_client_is_denied(self):
        login = self.client.post(
            "/api/auth/login/",
            {
                "username": "admin@example.edu",
                "password": "correct-password",
                "expected_role": Role.ADMIN,
            },
            format="json",
        )
        self.assertEqual(login.status_code, 200, login.data)

        logout = self.client.post(
            "/api/auth/logout/", {"refresh": login.data["refresh"]}, format="json"
        )
        self.assertEqual(logout.status_code, 204)
        self.assertIsNone(logout.data)

        # Refresh blacklisting does not revoke an already-issued access JWT.
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['access']}")
        still_valid = self.client.get("/api/admin/users/")
        self.assertEqual(still_valid.status_code, 200)

        self.client.credentials()
        denied = self.client.get("/api/admin/users/")
        self.assertEqual(denied.status_code, 401)
        refresh_after_logout = self.client.post(
            "/api/auth/token/refresh/", {"refresh": login.data["refresh"]}, format="json"
        )
        self.assertEqual(refresh_after_logout.status_code, 401)

    def test_logout_rejects_missing_or_invalid_refresh_token(self):
        missing = self.client.post("/api/auth/logout/", {}, format="json")
        invalid = self.client.post("/api/auth/logout/", {"refresh": "not-a-token"}, format="json")

        self.assertEqual(missing.status_code, 401)
        self.assertEqual(invalid.status_code, 401)
