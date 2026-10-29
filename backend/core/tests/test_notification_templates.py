from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from core.models import AppUser, AuditEvent, NotificationTemplate, Role


User = get_user_model()


class NotificationTemplateApiTests(TestCase):
    def setUp(self):
        self.admin = self.make_user("notification-admin", Role.ADMIN)
        self.student = self.make_user("notification-student", Role.STUDENT)

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
            "template_name": "Project Submission Reminder",
            "trigger_event": NotificationTemplate.SUBMISSION,
            "email_enabled": False,
            "in_app_enabled": True,
            **overrides,
        }

    def test_admin_creates_lists_and_retrieves_persisted_template(self):
        client = self.client_as(self.admin)
        created = client.post("/api/admin/notification-templates/", self.payload(), format="json")

        self.assertEqual(created.status_code, 201, created.data)
        template_id = created.data["id"]
        self.assertTrue(NotificationTemplate.objects.filter(pk=template_id, template_name="Project Submission Reminder").exists())
        self.assertFalse(created.data["email_enabled"])
        self.assertTrue(created.data["in_app_enabled"])
        retrieved = client.get(f"/api/admin/notification-templates/{template_id}/")
        listed = client.get("/api/admin/notification-templates/")
        self.assertEqual(retrieved.status_code, 200)
        self.assertEqual(retrieved.data["trigger_event"], NotificationTemplate.SUBMISSION)
        self.assertEqual([row["id"] for row in listed.data], [template_id])

    def test_admin_updates_settings_and_creates_audit_event_without_secrets(self):
        client = self.client_as(self.admin)
        created = client.post("/api/admin/notification-templates/", self.payload(), format="json")
        template_id = created.data["id"]
        updated = client.patch(
            f"/api/admin/notification-templates/{template_id}/",
            {"template_name": "Review Complete", "trigger_event": NotificationTemplate.REVIEW, "email_enabled": True},
            format="json",
        )

        self.assertEqual(updated.status_code, 200, updated.data)
        persisted = client.get(f"/api/admin/notification-templates/{template_id}/")
        self.assertEqual(persisted.data["template_name"], "Review Complete")
        self.assertEqual(persisted.data["trigger_event"], NotificationTemplate.REVIEW)
        self.assertTrue(persisted.data["email_enabled"])
        self.assertTrue(persisted.data["in_app_enabled"])
        events = list(AuditEvent.objects.filter(event_type__startswith="NOTIFICATION_TEMPLATE_"))
        self.assertEqual(len(events), 2)
        self.assertEqual({event.actor_id for event in events}, {self.admin.id})
        self.assertNotIn("password", str([event.details_json for event in events]).lower())

    def test_all_supported_trigger_events_are_accepted(self):
        client = self.client_as(self.admin)
        for trigger_event, _label in NotificationTemplate.TRIGGER_EVENT_CHOICES:
            response = client.post(
                "/api/admin/notification-templates/",
                self.payload(template_name=f"Template {trigger_event}", trigger_event=trigger_event),
                format="json",
            )
            self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(NotificationTemplate.objects.count(), len(NotificationTemplate.TRIGGER_EVENT_CHOICES))

    def test_required_name_and_unsupported_trigger_are_rejected_without_writes(self):
        client = self.client_as(self.admin)
        for data, field in [
            (self.payload(template_name="  "), "template_name"),
            (self.payload(trigger_event="unknown"), "trigger_event"),
        ]:
            response = client.post("/api/admin/notification-templates/", data, format="json")
            self.assertEqual(response.status_code, 400)
            self.assertIn(field, response.data)
        self.assertEqual(NotificationTemplate.objects.count(), 0)
        self.assertFalse(AuditEvent.objects.filter(event_type__startswith="NOTIFICATION_TEMPLATE_").exists())

    def test_only_authenticated_administrators_can_access_templates(self):
        student = self.client_as(self.student)
        responses = [
            student.get("/api/admin/notification-templates/"),
            student.post("/api/admin/notification-templates/", self.payload(), format="json"),
            APIClient().get("/api/admin/notification-templates/"),
        ]
        self.assertTrue(all(response.status_code in (401, 403) for response in responses))
        self.assertEqual(NotificationTemplate.objects.count(), 0)
