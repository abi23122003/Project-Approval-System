import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import RoleCard from './components/RoleCard';
import TestAccountCard from './components/TestAccountCard';
import SecurityIndicator from './components/SecurityIndicator';
import LoginForm from './components/LoginForm';

const AuthenticationRoleSelection = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [showTestAccounts, setShowTestAccounts] = useState(true);

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
      label: 'Faculty Guide',
      icon: 'Users',
      description: 'Review student projects, provide feedback, monitor progress, and approve project milestones for your assigned students.',
      route: '/guide-dashboard'
    },
    {
      value: 'reviewer',
      label: 'Review Committee',
      icon: 'ClipboardCheck',
      description: 'Evaluate project submissions, score proposals, and provide comprehensive feedback for academic quality assurance.',
      route: '/reviewer-dashboard'
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

  const testAccounts = [
    {
      id: 1,
      name: 'Sarah Johnson',
      role: 'Student',
      email: 'sarah.johnson@university.edu',
      password: 'student123',
      icon: 'GraduationCap',
      roleValue: 'student'
    },
    {
      id: 2,
      name: 'Dr. Michael Chen',
      role: 'Faculty Guide',
      email: 'michael.chen@university.edu',
      password: 'guide123',
      icon: 'Users',
      roleValue: 'guide'
    },
    {
      id: 3,
      name: 'Prof. Emily Rodriguez',
      role: 'Review Committee',
      email: 'emily.rodriguez@university.edu',
      password: 'reviewer123',
      icon: 'ClipboardCheck',
      roleValue: 'reviewer'
    },
    {
      id: 4,
      name: 'Dr. James Wilson',
      role: 'Head of Department',
      email: 'james.wilson@university.edu',
      password: 'hod123',
      icon: 'UserCog',
      roleValue: 'hod'
    },
    {
      id: 5,
      name: 'Admin User',
      role: 'System Administrator',
      email: 'admin@university.edu',
      password: 'admin123',
      icon: 'Shield',
      roleValue: 'admin'
    }
  ];

  const securityIndicators = [
    { type: 'ldap', label: 'LDAP Connected', status: 'active' },
    { type: 'sis', label: 'SIS Integration', status: 'active' },
    { type: 'session', label: 'Session Timeout: 30min', status: 'active' }
  ];

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setLoginError('');
  };

  const handleLogin = (formData) => {
    setIsLoading(true);
    setLoginError('');

    setTimeout(() => {
      const matchingAccount = testAccounts?.find(
        acc => 
          (acc?.email?.toLowerCase() === formData?.username?.toLowerCase() || 
           acc?.email?.split('@')?.[0]?.toLowerCase() === formData?.username?.toLowerCase()) &&
          acc?.password === formData?.password &&
          acc?.roleValue === selectedRole?.value
      );

      if (matchingAccount) {
        const roleRoute = roles?.find(r => r?.value === selectedRole?.value)?.route;
        try {
          window.localStorage.setItem('aps.role', selectedRole?.value);
          window.localStorage.setItem('aps.userEmail', matchingAccount?.email || '');
          window.localStorage.setItem('aps.userName', matchingAccount?.name || '');
        } catch {
          // ignore storage failures
        }
        navigate(roleRoute || '/student-dashboard');
      } else {
        setLoginError('Invalid credentials for the selected role. Please check your username, password, and ensure they match the selected role.');
      }
      setIsLoading(false);
    }, 1500);
  };

  const handleQuickLogin = (account) => {
    const role = roles?.find(r => r?.value === account?.roleValue);
    setSelectedRole(role);
    setLoginError('');
    
    setTimeout(() => {
      handleLogin({
        username: account?.email,
        password: account?.password,
        rememberDevice: false
      });
    }, 100);
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

          <div className="grid lg:grid-cols-2 gap-6 md:gap-8 lg:gap-12 items-start">
            <div className="space-y-6 md:space-y-8">
              <div>
                <h2 className="text-xl md:text-2xl font-heading font-semibold text-foreground mb-4 md:mb-6">
                  Select Your Role
                </h2>
                <div className="space-y-3 md:space-y-4">
                  {roles?.map((role) => (
                    <RoleCard
                      key={role?.value}
                      role={role}
                      isSelected={selectedRole?.value === role?.value}
                      onClick={() => handleRoleSelect(role)}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-3 md:space-y-4">
                <h3 className="text-base md:text-lg font-heading font-semibold text-foreground">
                  System Status
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-3">
                  {securityIndicators?.map((indicator, index) => (
                    <SecurityIndicator
                      key={index}
                      type={indicator?.type}
                      label={indicator?.label}
                      status={indicator?.status}
                    />
                  ))}
                </div>
              </div>

              <div className="p-4 md:p-5 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <Icon name="Info" size={20} color="var(--color-primary)" className="flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm md:text-base font-medium text-foreground mb-1">
                      Academic Year 2025-2026
                    </h4>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      Current semester: Spring 2026 | Session timeout: 30 minutes
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6 md:space-y-8">
              <div className="bg-card border border-border rounded-xl shadow-elevation-lg p-6 md:p-8">
                <h2 className="text-xl md:text-2xl font-heading font-semibold text-foreground mb-6">
                  Sign In
                </h2>

                {!selectedRole ? (
                  <div className="text-center py-8 md:py-12">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <Icon name="UserCircle" size={40} color="var(--color-muted-foreground)" />
                    </div>
                    <p className="text-sm md:text-base text-muted-foreground">
                      Please select your role to continue
                    </p>
                  </div>
                ) : (
                  <LoginForm
                    selectedRole={selectedRole}
                    onLogin={handleLogin}
                    isLoading={isLoading}
                    error={loginError}
                  />
                )}
              </div>

              {showTestAccounts && (
                <div className="bg-card border border-border rounded-xl shadow-elevation-md p-4 md:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base md:text-lg font-heading font-semibold text-foreground">
                      Test Accounts
                    </h3>
                    <button
                      onClick={() => setShowTestAccounts(false)}
                      className="text-muted-foreground hover:text-foreground transition-smooth"
                    >
                      <Icon name="X" size={18} />
                    </button>
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground mb-4">
                    Quick login with pre-configured test accounts for development
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                    {testAccounts?.map((account) => (
                      <TestAccountCard
                        key={account?.id}
                        account={account}
                        onQuickLogin={handleQuickLogin}
                      />
                    ))}
                  </div>
                </div>
              )}

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
      </div>
    </div>
  );
};

export default AuthenticationRoleSelection;