import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/ui/Sidebar';
import Header from '../../components/ui/Header';
import Footer from '../../components/ui/Footer';
import StatCard from './components/StatCard';
import UserManagementTable from './components/UserManagementTable';
import SystemActivityLog from './components/SystemActivityLog';
import QuickActionCard from './components/QuickActionCard';
import RoleDistributionChart from './components/RoleDistributionChart';
import Icon from '../../components/AppIcon';
import { summarizeAdminUsers } from '../../utils/admin-user-stats.mjs';
import { toAdminCsv } from '../../utils/admin-csv.mjs';
import { assignUserDepartment, requestUserPasswordReset, setUserActive } from '../../utils/user-account-management.mjs';
import {
  apiFetch,
  fetchAdminUsers,
  fetchAuditEvents,
  fetchAdminProjects,
  fetchAdminDepartments,
} from '../../utils/api';

// â”€â”€â”€ Static data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const buildQuickActions = (openModal, exportUsers, viewLogs) => [
  {
    title: 'User Management',
    description: 'Manage user accounts and permissions',
    actions: [
      { label: 'Create New User', icon: 'UserPlus', variant: 'default', onClick: openModal },
      { label: 'Export User List', icon: 'Download', variant: 'outline', onClick: exportUsers },
    ],
  },
  {
    title: 'System Operations',
    description: 'Perform critical system operations',
    actions: [
      { label: 'View Logs', icon: 'FileText', variant: 'outline', onClick: viewLogs },
    ],
  },
];

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const formatRelativeTime = (dateStr) => {
  if (!dateStr) return 'Unknown';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} minute${mins > 1 ? 's' : ''} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
};

const ROLE_LABEL_MAP = {
  ADMIN: 'Admin',
  HOD: 'HOD',
  FACULTY: 'Guide',
  STUDENT: 'Student',
};

const USER_AVATARS = [
  'https://img.rocket.new/generatedImages/rocket_gen_img_14fee5e48-1763295271225.png',
  'https://img.rocket.new/generatedImages/rocket_gen_img_1ffeb43ad-1763298672388.png',
  'https://img.rocket.new/generatedImages/rocket_gen_img_1a36548bd-1763296665300.png',
  'https://img.rocket.new/generatedImages/rocket_gen_img_130504d21-1763295915180.png',
  'https://img.rocket.new/generatedImages/rocket_gen_img_1f4c07e6c-1763297701460.png',
];

// â”€â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// â”€â”€â”€ Blank create-user form â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const BLANK_FORM = {
  username: '', email: '', password: '', role_code: 'STUDENT', department: '',
};

