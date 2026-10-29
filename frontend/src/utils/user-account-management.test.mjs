import test from 'node:test';
import assert from 'node:assert/strict';
import { assignUserDepartment, completePasswordReset, requestUserPasswordReset, setUserActive } from './user-account-management.mjs';

test('account status action sends only the selected active state and uses the administrator endpoint', async () => {
  let request;
  const saved = await setUserActive(async (path, options) => { request = { path, options }; return { id: 5, is_active: true }; }, 5, true);
  assert.equal(request.path, '/admin/users/5/status/');
  assert.equal(request.options.method, 'PATCH');
  assert.deepEqual(JSON.parse(request.options.body), { is_active: true });
  assert.equal(saved.is_active, true);
});

test('department assignment uses the existing administrator assignment endpoint', async () => {
  let request;
  await assignUserDepartment(async (path, options) => { request = { path, options }; return { id: 5, department_id: 3 }; }, 5, '3');
  assert.equal(request.path, '/admin/users/5/department/');
  assert.equal(request.options.method, 'POST');
  assert.deepEqual(JSON.parse(request.options.body), { department: 3 });
});

test('password reset request never submits a password and reports API failures', async () => {
  let request;
  await requestUserPasswordReset(async (path, options) => { request = { path, options }; return { detail: 'sent' }; }, 5);
  assert.equal(request.path, '/admin/users/5/password-reset/');
  assert.equal(request.options.method, 'POST');
  assert.deepEqual(JSON.parse(request.options.body), {});
  await assert.rejects(requestUserPasswordReset(async () => { throw new Error('Mail is unavailable.'); }, 5), /Mail is unavailable/);
});

test('password reset confirmation validates the link and matching passwords before API submission', async () => {
  let request;
  await assert.rejects(completePasswordReset(async () => {}, { uid: '', token: '', newPassword: 'x', confirmPassword: 'x' }), /invalid/);
  await assert.rejects(completePasswordReset(async () => {}, { uid: 'u', token: 't', newPassword: 'x', confirmPassword: 'y' }), /do not match/);
  await completePasswordReset(async (path, options) => { request = { path, options }; return null; }, {
    uid: 'uid-token', token: 'one-time-token', newPassword: 'Correct-Horse-934!', confirmPassword: 'Correct-Horse-934!',
  });
  assert.equal(request.path, '/auth/password-reset/confirm/');
  assert.equal(request.options.method, 'POST');
  assert.deepEqual(JSON.parse(request.options.body), { uid: 'uid-token', token: 'one-time-token', new_password: 'Correct-Horse-934!' });
  await assert.rejects(completePasswordReset(async () => { throw new Error('Expired reset link.'); }, {
    uid: 'uid-token', token: 'expired', newPassword: 'Correct-Horse-934!', confirmPassword: 'Correct-Horse-934!',
  }), /Expired reset link/);
});
