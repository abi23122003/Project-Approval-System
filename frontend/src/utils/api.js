/**
 * Centralized API utility.
 * All requests go through /api (proxied to Django on :8000 by Vite).
 */

export const API_BASE = import.meta.env?.VITE_API_BASE_URL || '/api';

const DEMO_PREFIX = 'demo.token.';

// ─── Token helpers ────────────────────────────────────────────────────────────

export const getAccessToken = () => {
  try { return window.localStorage.getItem('aps.accessToken') || null; } catch { return null; }
};

export const getRefreshToken = () => {
  try { return window.localStorage.getItem('aps.refreshToken') || null; } catch { return null; }
};

export const getRole = () => {
  try { return window.localStorage.getItem('aps.role') || null; } catch { return null; }
};

export const getUserEmail = () => {
  try { return window.localStorage.getItem('aps.userEmail') || null; } catch { return null; }
};

/** Derive a display name from the stored email or a fallback. */
export const getUserName = (fallback = 'User') => {
  const email = getUserEmail();
  if (!email) return fallback;
  return email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

/** Returns true when the stored token is a fake demo token (no real backend needed). */
export const isDemoSession = () => {
  const token = getAccessToken();
  return token ? token.startsWith(DEMO_PREFIX) : false;
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

/** Returns the user id embedded in the JWT (null for demo sessions). */
export const getCurrentUserId = () => {
  const token = getAccessToken();
  if (!token || isDemoSession()) return null;
  return decodeJwtPayload(token)?.user_id ?? null;
};

/** Returns true if the JWT access token is expired (or within 30s of expiry). */
const isTokenExpired = (token) => {
  if (!token || isDemoSession()) return false;
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return false;
  // Consider expired if less than 30 seconds remain
  return Date.now() / 1000 >= payload.exp - 30;
};

// Prevent multiple concurrent refresh calls
let _refreshPromise = null;

/** Attempt to refresh the access token using the stored refresh token. */
const refreshAccessToken = async () => {
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken || isDemoSession()) {
      _refreshPromise = null;
      return null;
    }

    try {
      const resp = await fetch(`${API_BASE}/auth/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (!resp.ok) {
        // Refresh token is also expired → force re-login
        clearSession();
        _refreshPromise = null;
        return null;
      }

      const data = await resp.json();
      const newAccess = data?.access;
      if (newAccess) {
        try { window.localStorage.setItem('aps.accessToken', newAccess); } catch { /* ignore */ }
        // If a new refresh token is returned, save it too
        if (data?.refresh) {
          try { window.localStorage.setItem('aps.refreshToken', data.refresh); } catch { /* ignore */ }
        }
      }
      _refreshPromise = null;
      return newAccess;
    } catch {
      clearSession();
      _refreshPromise = null;
      return null;
    }
  })();

  return _refreshPromise;
};

/** Clear all session data and redirect to login. */
export const clearSession = () => {
  try {
    window.localStorage.removeItem('aps.accessToken');
    window.localStorage.removeItem('aps.refreshToken');
    window.localStorage.removeItem('aps.role');
    window.localStorage.removeItem('aps.userEmail');
  } catch { /* ignore */ }
  // Only redirect if we're not already on the login page
  if (!window.location.pathname.includes('authentication')) {
    window.location.href = '/authentication-role-selection';
  }
};

// ─── Core fetch wrapper ───────────────────────────────────────────────────────

/**
 * Authenticated fetch with automatic token refresh.
 * - Proactively refreshes if token is close to expiry.
 * - Retries once after a 401 by refreshing first.
 * Throws an Error with `.status` if the response is not OK.
 */
export const apiFetch = async (path, options = {}, _retry = true) => {
  let token = getAccessToken();

  // Proactively refresh if token is expired/expiring
  if (token && isTokenExpired(token) && !isDemoSession()) {
    const newToken = await refreshAccessToken();
    if (newToken) token = newToken;
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const resp = await fetch(url, { ...options, headers });

  // 401 → try refreshing once then retry
  if (resp.status === 401 && _retry && !isDemoSession()) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return apiFetch(path, options, false); // retry once
    }
    // Could not refresh → redirect to login
    clearSession();
    const err = new Error('Session expired. Please log in again.');
    err.status = 401;
    throw err;
  }

  if (!resp.ok) {
    const err = new Error(`API error ${resp.status}`);
    err.status = resp.status;
    try { err.body = await resp.json(); } catch { err.body = null; }
    throw err;
  }

  const text = await resp.text();
  return text ? JSON.parse(text) : null;
};

// ─── Paginated helper ─────────────────────────────────────────────────────────

/** Fetch all pages of a paginated endpoint and return a flat results array. */
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

/** Student: fetch own project (404 = no project yet, 403 = wrong role). */
export const fetchStudentProject = async () => {
  try { return await apiFetch('/student/project/'); }
  catch (e) {
    if (e.status === 404 || e.status === 403) return null;
    throw e;
  }
};

/** Student: fetch own progress updates (404 = no project yet). */
export const fetchStudentProgress = async () => {
  try { return await fetchAllPages('/student/project/progress/'); }
  catch (e) {
    if (e.status === 404 || e.status === 403) return [];
    throw e;
  }
};

/** Student: fetch approved projects (catalogue). */
export const fetchApprovedProjects = () => fetchAllPages('/student/projects/approved/');

/** Student: fetch own join requests. */
export const fetchStudentJoinRequests = () => fetchAllPages('/student/join-requests/');

/** Faculty/Guide: fetch mentored projects. */
export const fetchMentoredProjects = () => fetchAllPages('/faculty/projects/mentored/');

/** Faculty/Guide: fetch comments on a project. */
export const fetchProjectComments = (projectId) =>
  fetchAllPages(`/faculty/projects/${projectId}/comments/`);

/** Faculty/Guide: fetch progress updates on a project. */
export const fetchFacultyProjectProgress = (projectId) =>
  fetchAllPages(`/faculty/projects/${projectId}/progress/`);

/** HOD: fetch submitted/under-review projects. */
export const fetchHodProjects = () => fetchAllPages('/hod/projects/');

/** HOD: fetch all approval decisions. */
export const fetchHodApprovals = () => fetchAllPages('/hod/approvals/');

/** HOD: fetch all progress updates. */
export const fetchHodProgress = () => fetchAllPages('/hod/progress/');

/** Admin: fetch all users. */
export const fetchAdminUsers = () => fetchAllPages('/admin/users/');

/** Admin: fetch all projects. */
export const fetchAdminProjects = () => fetchAllPages('/admin/projects/');

/** Admin: fetch audit events. */
export const fetchAuditEvents = () => fetchAllPages('/admin/audit-events/');

/** Admin/HOD: fetch faculty list. */
export const fetchFacultyList = () => fetchAllPages('/admin/users/?role=faculty').catch(() => []);

/** Admin/HOD: fetch student list. */
export const fetchStudentList = () => fetchAllPages('/admin/users/?role=student').catch(() => []);
