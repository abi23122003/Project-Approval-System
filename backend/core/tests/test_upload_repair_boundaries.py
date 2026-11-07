import json
from unittest.mock import patch

from django.test import SimpleTestCase, override_settings
from rest_framework.exceptions import ValidationError
from rest_framework.test import APITestCase, APIClient

from core.models import AppUser, Department, Project, ProjectProgressUpdate, ProjectStatus, Role
from core.serializers import ProposalDetailsValidation
from django.contrib.auth import get_user_model


class ProposalBodyBoundaryTests(SimpleTestCase):
    def test_unicode_characters_are_not_counted_as_ascii_escapes(self):
        details = {'text': '漢' * 99988}
        self.assertEqual(len(json.dumps(details, ensure_ascii=False)), 100000)
        self.assertEqual(ProposalDetailsValidation().validate_proposal_details(details), details)
        with self.assertRaises(ValidationError):
            ProposalDetailsValidation().validate_proposal_details({'text': '漢' * 99989})


@override_settings(PASSWORD_HASHERS=['django.contrib.auth.hashers.MD5PasswordHasher'])
class UploadRepairApiTests(APITestCase):
    def setUp(self):
        department = Department.objects.create(code='BOUND', name='Boundaries')
        self.leader = get_user_model().objects.create_user(username='upload-leader')
        AppUser.objects.create(user=self.leader, role_code_id=Role.STUDENT, department=department)
        self.outsider = get_user_model().objects.create_user(username='upload-outsider')
        AppUser.objects.create(user=self.outsider, role_code_id=Role.STUDENT, department=department)
        mentor = get_user_model().objects.create_user(username='upload-mentor')
        AppUser.objects.create(user=mentor, role_code_id=Role.FACULTY, department=department)
        self.project = Project.objects.create(department=department, mentor_faculty=mentor, team_leader_student=self.leader, title='Upload tests', abstract='Details', status_id=ProjectStatus.APPROVED)
        self.client = APIClient()
        self.client.force_authenticate(self.leader)

    @override_settings(DATA_UPLOAD_MAX_MEMORY_SIZE=128)
    def test_both_proposal_endpoints_bound_json(self):
        body = json.dumps({'proposal_details': {'text': 'x' * 256}})
        # DRF 3.18.3 reads JSON through HttpRequest.body, which enforces this
        # limit before invoking JSONParser.parse().
        with patch('rest_framework.parsers.JSONParser.parse') as decode:
            post = self.client.post('/api/student/project/', body, content_type='application/json')
            patch_response = self.client.patch(f'/api/student/project/{self.project.id}/', body, content_type='application/json')
            self.assertEqual(post.status_code, 400)
            self.assertEqual(patch_response.status_code, 400)
            decode.assert_not_called()

    def test_unicode_proposal_round_trip(self):
        self.project.status_id = ProjectStatus.DRAFT
        self.project.save()
        details = {'text': '漢' * 20000}
        response = self.client.patch(f'/api/student/project/{self.project.id}/', {'proposal_details': details}, format='json')
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data['proposal_details'], details)

    def update(self, steps='Document upload: 2 file(s)'):
        return ProjectProgressUpdate.objects.create(project=self.project, updated_by_student=self.leader, percent_complete=10, steps_completed=steps)

    def discard(self, update):
        return self.client.post(f'/api/progress-updates/{update.id}/discard-empty-upload/', {}, format='json')

    def test_empty_failed_upload_can_be_discarded_only_by_leader(self):
        update = self.update()
        self.client.force_authenticate(self.outsider)
        self.assertEqual(self.discard(update).status_code, 403)
        self.assertTrue(ProjectProgressUpdate.objects.filter(pk=update.pk).exists())
        self.client.force_authenticate(self.leader)
        self.assertEqual(self.discard(update).status_code, 204)
        self.assertFalse(ProjectProgressUpdate.objects.filter(pk=update.pk).exists())

    def test_regular_history_and_successful_uploads_cannot_be_discarded(self):
        regular = self.update('Completed the first milestone')
        self.assertEqual(self.discard(regular).status_code, 409)
        uploaded = self.update()
        response = self.client.post(f'/api/progress-updates/{uploaded.id}/documents/', {'original_filename': 'report.pdf', 'byte_size': 9}, format='json')
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(self.discard(uploaded).status_code, 409)
        self.assertTrue(ProjectProgressUpdate.objects.filter(pk=regular.pk).exists())
        self.assertTrue(ProjectProgressUpdate.objects.filter(pk=uploaded.pk).exists())
