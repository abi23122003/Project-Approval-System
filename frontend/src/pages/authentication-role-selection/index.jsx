import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import RoleCard from './components/RoleCard';
import LoginForm from './components/LoginForm';
import { formatApiError, saveTokens, clearSession, logoutSession } from '../../utils/api';
import roleToBackendRoleCode from '../../config/roleMap.json';

const API_BASE = import.meta.env?.VITE_API_BASE_URL || '/api';

const roles = [
  {
    value: 'student',
    label: 'Student',
    icon: 'GraduationCap',
    description: 'Submit project proposals, upload documents, and track your academic project progress throughout the semester.',
    route: '/student-dashboard'
  },
  {
    value: 'guide',
    label: 'Guide / Reviewer',
    icon: 'Users',
    description: 'Faculty mentor or project reviewer',
    route: '/guide-dashboard'
  },
  {
    value: 'hod',
    label: 'Head of Department',
    icon: 'UserCog',
    description: 'Oversee department projects, review analytics, manage faculty assignments, and approve final project submissions.',
    route: '/hod-analytics-dashboard'
  },
  {
    value: 'admin',
    label: 'System Administrator',
    icon: 'Shield',
    description: 'Manage user accounts, configure system settings, monitor audit logs, and maintain institutional compliance.',
    route: '/admin-dashboard'
  }
];

