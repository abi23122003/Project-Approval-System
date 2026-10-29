import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchAcademicTerms, saveAcademicTerm, toAcademicTermForm, toAcademicTermPayload } from './academic-terms.mjs';

const form = { id: 9, termName: ' Fall 2026 ', startDate: '2026-08-01', endDate: '2026-12-20', isActive: true };

test('maps API term data to form fields and back without losing persisted fields', () => {
  const api = { id: 9, term_name: 'Fall 2026', start_date: '2026-08-01', end_date: '2026-12-20', is_active: true };
  assert.deepEqual(toAcademicTermForm(api), { id: 9, termName: 'Fall 2026', startDate: api.start_date, endDate: api.end_date, isActive: true });
  assert.deepEqual(toAcademicTermPayload(form), { term_name: 'Fall 2026', start_date: form.startDate, end_date: form.endDate, is_active: true });
});

test('loads saved terms from API and rejects malformed list responses', async () => {
  const loaded = await fetchAcademicTerms(async () => [{ id: 9, term_name: 'Fall 2026', start_date: '2026-08-01', end_date: '2026-12-20', is_active: false }]);
  assert.equal(loaded[0].termName, 'Fall 2026');
  await assert.rejects(fetchAcademicTerms(async () => ({ results: [] })), /response was invalid/);
});

test('creates a term and requires a confirming persisted id from the API', async () => {
  let request;
  const { id, ...newTerm } = form;
  const result = await saveAcademicTerm(async (path, options) => {
    request = { path, options };
    return { id: 10, term_name: 'Fall 2026', start_date: form.startDate, end_date: form.endDate, is_active: true };
  }, newTerm);
  assert.equal(request.path, '/admin/academic-terms/');
  assert.equal(request.options.method, 'POST');
  assert.equal(result.id, 10);
  await assert.rejects(saveAcademicTerm(async () => ({}), newTerm), /did not confirm/);
});

test('updates an existing term and surfaces API failures', async () => {
  let path;
  const updated = await saveAcademicTerm(async (url) => {
    path = url;
    return { id: 9, term_name: 'Fall 2026', start_date: form.startDate, end_date: form.endDate, is_active: true };
  }, form);
  assert.equal(path, '/admin/academic-terms/9/');
  assert.equal(updated.id, 9);
  await assert.rejects(saveAcademicTerm(async () => { throw new Error('Forbidden'); }, form), /Forbidden/);
});
