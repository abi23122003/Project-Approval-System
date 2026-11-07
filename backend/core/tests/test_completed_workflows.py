import tempfile
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from rest_framework.test import APITestCase, APIClient
from core.models import AppUser, Department, Project, ProjectMember, ProjectStatus, ProjectProgressUpdate, Role, Notification


@override_settings(PASSWORD_HASHERS=['django.contrib.auth.hashers.MD5PasswordHasher'])
class CompletedWorkflowTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.media = tempfile.TemporaryDirectory()
        self.addCleanup(self.media.cleanup)
        self.override = override_settings(MEDIA_ROOT=self.media.name)
        self.override.enable()
        self.addCleanup(self.override.disable)
        self.department = Department.objects.create(code='FIX', name='Fixes')
        self.leader = self.user('leader', Role.STUDENT)
        self.member = self.user('member', Role.STUDENT)
        self.faculty = self.user('faculty', Role.FACULTY)
        self.project = Project.objects.create(department=self.department, mentor_faculty=self.faculty, team_leader_student=self.leader, title='Saved project', abstract='Full abstract', status_id=ProjectStatus.APPROVED)
        ProjectMember.objects.create(project=self.project, student=self.member)

    def user(self, name, role):
        user = get_user_model().objects.create_user(username=name, email=f'{name}@example.edu', password='test-password')
        AppUser.objects.create(user=user, role_code_id=role, department=self.department)
        return user

    def as_user(self, user):
        client = APIClient()
        client.force_authenticate(user)
        return client

    def test_proposal_details_round_trip(self):
        self.project.status_id = ProjectStatus.DRAFT
        self.project.save()
        details = {'objectives': [{'text': 'A saved objective'}], 'budgetItems': [{'cost': 100}]}
        response = self.as_user(self.leader).patch(f'/api/student/project/{self.project.id}/', {'proposal_details': details}, format='json')
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(self.as_user(self.leader).get('/api/student/project/').data['proposal_details'], details)

    def test_member_sees_project_and_progress(self):
        update = ProjectProgressUpdate.objects.create(project=self.project, updated_by_student=self.leader, percent_complete=25, steps_completed='Done')
        client = self.as_user(self.member)
        self.assertEqual(client.get('/api/student/project/').data['id'], self.project.id)
        self.assertEqual(client.get('/api/student/project/progress/').data['results'][0]['id'], update.id)
        self.assertEqual(client.post(f'/api/projects/{self.project.id}/progress/', {'percent_complete': 50, 'steps_completed': 'No'}, format='json').status_code, 403)

    def test_private_upload_persists_and_scopes_download(self):
        update = ProjectProgressUpdate.objects.create(project=self.project, updated_by_student=self.leader, percent_complete=25, steps_completed='Done')
        uploaded = SimpleUploadedFile('report.pdf', b'%PDF-test', content_type='application/pdf')
        response = self.as_user(self.leader).post(f'/api/progress-updates/{update.id}/documents/', {'file': uploaded}, format='multipart')
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response.data['original_filename'], 'report.pdf')
        self.assertEqual(response.data['byte_size'], 9)
        path = f"/api/documents/{response.data['id']}/download/"
        download = self.as_user(self.member).get(path)
        self.assertEqual(b''.join(download.streaming_content), b'%PDF-test')
        outsider = self.user('outsider', Role.STUDENT)
        self.assertEqual(self.as_user(outsider).get(path).status_code, 404)
        docs = self.as_user(self.leader).get('/api/student/project/progress/').data['results'][0]['documents']
        self.assertTrue(docs[0]['downloadable'])

    def test_legacy_project_not_in_faculty_queue(self):
        self.project.status_id = ProjectStatus.SUBMITTED
        self.project.save()
        self.assertEqual(self.as_user(self.faculty).get('/api/faculty/projects/review-queue/').data['results'], [])

    @override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
    def test_recovery_response_does_not_disclose_account(self):
        from django.core import mail
        found = self.client.post('/api/auth/password-reset/request/', {'email': self.leader.email}, format='json')
        missing = self.client.post('/api/auth/password-reset/request/', {'email': 'missing@example.edu'}, format='json')
        self.assertEqual(found.data, missing.data)
        self.assertEqual(found.status_code, 202)
        self.assertEqual(len(mail.outbox), 1)

    def test_cookie_refresh_requires_csrf_and_rotates(self):
        client = APIClient(enforce_csrf_checks=True)
        login = client.post('/api/auth/login/', {'username': 'leader', 'password': 'test-password', 'expected_role': Role.STUDENT, 'cookie_session': True}, format='json')
        self.assertEqual(login.data['refresh'], 'cookie')
        self.assertTrue(login.cookies['aps_refresh']['httponly'])
        self.assertEqual(client.post('/api/auth/token/refresh/', {'refresh': 'cookie'}, format='json').status_code, 403)
        response = client.post('/api/auth/token/refresh/', {'refresh': 'cookie'}, format='json', HTTP_X_CSRFTOKEN=client.cookies['csrftoken'].value)
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data['refresh'], 'cookie')

    def test_login_is_throttled(self):
        for _ in range(30):
            self.client.post('/api/auth/login/', {'username': 'leader', 'password': 'wrong', 'expected_role': Role.STUDENT}, format='json')
        self.assertEqual(self.client.post('/api/auth/login/', {}, format='json').status_code, 429)

    def test_notification_is_private_and_readable(self):
        notification = Notification.objects.create(recipient=self.member, message='Your project was approved.')
        self.assertEqual(self.as_user(self.leader).get('/api/notifications/').data['results'], [])
        client = self.as_user(self.member)
        self.assertEqual(client.get('/api/notifications/').data['results'][0]['id'], notification.id)
        client.patch('/api/notifications/', {'id': notification.id}, format='json')
        notification.refresh_from_db()
        self.assertIsNotNone(notification.read_at)

    def test_decision_delivers_notification_to_team(self):
        from core.services import create_hod_decision
        hod = self.user('hod', Role.HOD)
        self.project.status_id = ProjectStatus.SUBMITTED
        self.project.save()
        create_hod_decision(actor=hod, project=self.project, decision='APPROVE', reason='Ready')
        self.assertTrue(Notification.objects.filter(recipient=self.member, message__contains='hod decision').exists())
        self.assertFalse(Notification.objects.filter(recipient=hod).exists())
        self.assertEqual(self.as_user(self.member).patch('/api/notifications/', {'id': 'invalid'}, format='json').status_code, 400)

    def test_hod_totals_include_all_statuses_and_only_own_department(self):
        hod = self.user('department-hod', Role.HOD)
        draft_leader = self.user('draft-leader', Role.STUDENT)
        draft = Project.objects.create(department=self.department, mentor_faculty=self.faculty, team_leader_student=draft_leader, title='Draft', abstract='Draft abstract', status_id=ProjectStatus.DRAFT)
        other_department = Department.objects.create(code='OTHER', name='Other')
        other_leader = self.user('other-leader', Role.STUDENT)
        Project.objects.create(department=other_department, mentor_faculty=self.faculty, team_leader_student=other_leader, title='Other project', abstract='Private', status_id=ProjectStatus.APPROVED)
        response = self.as_user(hod).get('/api/hod/all-projects/')
        self.assertEqual({item['id'] for item in response.data['results']}, {self.project.id, draft.id})
        self.assertEqual(self.as_user(self.member).get('/api/hod/all-projects/').status_code, 403)

    def test_forwarded_header_cannot_bypass_default_throttle(self):
        for number in range(30):
            self.client.post('/api/auth/login/', {'username': 'leader', 'password': 'wrong', 'expected_role': Role.STUDENT}, format='json', HTTP_X_FORWARDED_FOR=f'198.51.100.{number}')
        response = self.client.post('/api/auth/login/', {}, format='json', HTTP_X_FORWARDED_FOR='203.0.113.1')
        self.assertEqual(response.status_code, 429)

    def test_login_budget_does_not_block_recovery(self):
        for _ in range(30):
            self.client.post('/api/auth/login/', {}, format='json')
        response = self.client.post('/api/auth/password-reset/request/', {'email': 'missing@example.edu'}, format='json')
        self.assertEqual(response.status_code, 202)

    def test_draft_save_keeps_audit_without_notifying_reviewers(self):
        from core.models import AuditEvent
        self.project.status_id = ProjectStatus.DRAFT
        self.project.save()
        response = self.as_user(self.leader).patch(f'/api/student/project/{self.project.id}/', {'abstract': 'Draft save'}, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(AuditEvent.objects.filter(event_type='PROJECT_UPDATED').exists())
        self.assertFalse(Notification.objects.exists())

    def test_project_discovery_omits_private_proposal_content(self):
        self.project.proposal_details = {'budget': 'Private planning'}
        self.project.save()
        outsider = self.user('discovering-student', Role.STUDENT)
        response = self.as_user(outsider).get('/api/student/projects/approved/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['results'][0]['id'], self.project.id)
        self.assertNotIn('proposal_details', response.data['results'][0])
        self.assertNotIn('abstract', response.data['results'][0])
        own = self.as_user(self.leader).get('/api/student/project/')
        self.assertEqual(own.data['proposal_details'], self.project.proposal_details)

    def test_document_metadata_requires_filename_without_file(self):
        update = ProjectProgressUpdate.objects.create(project=self.project, updated_by_student=self.leader, percent_complete=25, steps_completed='Done')
        endpoint = f'/api/progress-updates/{update.id}/documents/'
        client = self.as_user(self.leader)
        missing = client.post(endpoint, {'byte_size': 10}, format='json')
        self.assertEqual(missing.status_code, 400, missing.data)
        self.assertIn('original_filename', missing.data)
        legacy = client.post(endpoint, {'original_filename': 'legacy.pdf'}, format='json')
        self.assertEqual(legacy.status_code, 201, legacy.data)

    def test_file_only_upload_rejects_unsupported_extension(self):
        update = ProjectProgressUpdate.objects.create(project=self.project, updated_by_student=self.leader, percent_complete=25, steps_completed='Done')
        uploaded = SimpleUploadedFile('script.exe', b'contents')
        response = self.as_user(self.leader).post(f'/api/progress-updates/{update.id}/documents/', {'file': uploaded}, format='multipart')
        self.assertEqual(response.status_code, 400, response.data)
