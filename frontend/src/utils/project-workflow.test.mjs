import test from 'node:test';
import assert from 'node:assert/strict';
import { submitFacultyProjectReview } from './project-workflow.mjs';

test('submits a faculty decision to the authenticated review API and returns server state', async () => {
  let request;
  const result = await submitFacultyProjectReview(async (path, options) => {
    request = { path, options };
    return { id: 3, project_status: 'UNDER_REVIEW', remaining_stages: 1, stage: 1 };
  }, 12, 'APPROVE', 'Stage comments');
  assert.equal(request.path, '/faculty/projects/12/review/');
  assert.equal(request.options.method, 'POST');
  assert.deepEqual(JSON.parse(request.options.body), { decision: 'APPROVE', reason: 'Stage comments' });
  assert.equal(result.remaining_stages, 1);
});

test('rejects unsupported decisions and reports API failures or unconfirmed writes', async () => {
  await assert.rejects(submitFacultyProjectReview(async () => ({}), 1, 'REFER'), /Select Approve or Reject/);
  await assert.rejects(submitFacultyProjectReview(async () => { throw new Error('Forbidden'); }, 1, 'APPROVE'), /Forbidden/);
  await assert.rejects(submitFacultyProjectReview(async () => ({}), 1, 'APPROVE'), /did not confirm/);
});
