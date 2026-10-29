import test from 'node:test';
import assert from 'node:assert/strict';
import { createConfigurationAuditCsv, filterConfigurationCategories } from './system-configuration.mjs';

const categories = [
  { title: 'Academic Term Configuration', description: 'Manage terms and schedules' },
  { title: 'Notification Orchestration', description: 'Configure delivery workflows' },
];

test('configuration search supports full, partial, case-insensitive, empty, and no-match queries', () => {
  assert.equal(filterConfigurationCategories(categories, 'ACADEMIC TERM').length, 1);
  assert.equal(filterConfigurationCategories(categories, 'sched').length, 1);
  assert.equal(filterConfigurationCategories(categories, '   ').length, categories.length);
  assert.equal(filterConfigurationCategories(categories, 'missing').length, 0);
});

test('audit log CSV contains readable summaries and excludes raw audit JSON', () => {
  const csv = createConfigurationAuditCsv([{
    id: 9,
    event_type: 'DEPARTMENT_UPDATED',
    entity_type: 'Department',
    actor: 3,
    event_time: '2026-10-29T12:00:00.000Z',
    details_json: {
      actor_user_id: 3,
      before: { name: 'Research', is_active: true },
      after: { name: 'Research', is_active: false },
    },
  }]);

  assert.match(csv, /Department deactivated/);
  assert.match(csv, /Department Research was deactivated by an administrator/);
  assert.doesNotMatch(csv, /actor_user_id|\"before\"|\"after\"/);
});
