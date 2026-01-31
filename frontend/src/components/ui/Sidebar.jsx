import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';

const ROLE_KEY = 'aps.role';

const roleHomeRoute = {
  student: '/student-dashboard',
  guide: '/guide-dashboard',
  reviewer: '/reviewer-dashboard',
  hod: '/hod-analytics-dashboard',
  admin: '/admin-dashboard'
};

const roleNavItems = {
  student: [
    { label: 'Dashboard', path: '/student-dashboard', icon: 'LayoutDashboard' },
    { label: 'Proposal Form', path: '/student-project-proposal-form', icon: 'FileEdit' },
    { label: 'Documents', path: '/student-document-management', icon: 'FileText' },
    { label: 'Notifications', path: '/notification-center', icon: 'Bell' }
  ],
  guide: [
    { label: 'Dashboard', path: '/guide-dashboard', icon: 'LayoutDashboard' },
    { label: 'Project Reviews', path: '/guide-project-review-interface', icon: 'ClipboardCheck' },
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
};

const getCurrentRole = () => {
  try {
    return window.localStorage.getItem(ROLE_KEY) || 'student';
  } catch {
    return 'student';
  }
};

const Sidebar = ({ isCollapsed = false, onToggleCollapse }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const role = useMemo(() => getCurrentRole(), []);
  const navItems = roleNavItems?.[role] || roleNavItems.student;

  const handleNavigate = (path) => {
    navigate(path);
  };

  const handleLogout = () => {
    try {
      window.localStorage.removeItem(ROLE_KEY);
    } catch {
      // ignore
    }
    navigate('/authentication-role-selection');
  };

  const activePath = location?.pathname;

  return (
    <aside
      className={`
        fixed top-0 left-0 bottom-0 z-[900]
        bg-card border-r border-border
        transition-all duration-academic ease-academic
        ${isCollapsed ? 'w-20' : 'w-64'}
        hidden lg:flex lg:flex-col
      `}
    >
      <div
        className={`
          h-16 border-b border-border
          ${isCollapsed
            ? 'flex flex-col items-center justify-center gap-1 px-2'
            : 'flex items-center justify-between px-4'}
        `}
      >
        <button
          onClick={() => handleNavigate(roleHomeRoute?.[role] || '/')}
          className={`flex items-center min-w-0 ${isCollapsed ? 'justify-center' : 'gap-3'}`}
          aria-label="Go to home"
        >
          <div
            className={`${isCollapsed ? 'w-9 h-9' : 'w-10 h-10'} bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0`}
          >
            <Icon name="GraduationCap" size={22} color="var(--color-primary)" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <div className="text-sm font-heading font-semibold text-foreground truncate">AcademicProjectHub</div>
              <div className="text-xs text-muted-foreground truncate">{role?.toUpperCase()}</div>
            </div>
          )}
        </button>

        <button
          onClick={onToggleCollapse}
          className={`${isCollapsed ? 'p-1.5' : 'p-2'} rounded-lg hover:bg-muted transition-smooth`}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <Icon name={isCollapsed ? 'ChevronRight' : 'ChevronLeft'} size={18} color="var(--color-foreground)" />
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = activePath === item.path;
          return (
            <button
              key={item.path}
              onClick={() => handleNavigate(item.path)}
              className={`
                w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-smooth
                ${isActive ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted'}
              `}
            >
              <Icon name={item.icon} size={18} />
              {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border">
        <button
          onClick={handleLogout}
          className={`
            w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-smooth
            text-foreground hover:bg-muted
          `}
        >
          <Icon name="LogOut" size={18} />
          {!isCollapsed && <span className="text-sm font-medium">Sign out</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
