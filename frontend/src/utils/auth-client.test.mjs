import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import {
  apiFetch,
  clearSession,
  getTokens,
  logoutSession,
  saveTokens,
} from './auth-client.mjs';

const localStorage = new Map();
let pathname = '/admin-dashboard';
let locationHref = '';
const originalFetch = globalThis.fetch;

globalThis.window = {
  localStorage: {
    get length() { return localStorage.size; },
    key(index) { return [...localStorage.keys()][index] ?? null; },
    getItem(key) { return localStorage.get(key) ?? null; },
    setItem(key, value) { localStorage.set(key, String(value)); },
    removeItem(key) { localStorage.delete(key); },
  },
  location: {
    get pathname() { return pathname; },
    set href(value) { locationHref = value; },
    get href() { return locationHref; },
  },
};

const response = (status, payload = null) => ({
  status,
  ok: status >= 200 && status < 300,
  json: async () => payload,
  text: async () => payload == null ? '' : JSON.stringify(payload),
});

afterEach(() => {
  localStorage.clear();
  pathname = '/admin-dashboard';
  locationHref = '';
  globalThis.fetch = originalFetch;
});

test('clearSession removes every app credential and returns to login', () => {
  localStorage.set('aps.access', 'access-value');
  localStorage.set('aps.refresh', 'refresh-value');
  localStorage.set('aps.role', 'admin');
  localStorage.set('aps.userEmail', 'admin@example.test');
  localStorage.set('other-app.preference', 'preserved');

  clearSession();

  assert.deepEqual(getTokens(), { access: null, refresh: null });
  assert.equal(localStorage.has('aps.role'), false);
  assert.equal(localStorage.has('aps.userEmail'), false);
  assert.equal(localStorage.get('other-app.preference'), 'preserved');
  assert.equal(window.location.href, '/authentication-role-selection');
});

test('logout clears local tokens and blacklists the refresh token', async () => {
  saveTokens('access-value', 'refresh-value');
  let logoutRequest;
  globalThis.fetch = async (url, options) => {
    logoutRequest = { url, options };
    return response(204);
  };

  await logoutSession(false);

  assert.deepEqual(getTokens(), { access: null, refresh: null });
  assert.equal(logoutRequest.url, '/api/auth/logout/');
  assert.equal(JSON.parse(logoutRequest.options.body).refresh, 'refresh-value');
});

test('new protected requests after logout do not send stale credentials', async () => {
  saveTokens('access-value', 'refresh-value');
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    return url.endsWith('/auth/logout/') ? response(204) : response(401, { detail: 'Unauthorized' });
  };

  await logoutSession(false);
  await assert.rejects(apiFetch('/admin/users/'), { status: 401 });

  const protectedCall = calls.find(call => call.url === '/api/admin/users/');
  assert.ok(protectedCall);
  assert.equal(protectedCall.options.headers.Authorization, undefined);
  assert.equal(calls.filter(call => call.url === '/api/admin/users/').length, 1);
});

test('in-flight protected responses are discarded after logout starts', async () => {
  saveTokens('access-value', 'refresh-value');
  let resolveProtected;
  let protectedCalls = 0;
  globalThis.fetch = async (url) => {
    if (url.endsWith('/auth/logout/')) return response(204);
    protectedCalls += 1;
    return new Promise(resolve => { resolveProtected = resolve; });
  };

  const pending = apiFetch('/admin/users/');
  await Promise.resolve();
  clearSession(false);
  resolveProtected(response(200, { results: [] }));

  await assert.rejects(pending, /Session ended/);
  assert.equal(protectedCalls, 1);
  assert.deepEqual(getTokens(), { access: null, refresh: null });
});

test('refresh failures stop after one refresh attempt and clear the session', async () => {
  saveTokens('expired-access', 'expired-refresh');
  const calls = [];
  globalThis.fetch = async url => {
    calls.push(url);
    return response(401, { detail: 'Unauthorized' });
  };

  await assert.rejects(apiFetch('/admin/users/'), { status: 401 });

  assert.equal(calls.length, 2);
  assert.equal(calls[0], '/api/admin/users/');
  assert.equal(calls[1], '/api/auth/token/refresh/');
  assert.deepEqual(getTokens(), { access: null, refresh: null });
});
