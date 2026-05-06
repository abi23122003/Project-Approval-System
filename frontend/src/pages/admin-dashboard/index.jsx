import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/ui/Sidebar';
import Header from '../../components/ui/Header';
import Footer from '../../components/ui/Footer';
import StatCard from './components/StatCard';
import UserManagementTable from './components/UserManagementTable';
import SystemActivityLog from './components/SystemActivityLog';
import QuickActionCard from './components/QuickActionCard';
import SystemHealthMonitor from './components/SystemHealthMonitor';
import RoleDistributionChart from './components/RoleDistributionChart';
import BackupManagementPanel from './components/BackupManagementPanel';
import Icon from '../../components/AppIcon';
import {
  apiFetch,
  fetchAdminUsers,
  fetchAuditEvents,
  fetchAdminProjects,
  isDemoSession,
} from '../../utils/api';

// ─── Static data ──────────────────────────────────────────────────────────────

const SYSTEM_HEALTH = [
  { id: 1, name: 'Database Performance', category: 'Infrastructure', icon: 'Database', status: 'healthy', currentValue: '45ms', percentage: 85, threshold: '< 100ms', lastChecked: '2 minutes ago' },
  { id: 2, name: 'API Response Time', category: 'Performance', icon: 'Zap', status: 'healthy', currentValue: '120ms', percentage: 92, threshold: '< 200ms', lastChecked: '1 minute ago' },
  { id: 3, name: 'Storage Usage', category: 'Resources', icon: 'HardDrive', status: 'warning', currentValue: '78%', percentage: 78, threshold: '< 80%', lastChecked: '5 minutes ago' },
  { id: 4, name: 'Memory Usage', category: 'Resources', icon: 'Cpu', status: 'healthy', currentValue: '62%', percentage: 62, threshold: '< 85%', lastChecked: '1 minute ago' },
  { id: 5, name: 'Network Latency', category: 'Network', icon: 'Wifi', status: 'healthy', currentValue: '12ms', percentage: 95, threshold: '< 50ms', lastChecked: '30 seconds ago' },
  { id: 6, name: 'Error Rate', category: 'Reliability', icon: 'AlertTriangle', status: 'healthy', currentValue: '0.1%', percentage: 99, threshold: '< 1%', lastChecked: 'Just now' },
];

const DEMO_BACKUPS = [
  { id: 1, name: 'Daily Automated Backup', status: 'completed', createdAt: 'Today 02:00 AM', size: 2567890123, createdBy: 'System', description: 'Automated daily backup' },
  { id: 2, name: 'Weekly Full Backup', status: 'completed', createdAt: 'This week', size: 2678901234, createdBy: 'System', description: 'Weekly comprehensive backup' },
];

