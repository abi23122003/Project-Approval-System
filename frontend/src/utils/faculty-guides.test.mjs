import test from 'node:test';
import assert from 'node:assert/strict';
import { getFacultyGuideEmptyMessage, loadFacultyGuides, mapFacultyGuideResponse } from './faculty-guides.mjs';

test('maps the backend department and eligible guides to Select options', () => {
  const result = mapFacultyGuideResponse({
    department: { id: 3, name: 'Computer Science' },
    mentors: [{ id: 8, name: 'A. Faculty' }],
  });
  assert.deepEqual(result, {
    department: { id: 3, name: 'Computer Science' },
    mentors: [{ value: '8', label: 'A. Faculty' }],
  });
});

test('represents a legitimate empty faculty list and missing department distinctly', () => {
  const empty = mapFacultyGuideResponse({ department: { id: 3, name: 'Computer Science' }, mentors: [] });
  assert.deepEqual(empty.mentors, []);
  assert.match(getFacultyGuideEmptyMessage({ department: empty.department, mentors: empty.mentors }), /No active faculty/);
  assert.match(getFacultyGuideEmptyMessage({ department: null }), /no department assignment/);
});

test('faculty guide API failures remain errors rather than becoming empty results', async () => {
  const apiFailure = new Error('Service unavailable.');
  await assert.rejects(loadFacultyGuides(async () => { throw apiFailure; }), error => error === apiFailure);
  assert.match(getFacultyGuideEmptyMessage({ error: 'Service unavailable.' }), /loading error/);
  await assert.rejects(loadFacultyGuides(async () => ({ department: null })), /response was incomplete/);
});
