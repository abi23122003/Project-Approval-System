import test from 'node:test';
import assert from 'node:assert/strict';
import { submitConfiguration } from './configuration-submission.mjs';
import {
  createDefaultWorkflowConfiguration,
  fetchWorkflowConfiguration,
  saveWorkflowConfiguration,
  toWorkflowConfigurationForm,
  toWorkflowConfigurationPayload,
  validateWorkflowConfiguration,
} from './workflow-configuration.mjs';

const valid = { id: 4, workflowName: 'Standard Review', reviewStages: '2', requireHodApproval: true, parallelReviews: false };
const apiRecord = { id: 4, workflow_name: valid.workflowName, review_stages: 2, require_hod_approval: true, parallel_reviews: false };

test('requires a name, supported stages, valid approval flags, and coherent parallel review', async () => {
  assert.equal(validateWorkflowConfiguration({ ...valid, workflowName: ' ' }).workflowName, 'Workflow name is required.');
  assert.equal(validateWorkflowConfiguration({ ...valid, reviewStages: '5' }).reviewStages, 'Select between 1 and 4 review stages.');
  assert.equal(validateWorkflowConfiguration({ ...valid, requireHodApproval: false, parallelReviews: true }).parallelReviews, 'Parallel review requires HOD approval.');
  for (const config of [{ ...valid, workflowName: '' }, { ...valid, reviewStages: '0' }, { ...valid, requireHodApproval: false, parallelReviews: true }]) {
    let calls = 0;
    const result = await submitConfiguration('workflow', config, async () => { calls += 1; });
    assert.equal(result.saved, false);
    assert.equal(calls, 0);
  }
});

test('maps, loads, creates, and updates the persistent workflow configuration', async () => {
  assert.deepEqual(toWorkflowConfigurationForm(apiRecord), valid);
  assert.deepEqual(toWorkflowConfigurationPayload(valid), {
    workflow_name: valid.workflowName, review_stages: 2, require_hod_approval: true, parallel_reviews: false,
  });
  assert.equal(await fetchWorkflowConfiguration(async () => null), null);
  assert.equal((await fetchWorkflowConfiguration(async () => apiRecord)).id, 4);
  let request;
  const saved = await saveWorkflowConfiguration(async (path, options) => {
    request = { path, options };
    return apiRecord;
  }, valid);
  assert.equal(request.path, '/admin/workflow-configuration/4/');
  assert.equal(request.options.method, 'PATCH');
  assert.equal(saved.id, 4);
  const { id, ...newConfig } = valid;
  await saveWorkflowConfiguration(async (path, options) => {
    assert.equal(path, '/admin/workflow-configuration/');
    assert.equal(options.method, 'POST');
    return { ...apiRecord, id: 5 };
  }, newConfig);
});

test('reports API failures and requires server confirmation', async () => {
  await assert.rejects(fetchWorkflowConfiguration(async () => { throw new Error('Forbidden'); }), /Forbidden/);
  await assert.rejects(saveWorkflowConfiguration(async () => ({}), valid), /did not confirm/);
  const result = await submitConfiguration('workflow', valid, async () => { throw new Error('API unavailable'); });
  assert.deepEqual(result.errors, { form: 'API unavailable' });
});
