import test from 'node:test';
import assert from 'node:assert/strict';
import { filterAuditEvents, formatAuditEvent, paginateEvents } from './audit-event-presentation.mjs';

const baseTime = new Date('2026-10-29T12:00:00.000Z');

test('department transitions produce readable messages without exposing audit payload JSON', () => {
  const event = {
    id: 4,
    event_type: 'DEPARTMENT_UPDATED',
    entity_type: 'Department',
    entity_id: 8,
    actor: 2,
    event_time: baseTime.toISOString(),
    details_json: {
      actor_user_id: 2,
      before: { name: 'QA Test Department', is_active: true },
      after: { name: 'QA Test Department', is_active: false },
    },
  };
  const originalDetails = structuredClone(event.details_json);
  const formatted = formatAuditEvent(event);

  assert.equal(formatted.title, 'Department deactivated');
  assert.equal(formatted.message, 'Department QA Test Department was deactivated by an administrator.');
  assert.equal(formatted.category, 'Departments');
  assert.equal(formatted.type, 'Departments');
  assert.equal(JSON.stringify(formatted).includes('actor_user_id'), false);
  assert.deepEqual(event.details_json, originalDetails);
});

test('unknown event types have safe readable fallbacks and omit raw structured values', () => {
  const formatted = formatAuditEvent({
    event_type: 'SOMETHING_NEW', entity_type: 'ProjectJoinRequest', actor: 9,
    details_json: { before: { private_key: 'do not display' }, after: { private_key: 'also private' } },
  });
  assert.equal(formatted.title, 'Something New');
  assert.equal(formatted.message, 'An activity involving join requests was recorded by User #9.');
  assert.equal(JSON.stringify(formatted).includes('private_key'), false);
});

test('audit activity filters combine search, event group, category, and time range', () => {
  const events = [
    { id: 1, event_type: 'DEPARTMENT_UPDATED', entity_type: 'Department', actor: 2, event_time: baseTime.toISOString(), details_json: { before: { name: 'QA Test Department', is_active: true }, after: { name: 'QA Test Department', is_active: false } } },
    { id: 2, event_type: 'USER_CREATED', entity_type: 'AppUser', actor: 2, event_time: '2026-10-20T12:00:00.000Z', details_json: { username: 'new-student', role_code: 'STUDENT' } },
  ];
  assert.deepEqual(filterAuditEvents(events, { search: 'QA TEST', type: 'Departments', category: 'Departments', timeRange: 'today' }, baseTime).map(event => event.id), [1]);
  assert.deepEqual(filterAuditEvents(events, { type: 'Users', category: 'Users', timeRange: 'week' }, baseTime).map(event => event.id), []);
  assert.equal(filterAuditEvents(events, {}, baseTime).length, events.length);
});

test('audit counts use fetched event records and pagination includes all pages', () => {
  const events = Array.from({ length: 23 }, (_, id) => ({ id, event_type: 'PROJECT_CREATED', entity_type: 'Project', event_time: new Date(baseTime.getTime() + id * 1000).toISOString() }));
  assert.equal(events.length, 23);
  const first = paginateEvents(events, 0, 10);
  const second = paginateEvents(events, 1, 10);
  const last = paginateEvents(events, 8, 10);
  assert.deepEqual([first.firstItem, first.lastItem, first.pageCount], [1, 10, 3]);
  assert.deepEqual([second.firstItem, second.lastItem], [11, 20]);
  assert.deepEqual([last.currentPage, last.firstItem, last.lastItem], [2, 21, 23]);
  assert.equal([...first.items, ...second.items, ...last.items].length, 23);
});
