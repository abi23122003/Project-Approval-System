import test from 'node:test';
import assert from 'node:assert/strict';
import { filterAdminUsers, paginateAdminUsers } from './admin-user-list.mjs';

const users = Array.from({ length: 23 }, (_, index) => ({
  id: index + 1,
  name: `User ${index + 1}`,
  email: `user${index + 1}@example.edu`,
  userId: `user${index + 1}`,
  role: index % 2 ? 'Guide' : 'Student',
  status: index === 0 ? 'Inactive' : 'Active',
}));

test('user search and role/status filters can be combined', () => {
  assert.deepEqual(filterAdminUsers(users, { searchTerm: ' USER2 ', role: 'Student', status: 'Active' }).map(user => user.id), [21, 23]);
});

test('pagination exposes every row and safely clamps an outdated page', () => {
  const first = paginateAdminUsers(users, 0, 10);
  const second = paginateAdminUsers(users, 1, 10);
  const last = paginateAdminUsers(users, 9, 10);
  assert.deepEqual([first.firstItem, first.lastItem, first.pageCount], [1, 10, 3]);
  assert.deepEqual([second.firstItem, second.lastItem], [11, 20]);
  assert.deepEqual([last.currentPage, last.firstItem, last.lastItem], [2, 21, 23]);
  assert.deepEqual([...first.visibleUsers, ...second.visibleUsers, ...last.visibleUsers], users);
});

test('empty result pagination has no phantom item or page', () => {
  assert.deepEqual(paginateAdminUsers([], 3), {
    pageCount: 0, currentPage: 0, visibleUsers: [], firstItem: 0, lastItem: 0,
  });
});
