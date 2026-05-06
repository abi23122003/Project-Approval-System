import React, { useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import Icon from '../AppIcon';
import { clearSession } from '../../utils/api';

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLE_LABELS = {
  student:  'Student',
  guide:    'Faculty Guide',
  reviewer: 'Review Committee',
  hod:      'Head of Department',
  admin:    'Administrator',
};

const ROLE_ICONS = {
  student:  'GraduationCap',
  guide:    'Users',
  reviewer: 'ClipboardCheck',
  hod:      'UserCog',
  admin:    'Shield',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Read current role from localStorage (initializer – runs once). */
const readRole = () => {
  try { return window.localStorage.getItem('aps.role') || 'student'; }
  catch { return 'student'; }
};

/**
 * Return { name, email } from localStorage.
 * Tries 'aps.user' (JSON) first, then falls back to 'aps.userEmail'.
 */
const readUser = () => {
  try {
    const raw = window.localStorage.getItem('aps.user');
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        name:  parsed?.name  || parsed?.username || null,
        email: parsed?.email || null,
      };
    }
  } catch { /* ignore JSON errors */ }
  try {
    const email = window.localStorage.getItem('aps.userEmail') || '';
    return { name: null, email };
  } catch { return { name: null, email: '' }; }
};

/** Derive a display name from a raw email string. */
const emailToName = (email) =>
  email
    ? email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : 'User';

// ─── Component ────────────────────────────────────────────────────────────────

const Header = () => {
  const navigate  = useNavigate();
  const location  = useLocation();

  // Read role/user once on mount via initializer functions (avoids useEffect flash)
  const [currentRole] = useState(readRole);
  const [user]        = useState(readUser);

  const displayName = user.name || emailToName(user.email);
  const roleLabel   = ROLE_LABELS[currentRole] || currentRole;
  const roleIcon    = ROLE_ICONS[currentRole]  || 'User';

  const navigationItems = useMemo(() => ({
    student: [
      { label: 'Dashboard',      path: '/student-dashboard',             icon: 'LayoutDashboard' },
      { label: 'Projects',       path: '/student-project-proposal-form', icon: 'FolderOpen' },
      { label: 'Documents',      path: '/student-document-management',   icon: 'FileText' },
      { label: 'Notifications',  path: '/notification-center',           icon: 'Bell' },
    ],
    guide: [
      { label: 'Dashboard',     path: '/guide-dashboard',                icon: 'LayoutDashboard' },
      { label: 'Reviews',       path: '/guide-project-review-interface', icon: 'ClipboardCheck' },
      { label: 'Notifications', path: '/notification-center',            icon: 'Bell' },
    ],
    reviewer: [
      { label: 'Dashboard',        path: '/reviewer-dashboard',              icon: 'LayoutDashboard' },
      { label: 'Review Interface', path: '/guide-project-review-interface',  icon: 'ClipboardCheck' },
      { label: 'Notifications',    path: '/notification-center',             icon: 'Bell' },
    ],
    hod: [
      { label: 'Analytics',     path: '/hod-analytics-dashboard', icon: 'BarChart3' },
      { label: 'Notifications', path: '/notification-center',     icon: 'Bell' },
    ],
    admin: [
      { label: 'Dashboard',     path: '/admin-dashboard',              icon: 'LayoutDashboard' },
      { label: 'System Config', path: '/system-configuration-panel',   icon: 'Settings' },
      { label: 'Notifications', path: '/notification-center',          icon: 'Bell' },
    ],
  }), []);

  const currentNavItems = navigationItems[currentRole] || [];

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-card shadow-elevation-md z-[1000]">
      <div className="h-full flex items-center px-6">

        {/* ── Logo ─────────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Icon name="GraduationCap" size={24} color="var(--color-primary)" />
          </div>
          <h1 className="text-xl font-heading font-semibold text-foreground">
            AcademicProjectHub
          </h1>
        </div>

        {/* ── Navigation ───────────────────────────────────────────────────── */}
        <nav className="flex items-center gap-2 ml-12">
          {currentNavItems.map((item) => {
            const isActive = location?.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-smooth ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                <Icon name={item.icon} size={18} />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* ── Right side ───────────────────────────────────────────────────── */}
        <div className="ml-auto flex items-center gap-3">

          {/* Bell → notification center */}
          <button
            onClick={() => navigate('/notification-center')}
            className="p-2 rounded-lg hover:bg-muted transition-smooth"
            title="Notifications"
          >
            <Icon name="Bell" size={20} color="var(--color-foreground)" />
          </button>

          {/* Read-only role badge */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
            <Icon name={roleIcon} size={18} color="var(--color-foreground)" />
            <span className="text-sm font-medium text-foreground hidden md:inline">
              {roleLabel}
            </span>
          </div>

          {/* User info */}
          <div className="flex items-center gap-2 pl-3 border-l border-border">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <Icon name="User" size={16} color="var(--color-primary)" />
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-foreground leading-tight max-w-[120px] truncate">
                {displayName}
              </p>
              {user.email && (
                <p className="text-xs text-muted-foreground max-w-[120px] truncate">
                  {user.email}
                </p>
              )}
            </div>
          </div>

          {/* Logout button */}
          <button
            id="header-logout-btn"
            onClick={clearSession}
            title="Logout"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-smooth"
          >
            <LogOut size={16} />
            <span className="text-sm font-medium hidden md:inline">Logout</span>
          </button>

        </div>
      </div>
    </header>
  );
};

export default Header;