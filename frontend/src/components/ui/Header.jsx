import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Icon from '../AppIcon';

const ROLE_KEY = 'aps.role';
const EMAIL_KEY = 'aps.userEmail';

const roleHomeRoute = {
  student: '/student-dashboard',
  guide: '/guide-dashboard',
  reviewer: '/reviewer-dashboard',
  hod: '/hod-analytics-dashboard',
  admin: '/admin-dashboard'
};

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentRole, setCurrentRole] = useState('student');
  const [userEmail, setUserEmail] = useState('');
  const [isRoleSwitcherOpen, setIsRoleSwitcherOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const roles = [
    { value: 'student', label: 'Student', icon: 'GraduationCap' },
    { value: 'guide', label: 'Faculty Guide', icon: 'Users' },
    { value: 'reviewer', label: 'Review Committee', icon: 'ClipboardCheck' },
    { value: 'hod', label: 'HOD', icon: 'UserCog' },
    { value: 'admin', label: 'Administrator', icon: 'Shield' }
  ];

  const navigationItems = useMemo(() => ({
    student: [
      { label: 'Dashboard', path: '/student-dashboard', icon: 'LayoutDashboard' },
      { label: 'Projects', path: '/student-project-proposal-form', icon: 'FolderOpen' },
      { label: 'Documents', path: '/student-document-management', icon: 'FileText' },
      { label: 'Notifications', path: '/notification-center', icon: 'Bell' }
    ],
    guide: [
      { label: 'Dashboard', path: '/guide-dashboard', icon: 'LayoutDashboard' },
      { label: 'Reviews', path: '/guide-project-review-interface', icon: 'ClipboardCheck' },
      { label: 'Notifications', path: '/notification-center', icon: 'Bell' }
    ],
    reviewer: [
      { label: 'Dashboard', path: '/reviewer-dashboard', icon: 'LayoutDashboard' },
      { label: 'Review Interface', path: '/guide-project-review-interface', icon: 'ClipboardCheck' },
      { label: 'Notifications', path: '/notification-center', icon: 'Bell' }
    ],
    hod: [
      { label: 'Analytics', path: '/hod-analytics-dashboard', icon: 'BarChart3' },
      { label: 'Notifications', path: '/notification-center', icon: 'Bell' }
    ],
    admin: [
      { label: 'Dashboard', path: '/admin-dashboard', icon: 'LayoutDashboard' },
      { label: 'System Config', path: '/system-configuration-panel', icon: 'Settings' },
      { label: 'Notifications', path: '/notification-center', icon: 'Bell' }
    ]
  }), []);

  useEffect(() => {
    try {
      const storedRole = window.localStorage.getItem(ROLE_KEY);
      const storedEmail = window.localStorage.getItem(EMAIL_KEY);
      if (storedRole) setCurrentRole(storedRole);
      if (storedEmail) setUserEmail(storedEmail);
    } catch {
      // ignore
    }
  }, []);

  const handleRoleChange = (role) => {
    setCurrentRole(role);
    setIsRoleSwitcherOpen(false);
    try { window.localStorage.setItem(ROLE_KEY, role); } catch { /* ignore */ }
    navigate(roleHomeRoute?.[role] || '/authentication-role-selection');
  };

  const handleLogout = () => {
    try {
      ['aps.role', 'aps.userEmail', 'aps.accessToken', 'aps.refreshToken'].forEach(
        k => window.localStorage.removeItem(k)
      );
    } catch { /* ignore */ }
    navigate('/authentication-role-selection');
  };

  const currentNavItems = navigationItems?.[currentRole] || [];
  const currentRoleData = roles?.find(r => r?.value === currentRole);

  const displayName = userEmail
    ? userEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : currentRoleData?.label || 'User';

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-card shadow-elevation-md z-[1000]">
      <div className="h-full flex items-center px-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Icon name="GraduationCap" size={24} color="var(--color-primary)" />
          </div>
          <h1 className="text-xl font-heading font-semibold text-foreground">AcademicProjectHub</h1>
        </div>

        {/* Nav */}
        <nav className="flex items-center gap-2 ml-12">
          {currentNavItems?.map((item) => {
            const isActive = location?.pathname === item?.path;
            return (
              <button
                key={item?.path}
                onClick={() => navigate(item?.path)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-smooth ${
                  isActive ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted'
                }`}
              >
                <Icon name={item?.icon} size={18} />
                <span className="text-sm font-medium">{item?.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {/* Bell → notification center */}
          <button
            onClick={() => navigate('/notification-center')}
            className="p-2 rounded-lg hover:bg-muted transition-smooth"
            title="Notifications"
          >
            <Icon name="Bell" size={20} color="var(--color-foreground)" />
          </button>

          {/* Role switcher */}
          <div className="relative">
            <button
              onClick={() => setIsRoleSwitcherOpen(!isRoleSwitcherOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-smooth"
            >
              <Icon name={currentRoleData?.icon} size={20} color="var(--color-foreground)" />
              <span className="text-sm font-medium text-foreground hidden md:inline">{currentRoleData?.label}</span>
              <Icon name="ChevronDown" size={16} color="var(--color-foreground)" />
            </button>
            {isRoleSwitcherOpen && (
              <>
                <div className="fixed inset-0 z-[1010]" onClick={() => setIsRoleSwitcherOpen(false)} />
                <div className="absolute right-0 top-12 w-56 bg-popover border border-border rounded-lg shadow-elevation-lg z-[1020] overflow-hidden">
                  {roles?.map((role) => (
                    <button
                      key={role?.value}
                      onClick={() => handleRoleChange(role?.value)}
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-smooth ${currentRole === role?.value ? 'bg-muted' : ''}`}
                    >
                      <Icon name={role?.icon} size={18} color="var(--color-foreground)" />
                      <span className="text-sm font-medium text-foreground">{role?.label}</span>
                      {currentRole === role?.value && <Icon name="Check" size={16} color="var(--color-success)" className="ml-auto" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* User avatar + menu */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 pl-3 border-l border-border hover:bg-muted rounded-lg px-3 py-2 transition-smooth"
            >
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <Icon name="User" size={16} color="var(--color-primary)" />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-semibold text-foreground leading-tight max-w-[120px] truncate">{displayName}</p>
                {userEmail && <p className="text-xs text-muted-foreground max-w-[120px] truncate">{userEmail}</p>}
              </div>
            </button>
            {isUserMenuOpen && (
              <>
                <div className="fixed inset-0 z-[1010]" onClick={() => setIsUserMenuOpen(false)} />
                <div className="absolute right-0 top-12 w-64 bg-popover border border-border rounded-lg shadow-elevation-lg z-[1020] overflow-hidden">
                  <div className="px-4 py-3 border-b border-border">
                    <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
                    {userEmail && <p className="text-xs text-muted-foreground truncate">{userEmail}</p>}
                    <p className="text-xs text-primary mt-0.5">{currentRoleData?.label}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-smooth"
                  >
                    <Icon name="LogOut" size={16} color="currentColor" />
                    <span className="text-sm font-medium">Sign Out</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;