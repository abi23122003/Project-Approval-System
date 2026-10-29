from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from core.models import AppUser, AuditEvent, GradingScale, Role


User = get_user_model()


class GradingScaleApiTests(TestCase):
    def setUp(self):
        self.admin = self.make_user("scale-admin", Role.ADMIN)
        self.student = self.make_user("scale-student", Role.STUDENT)

    def make_user(self, username, role):
        user = User.objects.create_user(username=username, password="test-password")
        AppUser.objects.create(user=user, role_code_id=role)
        return user

    def client_as(self, user):
        client = APIClient()
        client.force_authenticate(user=user)
        return client

    def criteria_for(self, maximum=100):
        bands = [(0, 60, "F"), (60, 70, "D"), (70, 80, "C"), (80, 90, "B"), (90, 100, "A")]
        return [
            {"min_value": str(maximum * low / 100), "max_value": str(maximum * high / 100), "grade": grade}
            for low, high, grade in bands
        ]

    def payload(self, **overrides):
        return {
            "scale_name": "Standard Scale",
            "maximum_points": "100",
            "grade_type": GradingScale.PERCENTAGE,
            "criteria": self.criteria_for(),
            **overrides,
        }

    def test_admin_creates_reads_and_retrieves_each_grade_type(self):
        client = self.client_as(self.admin)
        for grade_type, max_points, criteria in [
            (GradingScale.PERCENTAGE, "100", self.criteria_for()),
            (GradingScale.POINTS, "50", self.criteria_for(50)),
            (GradingScale.LETTER, "100", self.criteria_for()),
        ]:
            response = client.post(
                "/api/admin/grading-scales/",
                self.payload(scale_name=f"{grade_type} scale", maximum_points=max_points, grade_type=grade_type, criteria=criteria),
                format="json",
            )
            self.assertEqual(response.status_code, 201, response.data)
            persisted = client.get(f"/api/admin/grading-scales/{response.data['id']}/")
            self.assertEqual(persisted.status_code, 200)
            self.assertEqual(persisted.data["grade_type"], grade_type)
            self.assertEqual(len(persisted.data["criteria"]), 5)

        listed = client.get("/api/admin/grading-scales/")
        self.assertEqual(listed.status_code, 200)
        self.assertEqual(len(listed.data), 3)
        self.assertEqual(GradingScale.objects.count(), 3)

    def test_admin_updates_scale_and_audit_omits_criterion_values(self):
        client = self.client_as(self.admin)
        created = client.post("/api/admin/grading-scales/", self.payload(), format="json")
        scale_id = created.data["id"]
        new_criteria = self.criteria_for()
        new_criteria[-1]["grade"] = "A+"
        updated = client.patch(
            f"/api/admin/grading-scales/{scale_id}/",
            {"scale_name": "Revised Scale", "criteria": new_criteria},
            format="json",
        )

        self.assertEqual(updated.status_code, 200, updated.data)
        retrieved = client.get(f"/api/admin/grading-scales/{scale_id}/")
        self.assertEqual(retrieved.data["scale_name"], "Revised Scale")
        self.assertEqual(retrieved.data["criteria"][-1]["grade"], "A+")
        events = AuditEvent.objects.filter(event_type__startswith="GRADING_SCALE_").order_by("event_type")
        self.assertEqual(events.count(), 2)
        event_details = str(list(events.values_list("details_json", flat=True)))
        self.assertNotIn("A+", event_details)
        self.assertNotIn("before", event_details)
        self.assertEqual(events.first().actor_id, self.admin.id)

    def test_required_fields_grade_type_and_maximum_points_are_validated(self):
        client = self.client_as(self.admin)
        invalid = [
            ({"scale_name": "", "maximum_points": "100", "grade_type": "percentage", "criteria": self.criteria_for()}, "scale_name"),
            ({"scale_name": "Valid", "maximum_points": "0", "grade_type": "percentage", "criteria": self.criteria_for()}, "maximum_points"),
            ({"scale_name": "Valid", "maximum_points": "100", "grade_type": "unknown", "criteria": self.criteria_for()}, "grade_type"),
            ({"scale_name": "Valid", "maximum_points": "100", "criteria": self.criteria_for()}, "grade_type"),
        ]
        for data, field in invalid:
            with self.subTest(field=field):
                response = client.post("/api/admin/grading-scales/", data, format="json")
                self.assertEqual(response.status_code, 400)
                self.assertIn(field, response.data)
        self.assertEqual(GradingScale.objects.count(), 0)

    def test_ranges_must_be_valid_full_coverage_and_non_overlapping(self):
        client = self.client_as(self.admin)
        overlap = self.criteria_for()
        overlap[1]["min_value"] = "59"
        gap = self.criteria_for()
        gap[1]["min_value"] = "61"
        out_of_range = self.criteria_for()
        out_of_range[-1]["max_value"] = "101"
        blank_grade = self.criteria_for()
        blank_grade[1]["grade"] = " "
        for criteria in (overlap, gap, out_of_range, blank_grade, []):
            with self.subTest(criteria=criteria):
                response = client.post("/api/admin/grading-scales/", self.payload(criteria=criteria), format="json")
                self.assertEqual(response.status_code, 400)
                self.assertIn("criteria", response.data)
        self.assertEqual(GradingScale.objects.count(), 0)

    def test_non_admin_and_anonymous_users_cannot_access_scales(self):
        student = self.client_as(self.student)
        for response in (
            student.get("/api/admin/grading-scales/"),
            student.post("/api/admin/grading-scales/", self.payload(), format="json"),
            APIClient().get("/api/admin/grading-scales/"),
        ):
            self.assertIn(response.status_code, (401, 403))
        self.assertEqual(GradingScale.objects.count(), 0)
