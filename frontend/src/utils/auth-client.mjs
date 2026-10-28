export const API_BASE = import.meta.env?.VITE_API_BASE_URL || '/api';
const SESSION_PREFIX = 'aps.';

let sessionVersion = 0;
let refreshPromise = null;
let loggingOut = false;
let rotatedRefreshDuringLogout = null;

export const formatApiError = (data, fallback = 'Request failed. Please try again.') => {
  if (typeof data?.detail === 'string') return data.detail;
  if (typeof data?.message === 'string') return data.message;
  if (!data || typeof data !== 'object') return fallback;
  const messages = Object.entries(data).flatMap(([field, value]) => {
    const values = Array.isArray(value) ? value : [value];
    return values.filter(item => typeof item === 'string').map(item =>
      field === 'non_field_errors' ? item : `${field}: ${item}`
    );
  });
  return messages.length ? messages.join(' ') : fallback;
};

export const saveTokens = (access, refresh) => {
  if (access) window.localStorage.setItem('aps.access', access);
  if (refresh) window.localStorage.setItem('aps.refresh', refresh);
};

export const getTokens = () => {
  try {
    return {
      access: window.localStorage.getItem('aps.access') || null,
      refresh: window.localStorage.getItem('aps.refresh') || null,
    };
  } catch {
    return { access: null, refresh: null };
  }
};

export const clearSession = (redirect = true) => {
  sessionVersion += 1;
  try {
    const keysToRemove = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith(SESSION_PREFIX)) keysToRemove.push(key);
    }
    keysToRemove.forEach(key => window.localStorage.removeItem(key));
  } catch {
    // Storage may be unavailable in restricted browser contexts.
  }

  if (redirect && !window.location.pathname.includes('authentication')) {
    window.location.href = '/authentication-role-selection';
  }
};

export const logoutSession = async (redirect = true) => {
  loggingOut = true;
  const pendingRefresh = refreshPromise;
  let refresh = getTokens().refresh;
  clearSession(redirect);

  if (pendingRefresh) {
    try {
      await pendingRefresh;
    } catch {
      // Local logout succeeds even if refresh or server invalidation fails.
    }
    refresh = rotatedRefreshDuringLogout || refresh;
  }

  if (refresh) {
    try {
      await fetch(`${API_BASE}/auth/logout/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      });
    } catch {
      // Local credentials are already gone; the refresh expires naturally if offline.
    }
  }
  rotatedRefreshDuringLogout = null;
  loggingOut = false;
};

export const decodeJwtPayload = (jwt) => {
  try {
    const part = jwt?.split('.')?.[1];
    if (!part) return null;
    const json = decodeURIComponent(
      atob(part.replace(/-/g, '+').replace(/_/g, '/'))
        .split('')
        .map((character) => '%' + ('00' + character.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(json);
  } catch { return null; }
};

const doRefresh = async (startedAtVersion) => {
  if (refreshPromise) return refreshPromise;

  const task = (async () => {
    const { refresh } = getTokens();
    if (!refresh) throw new Error('No refresh token');

    const response = await fetch(`${API_BASE}/auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });
    if (!response.ok) throw new Error('Refresh failed');

    const data = await response.json();
    const nextAccess = decodeJwtPayload(data?.access);
    const nextRefresh = decodeJwtPayload(data?.refresh);
    const previousIdentity = decodeJwtPayload(refresh);
    if (!nextAccess || !nextRefresh || Number(nextAccess.exp) <= Date.now() / 1000 ||
        Number(nextAccess.user_id) !== Number(previousIdentity?.user_id) ||
        nextAccess.role_code !== previousIdentity?.role_code) {
      throw new Error('Refresh response did not preserve the authenticated identity.');
    }
    if (startedAtVersion !== sessionVersion || loggingOut) {
      if (loggingOut) rotatedRefreshDuringLogout = data.refresh;
      throw new Error('Session ended while refreshing.');
    }
    saveTokens(data.access, data.refresh);
    return data.access;
  })();

  refreshPromise = task;
  try {
    return await task;
  } finally {
    if (refreshPromise === task) refreshPromise = null;
  }
};

export const apiFetch = async (path, options = {}, retry = true) => {
  if (loggingOut) {
    const error = new Error('Session ended. Please log in again.');
    error.status = 401;
    throw error;
  }

  const requestVersion = sessionVersion;
  const { access } = getTokens();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...(access ? { Authorization: `Bearer ${access}` } : {}),
  };
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;

  const ensureSessionIsCurrent = () => {
    if (requestVersion !== sessionVersion || loggingOut) {
      const error = new Error('Session ended. Please log in again.');
      error.status = 401;
      throw error;
    }
  };

  let response = await fetch(url, { ...options, headers });
  ensureSessionIsCurrent();

  if (response.status === 401 && retry) {
    try {
      const newAccess = await doRefresh(requestVersion);
      ensureSessionIsCurrent();
      response = await fetch(url, {
        ...options,
        headers: { ...headers, Authorization: `Bearer ${newAccess}` },
      });
      ensureSessionIsCurrent();
    } catch (refreshError) {
      if (requestVersion === sessionVersion && !loggingOut) clearSession();
      const error = new Error('Session expired. Please log in again.');
      error.status = 401;
      throw error;
    }
  }

  if (!response.ok) {
    let data = null;
    try { data = await response.json(); } catch { /* ignore non-JSON errors */ }
    const error = new Error(formatApiError(data, `API error ${response.status}`));
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
};