const decodeJwtPayload = (jwt) => {
  try {
    const payloadPart = jwt?.split('.')?.[1];
    if (!payloadPart) return null;
    const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(normalized)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
};

const parseBoolEnv = (value) => {
  if (value == null) return false;
  const normalized = String(value).trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
};

const saveSession = (roleValue, email, accessToken, refreshToken, navigate) => {
  const roleRoute = roles?.find(r => r?.value === roleValue)?.route;
  if (!roleRoute || !accessToken || !refreshToken) throw new Error('Invalid authentication session. Please sign in again.');
  clearSession(false);
  try {
    window.localStorage.setItem('aps.role', roleValue);
    window.localStorage.setItem('aps.userEmail', email || '');
    saveTokens(accessToken, refreshToken);
  } catch (error) {
    clearSession(false);
    throw new Error('Unable to save the session in browser storage.');
  }
  navigate(roleRoute);
};

const AuthenticationRoleSelection = () => {
  const navigate = useNavigate();

  const devDefaultRoleValue = import.meta.env?.VITE_DEV_DEFAULT_ROLE;
  const devDefaultAdminEmail = import.meta.env?.VITE_DEV_DEFAULT_ADMIN_EMAIL;
  const devDefaultAdminPassword = import.meta.env?.VITE_DEV_DEFAULT_ADMIN_PASSWORD;
  const devAutoLogin = parseBoolEnv(import.meta.env?.VITE_DEV_AUTO_LOGIN);

  const initialRole = roles?.find(r => r?.value === devDefaultRoleValue) || roles?.[0] || null;
  const [selectedRole, setSelectedRole] = useState(initialRole);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState('');
  const [authMode, setAuthMode] = useState('login');
  const submissionLock = useRef(false);

  const handleModeChange = (newMode) => {
    setAuthMode(newMode);
    if (newMode === 'register' && selectedRole?.value !== 'student') {
      setSelectedRole(roles.find(role => role.value === 'student') || null);
    }
  };

  const visibleRoles = authMode === 'register'
    ? roles.filter(r => r.value === 'student')
    : roles;

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setLoginError('');
  };

  const handleLogin = async (formData) => {
    if (submissionLock.current) return;
    const expectedRoleCode = roleToBackendRoleCode?.[selectedRole?.value];
    if (!expectedRoleCode) {
      setLoginError('Please select a supported login role.');
      return;
    }
    submissionLock.current = true;
    setIsLoading(true);
    setLoginError('');
    try {
      await logoutSession(false);
      const resp = await fetch(`${API_BASE}/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData?.username,
          password: formData?.password,
          expected_role: expectedRoleCode
        })
      });

      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        const message = data?.detail || 'Invalid credentials. Please check your email and password.';
        setLoginError(message);
        return;
      }

      const access = data?.access;
      const refresh = data?.refresh;
      const payload = decodeJwtPayload(access);
      const backendRoleCode = payload?.role_code;
      const supportedRoleCodes = new Set(Object.values(roleToBackendRoleCode));
      if (!access || !refresh || !payload || !Number.isFinite(Number(payload.exp)) || !payload.user_id || !backendRoleCode || !supportedRoleCodes.has(backendRoleCode) || !data?.user || Number(data.user.id) !== Number(payload.user_id) || data.user.role_code !== backendRoleCode) {
        setLoginError('The server returned an invalid authentication response. Please contact support.');
        return;
      }
      if (backendRoleCode !== expectedRoleCode) {
        setLoginError('Role mismatch: your account role does not match the selected role.');
        return;
      }

      saveSession(selectedRole.value, data.user.email || data.user.username, access, refresh, navigate);
    } catch (error) {
      if (error?.message?.startsWith('Invalid authentication')) {
        setLoginError(error.message);
        return;
      }
      if (error?.message?.includes('browser storage')) {
        setLoginError(error.message);
        return;
      }
      setLoginError('Login failed. Ensure the backend is running on http://localhost:8000 and the frontend can reach /api (Vite proxy).');
    } finally {
      submissionLock.current = false;
      setIsLoading(false);
    }
  };

  const handleRegister = async (formData) => {
    if (!selectedRole?.value) return;
    if (submissionLock.current) return;
    submissionLock.current = true;
    setIsLoading(true);
    setLoginError('');

    const email = (formData?.username || '').trim();
    if (!email.includes('@')) {
      setLoginError('Please enter a valid email to create an account.');
      submissionLock.current = false;
      setIsLoading(false);
      return;
    }
    try {
      const resp = await fetch(`${API_BASE}/auth/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password: formData?.password,
          role_code: roleToBackendRoleCode?.[selectedRole?.value],
        })
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        const message = formatApiError(data, 'Account creation failed. Try a different email.');
        setLoginError(message);
        return;
      }

      setLoginError('Account created. An administrator must assign your department before you can submit a project.');
      setAuthMode('login');
    } catch {
      setLoginError('Account creation failed. Ensure the backend is running on http://localhost:8000 and the frontend can reach /api (Vite proxy).');
    } finally {
      submissionLock.current = false;
      setIsLoading(false);
    }
  };

  const handleForgotPassword = (email) => {
    setForgotPasswordEmail(email);
    setForgotPasswordMessage('');
    setShowForgotPasswordModal(true);
  };

  const handleForgotPasswordSubmit = (email) => {
    if (!email.trim()) {
      setForgotPasswordMessage('Please enter a valid email address.');
      return;
    }
    setForgotPasswordMessage('Password reset is not configured. Contact your administrator to reset your password.');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 lg:py-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 md:mb-10 lg:mb-12">
            <div className="flex items-center justify-center gap-3 mb-4 md:mb-6">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-primary/10 rounded-xl flex items-center justify-center">
                <Icon name="GraduationCap" size={32} color="var(--color-primary)" />
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-foreground">
                AcademicProjectHub
              </h1>
            </div>
            <p className="text-sm md:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto">
              Streamlined academic project management for students, faculty, and administrators
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 md:gap-8 lg:gap-12 items-stretch">
            <div className="bg-card border border-border rounded-xl shadow-elevation-lg p-6 md:p-8 h-full flex flex-col">
              <h2 className="text-xl md:text-2xl font-heading font-semibold text-foreground mb-4 md:mb-6">
                Select Your Role
              </h2>
              <div className="space-y-3 md:space-y-4">
                {visibleRoles?.map((role) => (
                  <RoleCard
                    key={role?.value}
                    role={role}
                    isSelected={selectedRole?.value === role?.value}
                    onClick={() => handleRoleSelect(role)}
                  />
                ))}
              </div>
              {authMode === 'register' && (
                <div className="mt-4 text-xs text-muted-foreground text-center">
                  HOD and Admin accounts must be created by an administrator.
                </div>
              )}
            </div>

            <div className="bg-card border border-border rounded-xl shadow-elevation-lg p-6 md:p-8 h-full flex flex-col">
              <h2 className="text-xl md:text-2xl font-heading font-semibold text-foreground mb-6">
                Sign In
              </h2>

              <LoginForm
                selectedRole={selectedRole}
                onLogin={handleLogin}
                onRegister={handleRegister}
                onForgotPassword={handleForgotPassword}
                isLoading={isLoading}
                error={loginError}
                defaultUsername={selectedRole?.value === 'admin' ? devDefaultAdminEmail : undefined}
                defaultPassword={selectedRole?.value === 'admin' ? devDefaultAdminPassword : undefined}
                autoSubmit={selectedRole?.value === 'admin' ? devAutoLogin : false}
                mode={authMode}
                onModeChange={handleModeChange}
              />
            </div>
          </div>

          <div className="mt-6 md:mt-8">
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <span>&copy; {new Date()?.getFullYear()} AcademicProjectHub</span>
              <span>•</span>
              <button className="hover:text-foreground transition-smooth">Privacy Policy</button>
              <span>•</span>
              <button className="hover:text-foreground transition-smooth">Terms of Service</button>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4">
          <div className="bg-card border border-border rounded-xl shadow-elevation-xl p-6 md:p-8 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg md:text-xl font-heading font-semibold text-foreground">
                Reset Password
              </h3>
              <button
                onClick={() => setShowForgotPasswordModal(false)}
                className="text-muted-foreground hover:text-foreground transition-smooth"
              >
                <Icon name="X" size={20} />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Password reset is not configured. Contact your administrator for help.
            </p>
            <div className="space-y-4">
              <input
                type="email"
                placeholder="your@email.edu"
                value={forgotPasswordEmail}
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background text-foreground"
              />
              {forgotPasswordMessage && (
                <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg text-sm text-primary">
                  {forgotPasswordMessage}
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowForgotPasswordModal(false)}
                  className="flex-1 px-4 py-2 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-smooth"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleForgotPasswordSubmit(forgotPasswordEmail)}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-smooth"
                >
                  Reset Help
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthenticationRoleSelection;
