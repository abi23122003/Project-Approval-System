import roleMap from '../config/roleMap.json';
import {
  API_BASE,
  apiFetch,
  clearSession,
  decodeJwtPayload,
  formatApiError,
  getTokens,
  logoutSession,
  saveTokens,
} from './auth-client.mjs';

export {
  API_BASE,
  apiFetch,
  clearSession,
  decodeJwtPayload,
  formatApiError,
  getTokens,
  logoutSession,
  saveTokens,
};

export const getAccessToken = () => getTokens().access;
export const getRefreshToken = () => getTokens().refresh;

export const getRole = () => {
  try {
    const storedRole = window.localStorage.getItem('aps.role');
    const access = decodeJwtPayload(window.localStorage.getItem('aps.access'));
    const refresh = decodeJwtPayload(window.localStorage.getItem('aps.refresh'));
    const now = Date.now() / 1000;
    const payload = access && Number(access.exp) > now ? access : refresh && Number(refresh.exp) > now ? refresh : null;
    if (!payload) return null;
    const tokenRole = Object.entries(roleMap).find(([role, code]) => role !== 'reviewer' && code === payload.role_code)?.[0];
    return tokenRole && tokenRole === storedRole ? tokenRole : null;
  } catch { return null; }
};

export const getUserEmail = () => {
  try { return window.localStorage.getItem('aps.userEmail') || null; } catch { return null; }
};

export const getUserName = (fallback = 'User') => {
  const email = getUserEmail();
  if (!email) return fallback;
  return email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, character => character.toUpperCase());
};

export const isDemoSession = () => false;

export const getCurrentUserId = () => {
  const token = getAccessToken();
  if (!token || isDemoSession()) return null;
  return decodeJwtPayload(token)?.user_id ?? null;
};

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

export const fetchStudentProject = async () => {
  try { return await apiFetch('/student/project/'); }
  catch (error) {
    if (error.status === 404 || error.status === 403) return null;
    throw error;
  }
};

export const fetchStudentProgress = async () => {
  try { return await fetchAllPages('/student/project/progress/'); }
  catch (error) {
    if (error.status === 404 || error.status === 403) return [];
    throw error;
  }
};

export const fetchApprovedProjects = () => fetchAllPages('/student/projects/approved/');
export const fetchStudentJoinRequests = () => fetchAllPages('/student/join-requests/');
export const fetchMentoredProjects = () => fetchAllPages('/faculty/projects/mentored/');
export const fetchProjectComments = (projectId) => fetchAllPages(`/faculty/projects/${projectId}/comments/`);
export const fetchFacultyProjectProgress = (projectId) => fetchAllPages(`/faculty/projects/${projectId}/progress/`);
export const fetchHodProjects = () => fetchAllPages('/hod/projects/');
export const fetchHodFaculty = () => fetchAllPages('/hod/faculty/');
export const fetchHodApprovals = () => fetchAllPages('/hod/approvals/');
export const fetchHodProgress = () => fetchAllPages('/hod/progress/');
export const fetchAdminUsers = () => fetchAllPages('/admin/users/');
export const fetchDepartments = () => apiFetch('/departments/');
export const fetchAdminDepartments = () => apiFetch('/admin/departments/');
export const fetchAdminProjects = () => fetchAllPages('/admin/projects/');
export const fetchAuditEvents = () => fetchAllPages('/admin/audit-events/');
export const fetchFacultyList = () => fetchAllPages('/admin/users/?role=faculty');
export const fetchStudentList = () => fetchAllPages('/admin/users/?role=student').catch(() => []);