// â”€â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const AdminDashboard = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardNotice, setDashboardNotice] = useState('');
  const [dashboardRefresh, setDashboardRefresh] = useState(0);

  const [users, setUsers] = useState([]);
  const [auditEvents, setAuditEvents] = useState([]);
  const [projects, setProjects] = useState([]);

  // Create-user modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [detailsUser, setDetailsUser] = useState(null);
  const [createForm, setCreateForm] = useState(BLANK_FORM);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createFieldErrors, setCreateFieldErrors] = useState({});
  const [departments, setDepartments] = useState([]);
  const [departmentLoading, setDepartmentLoading] = useState(true);
  const [departmentSaving, setDepartmentSaving] = useState(false);
  const [departmentError, setDepartmentError] = useState('');
  const [departmentSuccess, setDepartmentSuccess] = useState('');
  const [departmentFormOpen, setDepartmentFormOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [departmentForm, setDepartmentForm] = useState({ code: '', name: '' });
  const [departmentActionId, setDepartmentActionId] = useState(null);
  const [assignmentUser, setAssignmentUser] = useState(null);
  const [assignmentDepartment, setAssignmentDepartment] = useState('');
  const [assignmentError, setAssignmentError] = useState('');
  const [assignmentSaving, setAssignmentSaving] = useState(false);
  const [pendingAccountAction, setPendingAccountAction] = useState(null);
  const [accountActionSaving, setAccountActionSaving] = useState(false);
  const [accountActionError, setAccountActionError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError(null);
    const load = async () => {
      const dashboardLoad = (async () => {
        try {
          const [usrs, events, projs] = await Promise.all([
            fetchAdminUsers(),
            fetchAuditEvents(),
            fetchAdminProjects(),
          ]);
          setUsers(usrs || []);
          setAuditEvents(events || []);
          setProjects(projs || []);
        } catch (e) {
          console.error('Admin dashboard load error:', e);
          setError(`Could not load admin data: ${e.message || 'Please try again.'}`);
        } finally {
          setLoading(false);
        }
      })();
      const departmentLoad = refreshDepartments();
      await Promise.all([dashboardLoad, departmentLoad]);
    };
    load();
  }, [dashboardRefresh]);

  useEffect(() => {
    if (!showCreateModal && !assignmentUser && !detailsUser) return undefined;
    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      if (showCreateModal && !isCreating) setShowCreateModal(false);
      else if (pendingAccountAction && !accountActionSaving) setPendingAccountAction(null);
      else if (assignmentUser && !assignmentSaving) setAssignmentUser(null);
      else if (detailsUser) setDetailsUser(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCreateModal, isCreating, assignmentUser, assignmentSaving, detailsUser, pendingAccountAction, accountActionSaving]);

  const refreshDepartments = async (showLoading = false) => {
    if (showLoading) setDepartmentLoading(true);
    try {
      const data = await fetchAdminDepartments();
      setDepartments(Array.isArray(data) ? data : []);
      setDepartmentError('');
      return true;
    } catch (e) {
      setDepartmentError(e?.message || 'Could not load departments. Please try again.');
      return false;
    } finally {
      setDepartmentLoading(false);
    }
  };

  // â”€â”€ Derived data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const userStats = summarizeAdminUsers(users);
  const totalProjects = projects.length;
  const activeDepartments = departments.filter((department) => department.is_active);

  const statsData = [
    {
      title: 'Total Users',
      value: userStats.total.toLocaleString(),
      change: 'all accounts',
      changeType: 'neutral',
      icon: 'Users',
      iconColor: 'bg-primary/10',
      trend: 'flat',
    },
    {
      title: 'Active Users',
      value: userStats.active.toLocaleString(),
      change: 'active accounts',
      changeType: 'neutral',
      icon: 'UserCheck',
      iconColor: 'bg-success/10',
      trend: 'flat',
    },
    {
      title: 'Inactive Users',
      value: userStats.inactive.toLocaleString(),
      change: 'inactive accounts',
      changeType: 'neutral',
      icon: 'UserX',
      iconColor: 'bg-error/10',
      trend: 'flat',
    },
    {
      title: 'Total Projects',
      value: totalProjects.toLocaleString(),
      change: 'in system',
      changeType: 'neutral',
      icon: 'FolderOpen',
      iconColor: 'bg-success/10',
      trend: 'flat',
    },
    {
      title: 'System Uptime',
      value: 'Unavailable',
      change: 'not reported by API',
      changeType: 'neutral',
      icon: 'Server',
      iconColor: 'bg-accent/10',
      trend: 'flat',
    },
    {
      title: 'Audit Events',
      value: auditEvents.length.toLocaleString(),
      change: 'total logged',
      changeType: 'neutral',
      icon: 'Activity',
      iconColor: 'bg-warning/10',
      trend: 'flat',
    },
  ];

  // Map real users to table format
  const usersData = users.map((u, i) => ({
        id: u.id,
        department_id: u.department_id,
        name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username || u.email,
        email: u.email || u.username,
        userId: u.username,
        role: ROLE_LABEL_MAP[u.role_code] || u.role_code || 'User',
        status: u.is_active ? 'Active' : 'Inactive',
        is_active: u.is_active,
        lastActive: 'Recently',
        avatar: USER_AVATARS[i % USER_AVATARS.length],
        avatarAlt: 'User profile photo',
      }));

  // Map real audit events to activity log format
  const activitiesData = auditEvents.slice(0, 10).map((e) => ({
        id: e.id,
        type: e.event_type?.toLowerCase() || 'info',
        action: `${e.event_type} â€” ${e.entity_type}`,
        description: e.details_json ? JSON.stringify(e.details_json).slice(0, 80) : `Entity #${e.entity_id}`,
        performedBy: e.actor ? `User #${e.actor}` : 'System',
        ipAddress: 'N/A',
        timestamp: formatRelativeTime(e.event_time),
        severity: e.event_type?.includes('DELETE') || e.event_type?.includes('REJECT') ? 'high' : 'low',
      }));

  // Role distribution
  const roleCounts = userStats.activeRoles;

  const roleDistributionData = [
        { name: 'Student', value: roleCounts.STUDENT },
        { name: 'Faculty / Guide', value: roleCounts.FACULTY },
        { name: 'HOD', value: roleCounts.HOD },
        { name: 'Admin', value: roleCounts.ADMIN },
      ];

  // â”€â”€ Handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const handleEditUser = (user) => {
    if (user.id) {
      setAssignmentUser(user);
      setAssignmentDepartment(user.department_id ? String(user.department_id) : '');
      setAssignmentError('');
      setPendingAccountAction(null);
      setAccountActionError('');
    }
  };
  const handleViewDetails = (user) => setDetailsUser(user);
  const exportCsv = (filename, rows) => {
    const csv = toAdminCsv(rows);
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };
  const handleExportUsers = () => exportCsv('admin-users.csv', [
    ['Username', 'Email', 'First name', 'Last name', 'Role', 'Active', 'Department ID'],
    ...users.map(user => [user.username, user.email, user.first_name, user.last_name, user.role_code, user.is_active ? 'Yes' : 'No', user.department_id]),
  ]);
  const handleExportAudit = () => exportCsv('admin-audit-events.csv', [
    ['Event type', 'Entity type', 'Entity ID', 'Actor ID', 'Timestamp', 'Details'],
    ...auditEvents.map(event => [event.event_type, event.entity_type, event.entity_id, event.actor, event.event_time, JSON.stringify(event.details_json ?? {})]),
  ]);
  const handleViewLogs = () => document.getElementById('admin-audit-log')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const openCreateModal = () => {
    setCreateForm(BLANK_FORM);
    setCreateError('');
    setCreateFieldErrors({});
    setShowCreateModal(true);
  };

  const openDepartmentForm = (department = null) => {
    setEditingDepartment(department);
    setDepartmentForm({ code: department?.code || '', name: department?.name || '' });
    setDepartmentError('');
    setDepartmentSuccess('');
    setDepartmentFormOpen(true);
  };

  const handleSaveDepartment = async (e) => {
    e.preventDefault();
    const code = departmentForm.code.trim();
    const name = departmentForm.name.trim();
    if (!code || !name) {
      setDepartmentError('Department code and name are required.');
      return;
    }
    if (code.length > 20 || name.length > 120) {
      setDepartmentError('Code must be 20 characters or fewer and name must be 120 characters or fewer.');
      return;
    }
    const duplicate = departments.find((department) => department.id !== editingDepartment?.id &&
      (department.code.toLowerCase() === code.toLowerCase() || department.name.toLowerCase() === name.toLowerCase()));
    if (duplicate) {
      setDepartmentError('Department code and name must be unique.');
      return;
    }

    setDepartmentSaving(true);
    setDepartmentError('');
    setDepartmentSuccess('');
    try {
      await apiFetch(editingDepartment ? `/admin/departments/${editingDepartment.id}/` : '/admin/departments/', {
        method: editingDepartment ? 'PATCH' : 'POST',
        body: JSON.stringify({ code, name }),
      });
      setDepartmentSuccess(`Department ${editingDepartment ? 'updated' : 'created'} successfully.`);
      setDepartmentFormOpen(false);
      setEditingDepartment(null);
      setDepartmentForm({ code: '', name: '' });
      await refreshDepartments(true);
    } catch (err) {
      setDepartmentError(err?.message || 'Could not save department. Please try again.');
    } finally {
      setDepartmentSaving(false);
    }
  };

  const handleToggleDepartment = async (department) => {
    const nextActive = !department.is_active;
    const action = nextActive ? 'activate' : 'deactivate';
    const confirmed = window.confirm(`Are you sure you want to ${action} ${department.name}?`);
    if (!confirmed) return;
    setDepartmentActionId(department.id);
    setDepartmentError('');
    setDepartmentSuccess('');
    try {
      await apiFetch(`/admin/departments/${department.id}/`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: nextActive }),
      });
      setDepartmentSuccess(`${department.name} ${nextActive ? 'activated' : 'deactivated'} successfully.`);
      await refreshDepartments(true);
    } catch (err) {
      setDepartmentError(err?.message || `Could not ${action} department.`);
    } finally {
      setDepartmentActionId(null);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    const validation = {};
    if (!createForm.username.trim()) validation.username = 'Username is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createForm.email.trim())) validation.email = 'Enter a valid email address.';
    if (createForm.password.length < 8) validation.password = 'Use a password with at least 8 characters.';
    if (createForm.role_code !== 'ADMIN' && !createForm.department) validation.department = 'Select a department.';
    if (Object.keys(validation).length) {
      setCreateFieldErrors(validation);
      return;
    }
    setIsCreating(true);
    setCreateError('');
    setCreateFieldErrors({});
    try {
      await apiFetch('/admin/users/', {
        method: 'POST',
        body: JSON.stringify({
          username:   createForm.username.trim(),
          email:      createForm.email.trim(),
          password:   createForm.password,
          role_code:  createForm.role_code,
          ...(createForm.role_code !== 'ADMIN' ? { department: Number(createForm.department) } : {}),
        }),
      });
      setUsers(await fetchAdminUsers());
      setShowCreateModal(false);
      setCreateForm(BLANK_FORM);
      setCreateFieldErrors({});
      setDashboardNotice('User created successfully.');
    } catch (err) {
      const data = err?.data || {};
      const fields = {};
      ['username', 'email', 'password', 'role_code', 'department'].forEach(field => {
        if (data[field]) fields[field] = Array.isArray(data[field]) ? data[field].join(' ') : data[field];
      });
      setCreateFieldErrors(fields);
      setCreateError(err?.message || 'Failed to create user. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleAssignDepartment = async (e) => {
    e.preventDefault();
    if (!assignmentDepartment) {
      setAssignmentError('Select an active department.');
      return;
    }
    setAssignmentSaving(true);
    setAssignmentError('');
    try {
      await assignUserDepartment(apiFetch, assignmentUser.id, assignmentDepartment);
      setUsers(await fetchAdminUsers());
      setAssignmentUser(null);
      setDashboardNotice('Department updated successfully.');
    } catch (err) {
      setAssignmentError(err?.message || 'Could not assign this department.');
    } finally {
      setAssignmentSaving(false);
    }
  };

  const handleConfirmAccountAction = async () => {
    if (!pendingAccountAction || !assignmentUser || accountActionSaving) return;
    setAccountActionSaving(true);
    setAccountActionError('');
    try {
      if (pendingAccountAction.type === 'status') {
        await setUserActive(apiFetch, assignmentUser.id, pendingAccountAction.isActive);
        const refreshed = await fetchAdminUsers();
        setUsers(refreshed);
        setAssignmentUser(refreshed.find(user => user.id === assignmentUser.id) || null);
        setDashboardNotice(`${assignmentUser.username} ${pendingAccountAction.isActive ? 'activated' : 'deactivated'} successfully.`);
      } else {
        const resetResult = await requestUserPasswordReset(apiFetch, assignmentUser.id);
        setDashboardNotice(resetResult?.detail || 'Password reset request completed by the configured email backend.');
        setAuditEvents(await fetchAuditEvents());
      }
      setPendingAccountAction(null);
    } catch (err) {
      setAccountActionError(err?.message || 'The requested account action could not be completed.');
    } finally {
      setAccountActionSaving(false);
    }
  };

  const QUICK_ACTIONS = buildQuickActions(openCreateModal, handleExportUsers, handleViewLogs);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Icon name="Loader2" size={40} color="var(--color-primary)" className="animate-spin" />
          <p className="text-muted-foreground">Loading admin dataâ€¦</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar isCollapsed={isSidebarCollapsed} onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
      <Header />
      <main className={`transition-all duration-academic ease-academic pt-16 ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        <div className="max-w-[1920px] mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">

          {error && (
            <div className="mb-4 p-3 bg-warning/10 border border-warning/30 rounded-lg text-sm text-warning flex items-center gap-2">
              <Icon name="AlertTriangle" size={16} color="var(--color-warning)" />
              <span>{error}</span>
              <button type="button" onClick={() => setDashboardRefresh(attempt => attempt + 1)} className="ml-auto font-medium underline">Try again</button>
            </div>
          )}
          {dashboardNotice && <p role="status" className="mb-4 rounded-lg border border-success/20 bg-success/10 p-3 text-sm text-success">{dashboardNotice}</p>}
<div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-foreground mb-2">
              Admin Dashboard
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Comprehensive system administration and user management control center
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-4 md:gap-6 mb-6 md:mb-8">
            {statsData?.map((stat, index) => (
              <StatCard key={index} {...stat} />
            ))}
          </div>

          {/* Active account role breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
              {[
                { label: 'Active Students', count: roleCounts.STUDENT, icon: 'GraduationCap', color: 'bg-primary/10 text-primary' },
                { label: 'Active Faculty',  count: roleCounts.FACULTY, icon: 'Users',         color: 'bg-accent/10 text-accent' },
                { label: 'Active HODs',     count: roleCounts.HOD,     icon: 'UserCog',       color: 'bg-warning/10 text-warning' },
                { label: 'Active Admins',   count: roleCounts.ADMIN,   icon: 'Shield',        color: 'bg-error/10 text-error' },
              ].map(({ label, count, icon, color }) => (
                <div key={label} className="bg-card border border-border rounded-lg p-4 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
                    <Icon name={icon} size={20} color="currentColor" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-foreground">{count}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                </div>
              ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
            <div className="lg:col-span-2">
              {/* User Management header with Create User button */}
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-heading font-semibold text-foreground">Users</h2>
                <button
                    id="create-user-btn"
                    onClick={openCreateModal}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-smooth shadow-elevation-sm"
                  >
                    <Icon name="UserPlus" size={16} color="currentColor" />
                    Create User
                </button>
              </div>
              <UserManagementTable
                users={usersData}
                onEditUser={handleEditUser}
                onViewDetails={handleViewDetails}
              />
            </div>
            <div className="space-y-4 md:space-y-6">
              {QUICK_ACTIONS?.map((action, index) => (
                <QuickActionCard key={index} {...action} />
              ))}
            </div>
          </div>

          <section className="mb-6 md:mb-8 rounded-xl border border-border bg-card shadow-elevation-sm" aria-labelledby="department-management-heading">
            <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between md:px-6">
              <div>
                <h2 id="department-management-heading" className="text-lg font-heading font-semibold text-foreground">Department Management</h2>
                <p className="mt-1 text-sm text-muted-foreground">Create departments and manage their availability for user assignments.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => refreshDepartments(true)} disabled={departmentLoading} className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50">
                  <Icon name="RefreshCw" size={15} /> Refresh
                </button>
                <button type="button" onClick={() => openDepartmentForm()} className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                  <Icon name="Plus" size={15} /> Add Department
                </button>
              </div>
            </div>
            <div className="space-y-4 p-4 md:p-6">
              {departmentSuccess && <p role="status" className="rounded-lg border border-success/20 bg-success/10 p-3 text-sm text-success">{departmentSuccess}</p>}
              {departmentError && <p role="alert" className="rounded-lg border border-error/20 bg-error/10 p-3 text-sm text-error">{departmentError}</p>}

              {departmentFormOpen && (
                <form onSubmit={handleSaveDepartment} className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-background p-4 md:grid-cols-[1fr_2fr_auto_auto] md:items-end">
                  <div>
                    <label htmlFor="department-code" className="mb-1 block text-sm font-medium text-foreground">Code</label>
                    <input id="department-code" value={departmentForm.code} onChange={e => setDepartmentForm(form => ({ ...form, code: e.target.value }))} required maxLength={20} className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="e.g. CSE" />
                  </div>
                  <div>
                    <label htmlFor="department-name" className="mb-1 block text-sm font-medium text-foreground">Department name</label>
                    <input id="department-name" value={departmentForm.name} onChange={e => setDepartmentForm(form => ({ ...form, name: e.target.value }))} required maxLength={120} className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="e.g. Computer Science" />
                  </div>
                  <button type="submit" disabled={departmentSaving} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                    {departmentSaving ? 'Savingâ€¦' : editingDepartment ? 'Save changes' : 'Create'}
                  </button>
                  <button type="button" disabled={departmentSaving} onClick={() => { setDepartmentFormOpen(false); setEditingDepartment(null); setDepartmentError(''); }} className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50">Cancel</button>
                </form>
              )}

              {departmentLoading ? (
                <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground" role="status">
                  <Icon name="Loader2" size={18} className="animate-spin" /> Loading departmentsâ€¦
                </div>
              ) : departmentError && departments.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center">
                  <p className="font-medium text-foreground">Departments could not be loaded</p>
                  <button type="button" onClick={() => refreshDepartments(true)} className="mt-2 text-sm font-medium text-primary hover:underline">Try again</button>
                </div>
              ) : departments.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center">
                  <Icon name="Building2" size={32} className="mx-auto mb-3 text-muted-foreground" />
                  <p className="font-medium text-foreground">No departments yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">Add a department to make it available for user assignments.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full min-w-[600px] divide-y divide-border text-left">
                    <thead className="bg-muted/40">
                      <tr>
                        <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Department</th>
                        <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Code</th>
                        <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {departments.map(department => (
                        <tr key={department.id} className="hover:bg-muted/20">
                          <td className="px-4 py-3 text-sm font-medium text-foreground">{department.name}</td>
                          <td className="px-4 py-3 font-mono text-sm text-muted-foreground">{department.code}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${department.is_active ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                              {department.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-2">
                              <button type="button" onClick={() => openDepartmentForm(department)} className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted">Edit</button>
                              <button type="button" onClick={() => handleToggleDepartment(department)} disabled={departmentActionId === department.id} className={`rounded-md border px-3 py-1.5 text-xs font-medium disabled:opacity-50 ${department.is_active ? 'border-warning/30 text-warning hover:bg-warning/10' : 'border-success/30 text-success hover:bg-success/10'}`}>
                                {departmentActionId === department.id ? 'Savingâ€¦' : department.is_active ? 'Deactivate' : 'Activate'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
            <div id="admin-audit-log"><SystemActivityLog activities={activitiesData} onExport={handleExportAudit} /></div>
            <RoleDistributionChart
              data={roleDistributionData}
              title="Active Account Role Distribution"
            />
          </div>

          <p className="mb-6 text-sm text-muted-foreground">Backup management and live system health are not available from the current backend.</p>
        </div>
      </main>
      <Footer />

      {/* â”€â”€ Create User Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {showCreateModal && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-[100]"
            onClick={() => !isCreating && setShowCreateModal(false)}
          />
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div role="dialog" aria-modal="true" aria-labelledby="create-user-heading" className="bg-card border border-border rounded-xl shadow-elevation-xl w-full max-w-md">
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Icon name="UserPlus" size={18} color="var(--color-primary)" />
                  </div>
                  <h3 id="create-user-heading" className="text-base font-heading font-semibold text-foreground">Create New User</h3>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  disabled={isCreating}
                  className="p-1.5 rounded-lg hover:bg-muted transition-smooth text-muted-foreground hover:text-foreground"
                >
                  <Icon name="X" size={18} />
                </button>
              </div>

              {/* Modal body */}
              <form onSubmit={handleCreateUser} className="px-6 py-5 space-y-4">

                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Username <span className="text-error">*</span>
                  </label>
                  <input
                    id="create-user-username"
                    type="text"
                    required
                    value={createForm.username}
                    onChange={(e) => setCreateForm(f => ({ ...f, username: e.target.value }))}
                    placeholder="e.g. jdoe2025"
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  {createFieldErrors.username && <p className="mt-1 text-xs text-error">{createFieldErrors.username}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Email <span className="text-error">*</span>
                  </label>
                  <input
                    id="create-user-email"
                    type="email"
                    required
                    value={createForm.email}
                    onChange={(e) => setCreateForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="user@university.edu"
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  {createFieldErrors.email && <p className="mt-1 text-xs text-error">{createFieldErrors.email}</p>}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Password <span className="text-error">*</span>
                  </label>
                  <input
                    id="create-user-password"
                    type="password"
                    required
                    minLength={8}
                    value={createForm.password}
                    onChange={(e) => setCreateForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="Minimum 8 characters"
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  {createFieldErrors.password && <p className="mt-1 text-xs text-error">{createFieldErrors.password}</p>}
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Role <span className="text-error">*</span>
                  </label>
                  <select
                    id="create-user-role"
                    value={createForm.role_code}
                    onChange={(e) => setCreateForm(f => ({ ...f, role_code: e.target.value, department: e.target.value === 'ADMIN' ? '' : f.department }))}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="STUDENT">Student</option>
                    <option value="FACULTY">Faculty / Guide</option>
                    <option value="HOD">Head of Department</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                  {createFieldErrors.role_code && <p className="mt-1 text-xs text-error">{createFieldErrors.role_code}</p>}
                </div>

                {/* Department */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Department</label>
                  <select
                    id="create-user-department"
                    required={createForm.role_code !== 'ADMIN'}
                    value={createForm.department}
                    onChange={(e) => setCreateForm(f => ({ ...f, department: e.target.value }))}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="">{createForm.role_code === 'ADMIN' ? 'No department' : 'Select department'}</option>
                    {activeDepartments.map(department => <option key={department.id} value={department.id}>{department.name}</option>)}
                  </select>
                  {createFieldErrors.department && <p className="mt-1 text-xs text-error">{createFieldErrors.department}</p>}
                  {createForm.role_code !== 'ADMIN' && activeDepartments.length === 0 && (
                    <p className="mt-1 text-xs text-warning">Create or activate a department before assigning one to this user.</p>
                  )}
                </div>

                {/* Inline error */}
                {createError && (
                  <div className="flex items-center gap-2 p-3 bg-error/10 border border-error/20 rounded-lg">
                    <Icon name="AlertCircle" size={15} color="var(--color-error)" />
                    <p className="text-xs text-error">{createError}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    disabled={isCreating}
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-smooth disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    id="create-user-submit-btn"
                    type="submit"
                    disabled={isCreating}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-smooth disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isCreating ? (
                      <>
                        <Icon name="Loader2" size={15} color="currentColor" className="animate-spin" />
                        Creatingâ€¦
                      </>
                    ) : (
                      <>
                        <Icon name="UserPlus" size={15} color="currentColor" />
                        Create User
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
      {assignmentUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form role="dialog" aria-modal="true" aria-labelledby="assignment-heading" onSubmit={handleAssignDepartment} className="w-full max-w-md space-y-4 rounded-lg bg-card p-6">
            <h2 id="assignment-heading" className="text-lg font-semibold">Edit User Account</h2>
            <p className="text-sm text-muted-foreground">{assignmentUser.email || assignmentUser.username}</p>
            <div className="space-y-2 rounded-md border border-border p-3">
              <h3 className="text-sm font-medium">Department</h3>
              {assignmentUser.department_id ? (
                <>
                  <p className="text-sm text-foreground">{departments.find(department => department.id === assignmentUser.department_id)?.name || 'Assigned department'}</p>
                  <p className="text-xs text-muted-foreground">Department assignments are managed separately and cannot be changed after assignment.</p>
                </>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">Choose an active department before activating this faculty account.</p>
                  <select aria-label="Assign department" value={assignmentDepartment} onChange={e => setAssignmentDepartment(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2">
                    <option value="">Select department</option>
                    {activeDepartments.map(department => <option key={department.id} value={department.id}>{department.name}</option>)}
                  </select>
                  {assignmentError && <p role="alert" className="text-sm text-error">{assignmentError}</p>}
                  <button type="submit" disabled={!assignmentDepartment || assignmentSaving} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50">{assignmentSaving ? 'Saving…' : 'Assign department'}</button>
                </>
              )}
            </div>
            <div className="space-y-3 rounded-md border border-border p-3">
              <div>
                <h3 className="text-sm font-medium">Account access</h3>
                <p className="mt-1 text-sm text-muted-foreground">Current status: {assignmentUser.is_active ? 'Active' : 'Inactive'}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => { setAccountActionError(''); setPendingAccountAction({ type: 'status', isActive: !assignmentUser.is_active }); }} className="rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted">
                  {assignmentUser.is_active ? 'Deactivate account…' : 'Activate account…'}
                </button>
                <button type="button" disabled={!assignmentUser.email} onClick={() => { setAccountActionError(''); setPendingAccountAction({ type: 'password-reset' }); }} className="rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50">
                  Send password reset…
                </button>
              </div>
              {!assignmentUser.email && <p className="text-xs text-muted-foreground">A password reset link requires an email address.</p>}
              {accountActionError && !pendingAccountAction && <p role="alert" className="text-sm text-error">{accountActionError}</p>}
            </div>
            {assignmentError && <p className="text-sm text-error">{assignmentError}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" disabled={assignmentSaving || accountActionSaving} onClick={() => setAssignmentUser(null)} className="rounded-md border border-border px-4 py-2 disabled:opacity-50">Close</button>
            </div>
          </form>
        </div>
      )}
      {pendingAccountAction && assignmentUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <section role="alertdialog" aria-modal="true" aria-labelledby="account-action-heading" aria-describedby="account-action-description" className="w-full max-w-md space-y-4 rounded-lg border border-border bg-card p-6 shadow-xl">
            <h2 id="account-action-heading" className="text-lg font-semibold">
              {pendingAccountAction.type === 'password-reset' ? 'Send password reset link?' : `${pendingAccountAction.isActive ? 'Activate' : 'Deactivate'} account?`}
            </h2>
            <p id="account-action-description" className="text-sm text-muted-foreground">
              {pendingAccountAction.type === 'password-reset'
                ? `A one-time password reset link will be emailed to ${assignmentUser.email}. The current password will not be shown or changed by this request.`
                : pendingAccountAction.isActive
                  ? `This will enable sign-in for ${assignmentUser.email || assignmentUser.userId} and restore access for the assigned role.`
                  : `This will block sign-in and disable role access for ${assignmentUser.email || assignmentUser.userId}.`}
            </p>
            {accountActionError && <p role="alert" className="text-sm text-error">{accountActionError}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" disabled={accountActionSaving} onClick={() => setPendingAccountAction(null)} className="rounded-md border border-border px-4 py-2 text-sm disabled:opacity-50">Cancel</button>
              <button type="button" disabled={accountActionSaving} onClick={handleConfirmAccountAction} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
                {accountActionSaving ? 'Processing…' : pendingAccountAction.type === 'password-reset' ? 'Send reset link' : pendingAccountAction.isActive ? 'Confirm activation' : 'Confirm deactivation'}
              </button>
            </div>
          </section>
        </div>
      )}
      {detailsUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={event => { if (event.target === event.currentTarget) setDetailsUser(null); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="user-details-heading" className="w-full max-w-md space-y-4 rounded-lg bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 id="user-details-heading" className="text-lg font-semibold">User details</h2>
              <button type="button" aria-label="Close user details" onClick={() => setDetailsUser(null)} className="rounded p-1 hover:bg-muted"><Icon name="X" size={18} /></button>
            </div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Name</dt><dd>{detailsUser.name}</dd>
              <dt className="text-muted-foreground">Username</dt><dd>{detailsUser.userId}</dd>
              <dt className="text-muted-foreground">Email</dt><dd>{detailsUser.email}</dd>
              <dt className="text-muted-foreground">Role</dt><dd>{detailsUser.role}</dd>
              <dt className="text-muted-foreground">Status</dt><dd>{detailsUser.status}</dd>
              <dt className="text-muted-foreground">Department</dt><dd>{departments.find(department => department.id === detailsUser.department_id)?.name || 'Not assigned'}</dd>
            </dl>
            <div className="flex justify-end"><button type="button" onClick={() => setDetailsUser(null)} className="rounded-md border border-border px-4 py-2">Close</button></div>
          </section>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
