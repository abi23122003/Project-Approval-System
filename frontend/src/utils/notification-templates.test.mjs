import test from 'node:test';
import assert from 'node:assert/strict';
import { submitConfiguration } from './configuration-submission.mjs';
import {
  createDefaultNotificationTemplate,
  fetchNotificationTemplates,
  saveNotificationTemplate,
  toNotificationTemplateForm,
  toNotificationTemplatePayload,
  validateNotificationTemplate,
} from './notification-templates.mjs';

const validTemplate = { id: 8, templateName: 'Project submission', triggerEvent: 'submission', emailEnabled: false, inAppEnabled: true };

test('requires a template name and supported trigger event before API save', async () => {
  assert.equal(validateNotificationTemplate(createDefaultNotificationTemplate()).templateName, 'Notification template name is required.');
  assert.equal(validateNotificationTemplate({ ...validTemplate, triggerEvent: 'unknown' }).triggerEvent, 'Select a supported trigger event.');
  for (const triggerEvent of ['submission', 'review', 'deadline', 'approval']) {
    assert.deepEqual(validateNotificationTemplate({ ...validTemplate, triggerEvent }), {});
  }
  for (const config of [
    { ...validTemplate, templateName: ' ' },
    { ...validTemplate, triggerEvent: 'unsupported' },
  ]) {
    let saveCalls = 0;
    const result = await submitConfiguration('notification', config, async () => { saveCalls += 1; });
    assert.equal(result.saved, false);
    assert.equal(saveCalls, 0);
  }
});

test('maps API records and persists notification settings', async () => {
  const payload = toNotificationTemplatePayload(validTemplate);
  assert.deepEqual(payload, {
    template_name: 'Project submission', trigger_event: 'submission', email_enabled: false, in_app_enabled: true,
  });
  const apiRecord = { id: 8, ...payload };
  assert.deepEqual(toNotificationTemplateForm(apiRecord), validTemplate);
  assert.equal((await fetchNotificationTemplates(async () => [apiRecord]))[0].id, 8);
  let request;
  const saved = await saveNotificationTemplate(async (path, options) => {
    request = { path, options };
    return apiRecord;
  }, validTemplate);
  assert.equal(request.path, '/admin/notification-templates/8/');
  assert.equal(request.options.method, 'PATCH');
  assert.equal(saved.id, 8);
});

test('creates templates, reloads them, and surfaces server failures or missing save confirmation', async () => {
  const { id, ...newTemplate } = validTemplate;
  let request;
  const created = await saveNotificationTemplate(async (path, options) => {
    request = { path, options };
    return { id: 10, template_name: newTemplate.templateName, trigger_event: newTemplate.triggerEvent, email_enabled: newTemplate.emailEnabled, in_app_enabled: newTemplate.inAppEnabled };
  }, newTemplate);
  assert.equal(request.path, '/admin/notification-templates/');
  assert.equal(request.options.method, 'POST');
  assert.equal(created.id, 10);
  await assert.rejects(fetchNotificationTemplates(async () => { throw new Error('Forbidden'); }), /Forbidden/);
  await assert.rejects(saveNotificationTemplate(async () => ({}), newTemplate), /did not confirm/);
  const failed = await submitConfiguration('notification', validTemplate, async () => { throw new Error('Server unavailable'); });
  assert.deepEqual(failed.errors, { form: 'Server unavailable' });
});
