from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from core.models import AcademicTerm, AppUser, AuditEvent, Role


User = get_user_model()


class AcademicTermApiTests(TestCase):
    def setUp(self):
        self.admin = self.make_user("term-admin", Role.ADMIN)
        self.student = self.make_user("term-student", Role.STUDENT)

    def make_user(self, username, role):
        user = User.objects.create_user(username=username, password="test-password")
        AppUser.objects.create(user=user, role_code_id=role)
        return user

    def client_as(self, user):
        client = APIClient()
        client.force_authenticate(user=user)
        return client

    def payload(self, **overrides):
        return {
            "term_name": "Fall 2026",
            "start_date": "2026-08-24",
            "end_date": "2026-12-18",
            "is_active": False,
            **overrides,
        }

    def test_admin_creates_term_and_can_retrieve_it_afterward(self):
        client = self.client_as(self.admin)
        created = client.post("/api/admin/academic-terms/", self.payload(), format="json")

        self.assertEqual(created.status_code, 201, created.data)
        term_id = created.data["id"]
        self.assertTrue(AcademicTerm.objects.filter(pk=term_id, term_name="Fall 2026").exists())
        fetched = client.get(f"/api/admin/academic-terms/{term_id}/")
        self.assertEqual(fetched.status_code, 200)
        self.assertEqual(fetched.data["term_name"], "Fall 2026")
        self.assertEqual(AuditEvent.objects.filter(event_type="ACADEMIC_TERM_CREATED", entity_id=term_id).count(), 1)

    def test_admin_lists_and_updates_term(self):
        term = AcademicTerm.objects.create(term_name="Spring 2026", start_date="2026-01-01", end_date="2026-05-30")
        client = self.client_as(self.admin)
        listed = client.get("/api/admin/academic-terms/")
        updated = client.patch(f"/api/admin/academic-terms/{term.id}/", {"is_active": True}, format="json")
        self.assertEqual(listed.status_code, 200)
        self.assertEqual(len(listed.data), 1)
        self.assertTrue(updated.data["is_active"])
        self.assertEqual(AuditEvent.objects.filter(event_type="ACADEMIC_TERM_UPDATED", entity_id=term.id).count(), 1)

    def test_required_dates_and_name_and_date_order_are_validated_without_writes(self):
        client = self.client_as(self.admin)
        invalid_payloads = [
            ({"term_name": "", "start_date": "2026-01-01", "end_date": "2026-02-01"}, "term_name"),
            ({"term_name": "Term", "start_date": "", "end_date": "2026-02-01"}, "start_date"),
            ({"term_name": "Term", "start_date": "2026-01-01", "end_date": ""}, "end_date"),
            ({"term_name": "Term", "start_date": "2026-03-01", "end_date": "2026-02-01"}, "end_date"),
            ({"term_name": "Term", "start_date": "not-a-date", "end_date": "2026-02-01"}, "start_date"),
        ]
        for data, field in invalid_payloads:
            with self.subTest(field=field, data=data):
                response = client.post("/api/admin/academic-terms/", data, format="json")
                self.assertEqual(response.status_code, 400)
                self.assertIn(field, response.data)
        self.assertEqual(AcademicTerm.objects.count(), 0)
        self.assertEqual(AuditEvent.objects.filter(event_type__startswith="ACADEMIC_TERM_").count(), 0)

    def test_only_one_term_can_be_active(self):
        first = AcademicTerm.objects.create(term_name="Term One", start_date="2026-01-01", end_date="2026-05-01", is_active=True)
        response = self.client_as(self.admin).post(
            "/api/admin/academic-terms/", self.payload(term_name="Term Two", is_active=True), format="json"
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("is_active", response.data)
        self.assertTrue(AcademicTerm.objects.get(pk=first.pk).is_active)
        self.assertEqual(AcademicTerm.objects.count(), 1)

    def test_endpoint_requires_authenticated_admin_profile(self):
        self.assertIn(self.client_as(self.student).get("/api/admin/academic-terms/").status_code, (401, 403))
        self.assertIn(self.client_as(self.student).post("/api/admin/academic-terms/", self.payload(), format="json").status_code, (401, 403))
        self.assertIn(APIClient().get("/api/admin/academic-terms/").status_code, (401, 403))
        self.assertEqual(AcademicTerm.objects.count(), 0)