// QUICK_ACTIONS is built inside the component so the Create New User
// button can reference the showCreateModal setter.
const buildQuickActions = (openModal) => [
  {
    title: 'User Management',
    description: 'Manage user accounts and permissions',
    actions: [
      { label: 'Create New User', icon: 'UserPlus', variant: 'default', onClick: openModal },
      { label: 'Export User List', icon: 'Download', variant: 'outline', onClick: () => console.log('Export users') },
    ],
  },
  {
    title: 'System Operations',
    description: 'Perform critical system operations',
    actions: [
      { label: 'Create Backup', icon: 'Database', variant: 'default', onClick: () => console.log('Create backup') },
      { label: 'View Logs', icon: 'FileText', variant: 'outline', onClick: () => console.log('View logs') },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

const DEMO_AVATARS = [
  'https://img.rocket.new/generatedImages/rocket_gen_img_14fee5e48-1763295271225.png',
  'https://img.rocket.new/generatedImages/rocket_gen_img_1ffeb43ad-1763298672388.png',
  'https://img.rocket.new/generatedImages/rocket_gen_img_1a36548bd-1763296665300.png',
  'https://img.rocket.new/generatedImages/rocket_gen_img_130504d21-1763295915180.png',
  'https://img.rocket.new/generatedImages/rocket_gen_img_1f4c07e6c-1763297701460.png',
];

// ─── Component ────────────────────────────────────────────────────────────────

// ─── Blank create-user form ───────────────────────────────────────────────────
const BLANK_FORM = {
  username: '', email: '', password: '', role_code: 'STUDENT', department: '',
};

// ─── Component ────────────────────────────────────────────────────────────────

const AdminDashboard = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [users, setUsers] = useState([]);
  const [auditEvents, setAuditEvents] = useState([]);
  const [projects, setProjects] = useState([]);

  // Create-user modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState(BLANK_FORM);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const isDemo = isDemoSession();

  useEffect(() => {
    if (isDemo) { setLoading(false); return; }

    const load = async () => {
      try {
        const [usrs, events, projs] = await Promise.all([
          fetchAdminUsers().catch(() => []),
          fetchAuditEvents().catch(() => []),
          fetchAdminProjects().catch(() => []),
        ]);
        setUsers(usrs || []);
        setAuditEvents(events || []);
        setProjects(projs || []);
      } catch (e) {
        console.error('Admin dashboard load error:', e);
        setError('Could not load admin data. Showing partial results.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isDemo]);

  // ── Derived data ─────────────────────────────────────────────────────────

  const totalUsers = isDemo ? 2847 : users.length;
  const activeUsers = isDemo ? 1234 : users.filter((u) => u.is_active).length;
  const totalProjects = isDemo ? 248 : projects.length;

  const statsData = [
    {
      title: 'Total Users',
      value: isDemo ? '2,847' : totalUsers.toLocaleString(),
      change: isDemo ? '+12.5%' : `${activeUsers} active`,
      changeType: 'positive',
      icon: 'Users',
      iconColor: 'bg-primary/10',
      trend: 'up',
    },
    {
      title: 'Total Projects',
      value: isDemo ? '1,234' : totalProjects.toLocaleString(),
      change: isDemo ? '+8.2%' : 'in system',
      changeType: 'positive',
      icon: 'FolderOpen',
      iconColor: 'bg-success/10',
      trend: 'up',
    },
    {
      title: 'System Uptime',
      value: '99.8%',
      change: '+0.3%',
      changeType: 'positive',
      icon: 'Server',
      iconColor: 'bg-accent/10',
      trend: 'up',
    },
    {
      title: 'Audit Events',
      value: isDemo ? '47' : auditEvents.length.toLocaleString(),
      change: isDemo ? '-15.3%' : 'total logged',
      changeType: 'positive',
      icon: 'Activity',
      iconColor: 'bg-warning/10',
      trend: 'up',
    },
  ];

  // Map real users to table format
  const usersData = isDemo
    ? [
        { id: 1, name: 'Sarah Johnson', email: 'sarah.johnson@university.edu', userId: 'STU2024001', role: 'Student', status: 'Active', lastActive: '2 hours ago', avatar: DEMO_AVATARS[0], avatarAlt: 'Student profile' },
        { id: 2, name: 'Dr. Michael Chen', email: 'michael.chen@university.edu', userId: 'GDE2024015', role: 'Guide', status: 'Active', lastActive: '30 minutes ago', avatar: DEMO_AVATARS[1], avatarAlt: 'Guide profile' },
        { id: 3, name: 'Prof. Emily Rodriguez', email: 'emily.rodriguez@university.edu', userId: 'REV2024008', role: 'Reviewer', status: 'Active', lastActive: '1 hour ago', avatar: DEMO_AVATARS[2], avatarAlt: 'Reviewer profile' },
        { id: 4, name: 'Dr. James Wilson', email: 'james.wilson@university.edu', userId: 'HOD2024003', role: 'HOD', status: 'Active', lastActive: '15 minutes ago', avatar: DEMO_AVATARS[3], avatarAlt: 'HOD profile' },
        { id: 5, name: 'Lisa Anderson', email: 'lisa.anderson@university.edu', userId: 'ADM2024001', role: 'Admin', status: 'Active', lastActive: 'Just now', avatar: DEMO_AVATARS[4], avatarAlt: 'Admin profile' },
      ]
    : users.slice(0, 20).map((u, i) => ({
        id: u.id,
        name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username || u.email,
        email: u.email || u.username,
        userId: u.username,
        role: ROLE_LABEL_MAP[u.role_code] || u.role_code || 'User',
        status: u.is_active ? 'Active' : 'Inactive',
        lastActive: 'Recently',
        avatar: DEMO_AVATARS[i % DEMO_AVATARS.length],
        avatarAlt: 'User profile photo',
      }));

  // Map real audit events to activity log format
  const activitiesData = isDemo
    ? [
        { id: 1, type: 'user_created', action: 'New User Account Created', description: 'Student account created successfully', performedBy: 'Admin', ipAddress: '192.168.1.45', timestamp: '5 minutes ago', severity: 'low' },
        { id: 2, type: 'role_changed', action: 'User Role Modified', description: 'User role changed from Student to Guide', performedBy: 'Admin', ipAddress: '192.168.1.45', timestamp: '15 minutes ago', severity: 'medium' },
        { id: 3, type: 'security_alert', action: 'Multiple Failed Login Attempts', description: 'User exceeded maximum login attempts', performedBy: 'System', ipAddress: '203.45.67.89', timestamp: '1 hour ago', severity: 'high' },
        { id: 4, type: 'backup_created', action: 'System Backup Completed', description: 'Automated daily backup completed (2.4 GB)', performedBy: 'System', ipAddress: 'Internal', timestamp: '2 hours ago', severity: 'low' },
      ]
    : auditEvents.slice(0, 10).map((e) => ({
        id: e.id,
        type: e.event_type?.toLowerCase() || 'info',
        action: `${e.event_type} — ${e.entity_type}`,
        description: e.details_json ? JSON.stringify(e.details_json).slice(0, 80) : `Entity #${e.entity_id}`,
        performedBy: e.actor ? `User #${e.actor}` : 'System',
        ipAddress: 'N/A',
        timestamp: formatRelativeTime(e.event_time),
        severity: e.event_type?.includes('DELETE') || e.event_type?.includes('REJECT') ? 'high' : 'low',
      }));

  // Role distribution
  const roleCounts = { STUDENT: 0, FACULTY: 0, HOD: 0, ADMIN: 0 };
  if (!isDemo) {
    users.forEach((u) => {
      const r = u.role_code;
      if (r && roleCounts[r] !== undefined) roleCounts[r]++;
    });
  }

  const roleDistributionData = isDemo
    ? [
        { name: 'Student', value: 1847 },
        { name: 'Guide', value: 456 },
        { name: 'Reviewer', value: 234 },
        { name: 'HOD', value: 89 },
        { name: 'Admin', value: 221 },
      ]
    : [
        { name: 'Student', value: roleCounts.STUDENT },
        { name: 'Guide/Reviewer', value: roleCounts.FACULTY },
        { name: 'HOD', value: roleCounts.HOD },
        { name: 'Admin', value: roleCounts.ADMIN },
      ];

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleEditUser    = (user)   => console.log('Edit user:', user);
  const handleDeleteUser  = (user)   => console.log('Delete user:', user);
  const handleViewDetails = (user)   => console.log('View details:', user);
  const handleCreateBackup          = ()       => console.log('Create backup');
  const handleRestoreBackup         = (backup) => console.log('Restore backup:', backup);
  const handleDeleteBackup          = (backup) => console.log('Delete backup:', backup);

  const openCreateModal = () => {
    setCreateForm(BLANK_FORM);
    setCreateError('');
    setShowCreateModal(true);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!createForm.username || !createForm.email || !createForm.password) {
      setCreateError('Username, email and password are required.');
      return;
    }
    setIsCreating(true);
    setCreateError('');
    try {
      await apiFetch('/admin/users/', {
        method: 'POST',
        body: JSON.stringify({
          username:   createForm.username.trim(),
          email:      createForm.email.trim(),
          password:   createForm.password,
          role_code:  createForm.role_code,
          department: createForm.department.trim() || undefined,
        }),
      });
      // Refresh users list
      const fresh = await fetchAdminUsers().catch(() => []);
      setUsers(fresh || []);
      setShowCreateModal(false);
      setCreateForm(BLANK_FORM);
    } catch (err) {
      setCreateError(err?.message || 'Failed to create user. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const QUICK_ACTIONS = buildQuickActions(openCreateModal);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Icon name="Loader2" size={40} color="var(--color-primary)" className="animate-spin" />
          <p className="text-muted-foreground">Loading admin data…</p>
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
              {error}
            </div>
          )}

          {isDemo && (
            <div className="mb-4 p-3 bg-accent/10 border border-accent/30 rounded-lg text-sm text-accent flex items-center gap-2">
              <Icon name="Info" size={16} color="var(--color-accent)" />
              Demo session — showing sample admin data. Real accounts display live users and audit logs.
            </div>
          )}

          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-foreground mb-2">
              Admin Dashboard
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Comprehensive system administration and user management control center
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
            {statsData?.map((stat, index) => (
              <StatCard key={index} {...stat} />
            ))}
          </div>

          {/* Role-breakdown stats (real sessions only) */}
          {!isDemo && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
              {[
                { label: 'Students',    count: roleCounts.STUDENT, icon: 'GraduationCap', color: 'bg-primary/10 text-primary' },
                { label: 'Faculty',     count: roleCounts.FACULTY, icon: 'Users',         color: 'bg-accent/10 text-accent' },
                { label: 'HODs',        count: roleCounts.HOD,     icon: 'UserCog',       color: 'bg-warning/10 text-warning' },
                { label: 'Admins',      count: roleCounts.ADMIN,   icon: 'Shield',        color: 'bg-error/10 text-error' },
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
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
            <div className="lg:col-span-2">
              {/* User Management header with Create User button */}
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-heading font-semibold text-foreground">Users</h2>
                {!isDemo && (
                  <button
                    id="create-user-btn"
                    onClick={openCreateModal}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-smooth shadow-elevation-sm"
                  >
                    <Icon name="UserPlus" size={16} color="currentColor" />
                    Create User
                  </button>
                )}
              </div>
              <UserManagementTable
                users={usersData}
                onEditUser={handleEditUser}
                onDeleteUser={handleDeleteUser}
                onViewDetails={handleViewDetails}
              />
            </div>
            <div className="space-y-4 md:space-y-6">
              {QUICK_ACTIONS?.map((action, index) => (
                <QuickActionCard key={index} {...action} />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
            <SystemActivityLog activities={activitiesData} />
            <RoleDistributionChart data={roleDistributionData} />
          </div>

          <div className="mb-6 md:mb-8">
            <SystemHealthMonitor metrics={SYSTEM_HEALTH} />
          </div>

          <div className="mb-6 md:mb-8">
            <BackupManagementPanel
              backups={DEMO_BACKUPS}
              onCreateBackup={handleCreateBackup}
              onRestoreBackup={handleRestoreBackup}
              onDeleteBackup={handleDeleteBackup}
            />
          </div>
        </div>
      </main>
      <Footer />

      {/* ── Create User Modal ────────────────────────────────────────────── */}
      {showCreateModal && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-[100]"
            onClick={() => !isCreating && setShowCreateModal(false)}
          />
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-xl shadow-elevation-xl w-full max-w-md">
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Icon name="UserPlus" size={18} color="var(--color-primary)" />
                  </div>
                  <h3 className="text-base font-heading font-semibold text-foreground">Create New User</h3>
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
                    value={createForm.password}
                    onChange={(e) => setCreateForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="Minimum 8 characters"
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Role <span className="text-error">*</span>
                  </label>
                  <select
                    id="create-user-role"
                    value={createForm.role_code}
                    onChange={(e) => setCreateForm(f => ({ ...f, role_code: e.target.value }))}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="STUDENT">Student</option>
                    <option value="FACULTY">Faculty / Guide</option>
                    <option value="HOD">Head of Department</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                </div>

                {/* Department */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Department</label>
                  <input
                    id="create-user-department"
                    type="text"
                    value={createForm.department}
                    onChange={(e) => setCreateForm(f => ({ ...f, department: e.target.value }))}
                    placeholder="e.g. Computer Science (optional)"
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
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
                        Creating…
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
    </div>
  );
};

export default AdminDashboard;