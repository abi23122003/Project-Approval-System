import test from 'node:test';
import assert from 'node:assert/strict';
import { isConfigurationEditable, submitConfiguration, validateAcademicTerm } from './configuration-submission.mjs';

test('unsupported configuration categories are unavailable and never call save', async () => {
  let saveCalls = 0;
  for (const type of ['permissions', 'integration']) {
    assert.equal(isConfigurationEditable(type), false);
    const result = await submitConfiguration(type, { value: '60' }, async () => { saveCalls += 1; });
    assert.equal(result.saved, false);
    assert.match(result.errors.form, /no supported configuration API/);
  }
  assert.equal(saveCalls, 0);
});

const validTerm = {
  termName: 'Fall 2026',
  startDate: '2026-08-24',
  endDate: '2026-12-18',
  isActive: true,
};

test('all empty academic term fields are rejected before the save callback', async () => {
  let saveCalls = 0;
  let closeCalls = 0;
  const result = await submitConfiguration('academic-term', {}, async () => { saveCalls += 1; }, () => { closeCalls += 1; });

  assert.deepEqual(result, {
    saved: false,
    errors: {
      termName: 'Term name is required.',
      startDate: 'Start date is required.',
      endDate: 'End date is required.',
    },
  });
  assert.equal(saveCalls, 0);
  assert.equal(closeCalls, 0);
});

test('each required academic term field is validated individually', () => {
  for (const field of ['termName', 'startDate', 'endDate']) {
    const config = { ...validTerm, [field]: '' };
    const errors = validateAcademicTerm(config);
    assert.deepEqual(Object.keys(errors), [field]);
  }
});

test('end date before start date is rejected before saving', async () => {
  let saveCalls = 0;
  let closeCalls = 0;
  const result = await submitConfiguration('academic-term', {
    ...validTerm,
    startDate: '2026-12-19',
    endDate: '2026-12-18',
  }, async () => { saveCalls += 1; }, () => { closeCalls += 1; });

  assert.equal(result.saved, false);
  assert.equal(result.errors.endDate, 'End date must be on or after the start date.');
  assert.equal(saveCalls, 0);
  assert.equal(closeCalls, 0);
});

test('valid academic term submission calls save once and succeeds', async () => {
  let savedConfig;
  let saveCalls = 0;
  let closeCalls = 0;
  const result = await submitConfiguration('academic-term', validTerm, async config => {
    saveCalls += 1;
    savedConfig = config;
    return 'saved';
  }, () => { closeCalls += 1; });

  assert.deepEqual(result, { saved: true, errors: {} });
  assert.equal(saveCalls, 1);
  assert.equal(closeCalls, 1);
  assert.deepEqual(savedConfig, validTerm);
});

test('save callback failures are returned as visible form errors', async () => {
  let saveCalls = 0;
  let closeCalls = 0;
  const result = await submitConfiguration('academic-term', validTerm, async () => {
    saveCalls += 1;
    throw new Error('Configuration API unavailable.');
  }, () => { closeCalls += 1; });

  assert.equal(saveCalls, 1);
  assert.equal(closeCalls, 0);
  assert.deepEqual(result, {
    saved: false,
    errors: { form: 'Configuration API unavailable.' },
  });
});
