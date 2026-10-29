import test from 'node:test';
import assert from 'node:assert/strict';
import { submitConfiguration } from './configuration-submission.mjs';
import {
  createDefaultGradingScale,
  defaultGradingCriteria,
  fetchGradingScales,
  saveGradingScale,
  toGradingScaleForm,
  toGradingScalePayload,
  validateGradingScale,
} from './grading-scales.mjs';

const makeScale = (gradeType = 'percentage', maxPoints = '100') => ({
  id: undefined,
  scaleName: 'Standard Scale',
  maxPoints,
  gradeType,
  criteria: defaultGradingCriteria(gradeType, maxPoints),
});

test('default criteria cover supported grade-type ranges', () => {
  for (const gradeType of ['percentage', 'letter']) {
    const config = makeScale(gradeType);
    assert.deepEqual(validateGradingScale(config), {});
    assert.equal(config.criteria[0].min_value, '0');
    assert.equal(config.criteria.at(-1).max_value, '100');
  }
  const points = makeScale('points', '50');
  assert.deepEqual(validateGradingScale(points), {});
  assert.equal(points.criteria.at(-1).max_value, '50');
});

test('rejects missing fields, unsupported grade type, empty grade, gaps, and overlapping ranges', async () => {
  const empty = createDefaultGradingScale();
  assert.equal(validateGradingScale(empty).scaleName, 'Scale name is required.');
  assert.equal(validateGradingScale({ ...makeScale(), maxPoints: '' }).maxPoints, 'Maximum points must be greater than zero.');
  assert.ok(validateGradingScale({ ...makeScale(), gradeType: 'other' }).gradeType);
  for (const change of [
    criteria => { criteria[0].grade = ''; },
    criteria => { criteria[0].min_value = ''; },
    criteria => { criteria[0].max_value = ''; },
    criteria => { criteria[1].min_value = '61'; },
    criteria => { criteria[1].min_value = '59'; },
  ]) {
    const config = makeScale();
    change(config.criteria);
    assert.ok(validateGradingScale(config).criteria);
    let calls = 0;
    const result = await submitConfiguration('grading-scale', config, async () => { calls += 1; });
    assert.equal(result.saved, false);
    assert.equal(calls, 0);
  }
});

test('maps, loads, creates, and updates persisted scale API records', async () => {
  const config = makeScale('points', '50');
  const payload = toGradingScalePayload(config);
  assert.equal(payload.grade_type, 'points');
  assert.equal(payload.criteria.length, 5);
  const record = { id: 7, ...payload, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' };
  assert.equal(toGradingScaleForm(record).criteria[0].grade, 'F');
  assert.equal((await fetchGradingScales(async () => [record]))[0].id, 7);

  let createRequest;
  const saved = await saveGradingScale(async (path, options) => {
    createRequest = { path, options };
    return record;
  }, config);
  assert.equal(createRequest.path, '/admin/grading-scales/');
  assert.equal(createRequest.options.method, 'POST');
  assert.equal(saved.id, 7);

  await saveGradingScale(async (path, options) => {
    assert.equal(path, '/admin/grading-scales/7/');
    assert.equal(options.method, 'PATCH');
    return record;
  }, { ...config, id: 7 });
});

test('API errors and missing save confirmation are surfaced', async () => {
  await assert.rejects(fetchGradingScales(async () => { throw new Error('Forbidden'); }), /Forbidden/);
  await assert.rejects(saveGradingScale(async () => ({}), makeScale()), /did not confirm/);
  const result = await submitConfiguration('grading-scale', makeScale(), async () => { throw new Error('Server unavailable'); });
  assert.deepEqual(result.errors, { form: 'Server unavailable' });
});
