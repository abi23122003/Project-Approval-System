import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeAdminUsers } from './admin-user-stats.mjs';

test('counts every account and separates active from inactive users', () => {
  const users = [
    { is_active: true, role_code: 'STUDENT' },
    { is_active: false, role_code: 'STUDENT' },
    { is_active: true, role_code: 'FACULTY' },
    { is_active: false, role_code: 'HOD' },
    { is_active: true, role_code: 'ADMIN' },
  ];

  assert.deepEqual(summarizeAdminUsers(users), {
    total: 5,
    active: 3,
    inactive: 2,
    activeRoles: { STUDENT: 1, FACULTY: 1, HOD: 0, ADMIN: 1 },
  });
});

test('returns zero counts for an empty account list', () => {
  assert.deepEqual(summarizeAdminUsers(), {
    total: 0,
    active: 0,
    inactive: 0,
    activeRoles: { STUDENT: 0, FACULTY: 0, HOD: 0, ADMIN: 0 },
  });
});

test('does not add inactive or unknown-role accounts to active role counts', () => {
  const stats = summarizeAdminUsers([
    { is_active: false, role_code: 'FACULTY' },
    { is_active: true, role_code: 'OTHER' },
    { is_active: true, role_code: 'HOD' },
  ]);

  assert.equal(stats.total, 3);
  assert.equal(stats.active, 2);
  assert.equal(stats.inactive, 1);
  assert.deepEqual(stats.activeRoles, { STUDENT: 0, FACULTY: 0, HOD: 1, ADMIN: 0 });
});
