/**
 * Centralized API utility.
 * All requests go through /api (proxied to Django on :8000 by Vite).
 */

export const API_BASE = import.meta.env?.VITE_API_BASE_URL || '/api';

export const saveTokens = (access, refresh) => {
  if (access) window.localStorage.setItem('aps.access', access);
  if (refresh) window.localStorage.setItem('aps.refresh', refresh);
};

export const getTokens = () => {
  return {
    access: window.localStorage.getItem('aps.access') || null,
    refresh: window.localStorage.getItem('aps.refresh') || null,
  };
};

export const clearSession = () => {
  const keysToRemove = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (key && key.startsWith('aps.')) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(k => window.localStorage.removeItem(k));
  
  if (!window.location.pathname.includes('authentication')) {
    window.location.href = '/authentication-role-selection';
  }
};

let _refreshPromise = null;

const doRefresh = async () => {
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = (async () => {
    const { refresh } = getTokens();
    if (!refresh) {
      _refreshPromise = null;
      clearSession();
      throw new Error('No refresh token');
    }

    try {
      const resp = await fetch(`${API_BASE}/auth/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      });

      if (!resp.ok) {
        throw new Error('Refresh failed');
      }

      const data = await resp.json();
      if (data.access) {
        saveTokens(data.access, data.refresh);
      }
      _refreshPromise = null;
      return data.access;
    } catch (err) {
      _refreshPromise = null;
      clearSession();
      throw err;
    }
  })();

  return _refreshPromise;
};

export const apiFetch = async (path, options = {}, _retry = true) => {
  let { access } = getTokens();

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...(access ? { Authorization: `Bearer ${access}` } : {}),
  };

  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  let resp = await fetch(url, { ...options, headers });

  if (resp.status === 401 && _retry) {
    try {
      const newAccess = await doRefresh();
      const newHeaders = {
        ...headers,
        Authorization: `Bearer ${newAccess}`,
      };
      resp = await fetch(url, { ...options, headers: newHeaders });
    } catch (refreshErr) {
      clearSession();
      const err = new Error('Session expired. Please log in again.');
      err.status = 401;
      throw err;
    }
  }

  if (!resp.ok) {
    let detail = `API error ${resp.status}`;
    try {
      const data = await resp.json();
      detail = data.detail || data.message || detail;
    } catch { /* ignore */ }
    const err = new Error(detail);
    err.status = resp.status;
    throw err;
  }

  if (resp.status === 204) {
    return null;
  }

  const text = await resp.text();
  return text ? JSON.parse(text) : null;
};

// ─── Token helpers (backward compatibility for existing UI) ─────────────────────

const DEMO_PREFIX = 'demo.token.';

export const getAccessToken = () => getTokens().access;
export const getRefreshToken = () => getTokens().refresh;

export const getRole = () => {
  try { return window.localStorage.getItem('aps.role') || null; } catch { return null; }
};

export const getUserEmail = () => {
  try { return window.localStorage.getItem('aps.userEmail') || null; } catch { return null; }
};

export const getUserName = (fallback = 'User') => {
  const email = getUserEmail();
  if (!email) return fallback;
  return email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

export const isDemoSession = () => {
  return false;
};

export const decodeJwtPayload = (jwt) => {
  try {
    const part = jwt?.split('.')?.[1];
    if (!part) return null;
    const json = decodeURIComponent(
      atob(part.replace(/-/g, '+').replace(/_/g, '/'))
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(json);
  } catch { return null; }
};

export const getCurrentUserId = () => {
  const token = getAccessToken();
  if (!token || isDemoSession()) return null;
  return decodeJwtPayload(token)?.user_id ?? null;
};

// ─── Paginated helper ─────────────────────────────────────────────────────────

export const fetchAllPages = async (path) => {
  const first = await apiFetch(path);
  const results = [...(first?.results ?? [])];
  let next = first?.next;
  while (next) {
    const page = await apiFetch(next);
    results.push(...(page?.results ?? []));
    next = page?.next;
  }
  return results;
};

// ─── Endpoint helpers ─────────────────────────────────────────────────────────

export const fetchStudentProject = async () => {
  try { return await apiFetch('/student/project/'); }
  catch (e) {
    if (e.status === 404 || e.status === 403) return null;
    throw e;
  }
};

export const fetchStudentProgress = async () => {
  try { return await fetchAllPages('/student/project/progress/'); }
  catch (e) {
    if (e.status === 404 || e.status === 403) return [];
    throw e;
  }
};

export const fetchApprovedProjects = () => fetchAllPages('/student/projects/approved/');
export const fetchStudentJoinRequests = () => fetchAllPages('/student/join-requests/');
export const fetchMentoredProjects = () => fetchAllPages('/faculty/projects/mentored/');
export const fetchProjectComments = (projectId) => fetchAllPages(`/faculty/projects/${projectId}/comments/`);
export const fetchFacultyProjectProgress = (projectId) => fetchAllPages(`/faculty/projects/${projectId}/progress/`);
export const fetchHodProjects = () => fetchAllPages('/hod/projects/');
export const fetchHodApprovals = () => fetchAllPages('/hod/approvals/');
export const fetchHodProgress = () => fetchAllPages('/hod/progress/');
export const fetchAdminUsers = () => fetchAllPages('/admin/users/');
export const fetchAdminProjects = () => fetchAllPages('/admin/projects/');
export const fetchAuditEvents = () => fetchAllPages('/admin/audit-events/');
export const fetchFacultyList = () => fetchAllPages('/admin/users/?role=faculty').catch(() => []);
export const fetchStudentList = () => fetchAllPages('/admin/users/?role=student').catch(() => []);
