import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Icon from '../AppIcon';

const ROLE_KEY = 'aps.role';

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
  const [isRoleSwitcherOpen, setIsRoleSwitcherOpen] = useState(false);
  const [notificationCount] = useState(3);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

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
      const stored = window.localStorage.getItem(ROLE_KEY);
      if (stored) setCurrentRole(stored);
    } catch {
      // ignore
    }
  }, []);

  const notifications = [
    { id: 1, title: 'Project Approved', message: 'Your project proposal has been approved', time: '2 hours ago', type: 'success' },
    { id: 2, title: 'Document Required', message: 'Please upload the final report', time: '5 hours ago', type: 'warning' },
    { id: 3, title: 'Review Pending', message: 'New project submission awaiting review', time: '1 day ago', type: 'info' }
  ];

  const handleRoleChange = (role) => {
    setCurrentRole(role);
    setIsRoleSwitcherOpen(false);
    try {
      window.localStorage.setItem(ROLE_KEY, role);
    } catch {
      // ignore
    }
    navigate(roleHomeRoute?.[role] || '/authentication-role-selection');
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  const currentNavItems = navigationItems?.[currentRole] || [];
  const currentRoleData = roles?.find(r => r?.value === currentRole);

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-card shadow-elevation-md z-[1000]">
      <div className="h-full flex items-center px-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center transition-smooth hover:bg-primary/20">
            <Icon name="GraduationCap" size={24} color="var(--color-primary)" />
          </div>
          <h1 className="text-xl font-heading font-semibold text-foreground">AcademicProjectHub</h1>
        </div>

        <nav className="flex items-center gap-2 ml-12">
          {currentNavItems?.map((item) => {
            const isActive = location?.pathname === item?.path;
            return (
              <button
                key={item?.path}
                onClick={() => handleNavigation(item?.path)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-smooth ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                <Icon name={item?.icon} size={18} />
                <span className="text-sm font-medium">{item?.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-4">
          <div className="relative">
            <button
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className="relative p-2 rounded-lg hover:bg-muted transition-smooth"
            >
              <Icon name="Bell" size={20} color="var(--color-foreground)" />
              {notificationCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-error text-error-foreground text-xs rounded-full flex items-center justify-center">
                  {notificationCount}
                </span>
              )}
            </button>

            {isNotificationOpen && (
              <>
                <div
                  className="fixed inset-0 z-[1010]"
                  onClick={() => setIsNotificationOpen(false)}
                />
                <div className="absolute right-0 top-12 w-80 bg-popover border border-border rounded-lg shadow-elevation-lg z-[1020] overflow-hidden">
                  <div className="p-4 border-b border-border">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-heading font-semibold text-foreground">Notifications</h3>
                      <button
                        onClick={() => {
                          setIsNotificationOpen(false);
                          navigate('/notification-center');
                        }}
                        className="text-xs text-primary hover:underline"
                      >
                        View all
                      </button>
                    </div>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications?.map((notification) => (
                      <div
                        key={notification?.id}
                        className="p-4 border-b border-border hover:bg-muted transition-smooth cursor-pointer"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-2 ${
                            notification?.type === 'success' ? 'bg-success' :
                            notification?.type === 'warning'? 'bg-warning' : 'bg-primary'
                          }`} />
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-foreground">{notification?.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{notification?.message}</p>
                            <span className="text-xs text-muted-foreground mt-2 block">{notification?.time}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setIsRoleSwitcherOpen(!isRoleSwitcherOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-smooth"
            >
              <Icon name={currentRoleData?.icon} size={20} color="var(--color-foreground)" />
              <span className="text-sm font-medium text-foreground">{currentRoleData?.label}</span>
              <Icon name="ChevronDown" size={16} color="var(--color-foreground)" />
            </button>

            {isRoleSwitcherOpen && (
              <>
                <div
                  className="fixed inset-0 z-[1010]"
                  onClick={() => setIsRoleSwitcherOpen(false)}
                />
                <div className="absolute right-0 top-12 w-56 bg-popover border border-border rounded-lg shadow-elevation-lg z-[1020] overflow-hidden">
                  {roles?.map((role) => (
                    <button
                      key={role?.value}
                      onClick={() => handleRoleChange(role?.value)}
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-smooth ${
                        currentRole === role?.value ? 'bg-muted' : ''
                      }`}
                    >
                      <Icon name={role?.icon} size={18} color="var(--color-foreground)" />
                      <span className="text-sm font-medium text-foreground">{role?.label}</span>
                      {currentRole === role?.value && (
                        <Icon name="Check" size={16} color="var(--color-success)" className="ml-auto" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 pl-4 border-l border-border">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <Icon name="User" size={16} color="var(--color-primary)" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;