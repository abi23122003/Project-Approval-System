import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import Sidebar from '../../components/ui/Sidebar';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

import ConfigurationCard from './components/ConfigurationCard';
import SettingItem from './components/SettingItem';
import ConfigurationModal from './components/ConfigurationModal';
import AuditLogTable from './components/AuditLogTable';
import SystemHealthWidget from './components/SystemHealthWidget';
import { fetchAuditEvents, isDemoSession, getUserName } from '../../utils/api';

const SystemConfigurationPanel = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentConfigType, setCurrentConfigType] = useState(null);
  const [currentConfig, setCurrentConfig] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Load audit logs when the audit tab is opened
  useEffect(() => {
    if (activeTab !== 'audit') return;
    setLogsLoading(true);
    fetchAuditEvents()
      .then(events => {
        if (events?.length) {
          setAuditLogs(events.slice(0, 20).map((e, i) => ({
            id: e.id || i,
            timestamp: new Date(e.event_time).toLocaleString(),
            action: e.event_type?.toLowerCase().split('_')[0] || 'updated',
            configuration: `${e.entity_type || 'System'} #${e.entity_id || ''}`,
            user: e.actor ? `User #${e.actor}` : 'System',
            details: e.details_json ? JSON.stringify(e.details_json).slice(0, 80) : e.event_type,
          })));
        } else {
          // Fallback for demo / empty backend
          setAuditLogs([
            { id: 1, timestamp: new Date().toLocaleString(), action: 'info', configuration: 'System', user: getUserName('Admin'), details: 'No audit events found. Connect backend for real data.' },
          ]);
        }
      })
      .catch(() => {
        setAuditLogs([
          { id: 1, timestamp: new Date().toLocaleString(), action: 'error', configuration: 'System', user: 'System', details: 'Failed to load audit logs.' },
        ]);
      })
      .finally(() => setLogsLoading(false));
  }, [activeTab]);

  const configurationCategories = [
    {
      id: 1,
      title: "Academic Term Configuration",
      description: "Manage academic terms, semesters, and session schedules",
      icon: "Calendar",
      iconColor: "var(--color-primary)",
      status: "active",
      lastModified: "Jan 24, 2026",
      configType: "academic-term"
    },
    {
      id: 2,
      title: "Grading Scales & Rubrics",
      description: "Configure evaluation criteria and grading systems",
      icon: "Award",
      iconColor: "var(--color-accent)",
      status: "active",
      lastModified: "Jan 22, 2026",
      configType: "grading-scale"
    },
    {
      id: 3,
      title: "Notification Orchestration",
      description: "Set up automated notifications and communication workflows",
      icon: "Bell",
      iconColor: "var(--color-warning)",
      status: "warning",
      lastModified: "Jan 20, 2026",
      configType: "notification"
    },
    {
      id: 4,
      title: "Workflow Customization",
      description: "Define project lifecycle stages and approval processes",
      icon: "GitBranch",
      iconColor: "var(--color-brand-purple)",
      status: "active",
      lastModified: "Jan 18, 2026",
      configType: "workflow"
    },
    {
      id: 5,
      title: "User Role Permissions",
      description: "Configure access controls and role-based permissions",
      icon: "Shield",
      iconColor: "var(--color-success)",
      status: "active",
      lastModified: "Jan 15, 2026",
      configType: "permissions"
    },
    {
      id: 6,
      title: "Integration Settings",
      description: "Manage external system connections and API configurations",
      icon: "Plug",
      iconColor: "var(--color-secondary)",
      status: "inactive",
      lastModified: "Jan 10, 2026",
      configType: "integration"
    }
  ];

  const generalSettings = [
    {
      id: 1,
      type: 'text',
      label: 'Institution Name',
      description: 'Official name displayed across the system',
      value: 'University of Academic Excellence',
      icon: 'Building2'
    },
    {
      id: 2,
      type: 'text',
      label: 'System Administrator Email',
      description: 'Primary contact for system notifications',
      value: 'admin@academicflow.edu',
      icon: 'Mail'
    },
    {
      id: 3,
      type: 'select',
      label: 'Default Language',
      description: 'Primary language for system interface',
      value: 'en',
      options: [
        { value: 'en', label: 'English' },
        { value: 'es', label: 'Spanish' },
        { value: 'fr', label: 'French' }
      ],
      icon: 'Globe'
    },
    {
      id: 4,
      type: 'select',
      label: 'Time Zone',
      description: 'Default timezone for all timestamps',
      value: 'America/New_York',
      options: [
        { value: 'America/New_York', label: 'Eastern Time (ET)' },
        { value: 'America/Chicago', label: 'Central Time (CT)' },
        { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' }
      ],
      icon: 'Clock'
    },
    {
      id: 5,
      type: 'number',
      label: 'Session Timeout (minutes)',
      description: 'Automatic logout after inactivity period',
      value: '30',
      icon: 'Timer'
    },
    {
      id: 6,
      type: 'checkbox',
      label: 'Enable Two-Factor Authentication',
      description: 'Require 2FA for all administrative accounts',
      value: true,
      icon: 'Lock'
    },
    {
      id: 7,
      type: 'checkbox',
      label: 'Enable Audit Logging',
      description: 'Track all configuration changes and system events',
      value: true,
      icon: 'FileText'
    },
    {
      id: 8,
      type: 'checkbox',
      label: 'Maintenance Mode',
      description: 'Restrict system access for maintenance',
      value: false,
      icon: 'AlertTriangle'
    }
  ];

  const securitySettings = [
    {
      id: 1,
      type: 'number',
      label: 'Password Minimum Length',
      description: 'Minimum characters required for passwords',
      value: '8',
      icon: 'Key'
    },
    {
      id: 2,
      type: 'checkbox',
      label: 'Require Special Characters',
      description: 'Passwords must include special characters',
      value: true,
      icon: 'Hash'
    },
    {
      id: 3,
      type: 'number',
      label: 'Password Expiry (days)',
      description: 'Force password change after specified days',
      value: '90',
      icon: 'Calendar'
    },
    {
      id: 4,
      type: 'number',
      label: 'Maximum Login Attempts',
      description: 'Lock account after failed login attempts',
      value: '5',
      icon: 'ShieldAlert'
    },
    {
      id: 5,
      type: 'number',
      label: 'Account Lockout Duration (minutes)',
      description: 'Time before locked account can retry',
      value: '15',
      icon: 'Clock'
    },
    {
      id: 6,
      type: 'checkbox',
      label: 'Enable IP Whitelisting',
      description: 'Restrict access to approved IP addresses',
      value: false,
      icon: 'Globe'
    },
    {
      id: 7,
      type: 'checkbox',
      label: 'Log Security Events',
      description: 'Record all authentication and authorization events',
      value: true,
      icon: 'FileText'
    }
  ];

  const dataRetentionSettings = [
    {
      id: 1,
      type: 'number',
      label: 'Project Data Retention (years)',
      description: 'How long to keep completed project records',
      value: '7',
      icon: 'Database'
    },
    {
      id: 2,
      type: 'number',
      label: 'Audit Log Retention (months)',
      description: 'Duration to maintain system audit logs',
      value: '12',
      icon: 'FileText'
    },
    {
      id: 3,
      type: 'number',
      label: 'User Activity Retention (days)',
      description: 'How long to keep user activity logs',
      value: '90',
      icon: 'Activity'
    },
    {
      id: 4,
      type: 'checkbox',
      label: 'Auto-Archive Old Projects',
      description: 'Automatically archive projects after retention period',
      value: true,
      icon: 'Archive'
    },
    {
      id: 5,
      type: 'checkbox',
      label: 'Enable Data Backup',
      description: 'Automatic daily system backups',
      value: true,
      icon: 'HardDrive'
    },
    {
      id: 6,
      type: 'select',
      label: 'Backup Frequency',
      description: 'How often to perform system backups',
      value: 'daily',
      options: [
        { value: 'hourly', label: 'Hourly' },
        { value: 'daily', label: 'Daily' },
        { value: 'weekly', label: 'Weekly' }
      ],
      icon: 'RefreshCw'
    }
  ];


  const systemHealthMetrics = [
    {
      id: 1,
      name: "Database Performance",
      value: "98%",
      percentage: 98,
      status: "healthy",
      description: "Query response time optimal"
    },
    {
      id: 2,
      name: "API Response Time",
      value: "145ms",
      percentage: 92,
      status: "healthy",
      description: "Average response time"
    },
    {
      id: 3,
      name: "Storage Usage",
      value: "67%",
      percentage: 67,
      status: "warning",
      description: "2.1TB of 3TB used"
    },
    {
      id: 4,
      name: "Active Sessions",
      value: "1,247",
      percentage: 83,
      status: "healthy",
      description: "Current user sessions"
    }
  ];

  const tabs = [
    { id: 'general', label: 'General Settings', icon: 'Settings' },
    { id: 'security', label: 'Security & Privacy', icon: 'Shield' },
    { id: 'data', label: 'Data Retention', icon: 'Database' },
    { id: 'audit', label: 'Audit Logs', icon: 'FileText' }
  ];

  const handleConfigure = (configType, currentData = null) => {
    setCurrentConfigType(configType);
    setCurrentConfig(currentData);
    setIsModalOpen(true);
  };

  const handleSaveConfiguration = (config) => {
    console.log('Saving configuration:', config);
  };

  const getModalTitle = () => {
    switch (currentConfigType) {
      case 'academic-term':
        return 'Configure Academic Term';
      case 'grading-scale':
        return 'Configure Grading Scale';
      case 'notification':
        return 'Configure Notification Template';
      case 'workflow':
        return 'Configure Workflow';
      default:
        return 'Configure Setting';
    }
  };

  const getModalDescription = () => {
    switch (currentConfigType) {
      case 'academic-term':
        return 'Set up academic term dates and activation status';
      case 'grading-scale':
        return 'Define grading criteria and evaluation scales';
      case 'notification':
        return 'Create automated notification templates';
      case 'workflow':
        return 'Customize project review workflows';
      default:
        return 'Modify system configuration';
    }
  };

  const filteredCategories = configurationCategories?.filter(category =>
    category?.title?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
    category?.description?.toLowerCase()?.includes(searchQuery?.toLowerCase())
  );

  return (
    <>
      <Helmet>
        <title>System Configuration Panel - AcademicFlow</title>
        <meta name="description" content="Administrative controls for system-wide settings and preferences in AcademicFlow enterprise academic management system" />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Sidebar 
          isCollapsed={isSidebarCollapsed} 
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
        />

        <div className={`transition-all duration-academic ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
          <div className="sticky top-0 z-20 bg-card border-b border-border px-4 md:px-6 lg:px-8 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="font-heading font-bold text-xl md:text-2xl lg:text-3xl text-foreground mb-1">
                  System Configuration
                </h1>
                <p className="text-sm md:text-base text-muted-foreground">
                  Manage enterprise-level settings and system preferences
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  iconName="Download"
                  iconPosition="left"
                >
                  Export Config
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  iconName="Save"
                  iconPosition="left"
                >
                  Save All Changes
                </Button>
              </div>
            </div>
          </div>

          <div className="px-4 md:px-6 lg:px-8 py-6 md:py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2">
                <div className="bg-card border border-border rounded-lg p-4 md:p-6 mb-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <h2 className="font-heading font-semibold text-lg md:text-xl text-foreground">
                      Configuration Categories
                    </h2>
                    <div className="relative w-full sm:w-64">
                      <Icon 
                        name="Search" 
                        size={18} 
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                      />
                      <Input
                        type="search"
                        placeholder="Search configurations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e?.target?.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredCategories?.map((category) => (
                      <ConfigurationCard
                        key={category?.id}
                        title={category?.title}
                        description={category?.description}
                        icon={category?.icon}
                        iconColor={category?.iconColor}
                        status={category?.status}
                        lastModified={category?.lastModified}
                        onConfigure={() => handleConfigure(category?.configType)}
                      />
                    ))}
                  </div>
                </div>

                <div className="bg-card border border-border rounded-lg p-4 md:p-6">
                  <div className="flex items-center space-x-2 mb-6 overflow-x-auto pb-2">
                    {tabs?.map((tab) => (
                      <button
                        key={tab?.id}
                        onClick={() => setActiveTab(tab?.id)}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all duration-academic ${
                          activeTab === tab?.id
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        <Icon name={tab?.icon} size={16} />
                        <span className="text-sm font-medium">{tab?.label}</span>
                      </button>
                    ))}
                  </div>

                  {activeTab === 'general' && (
                    <div>
                      <h3 className="font-heading font-semibold text-base md:text-lg text-foreground mb-4">
                        General System Settings
                      </h3>
                      <div className="space-y-0">
                        {generalSettings?.map((setting) => (
                          <SettingItem
                            key={setting?.id}
                            type={setting?.type}
                            label={setting?.label}
                            description={setting?.description}
                            value={setting?.value}
                            onChange={(value) => console.log('Setting changed:', value)}
                            options={setting?.options}
                            icon={setting?.icon}
                            placeholder=""
                            error=""
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === 'security' && (
                    <div>
                      <h3 className="font-heading font-semibold text-base md:text-lg text-foreground mb-4">
                        Security & Privacy Settings
                      </h3>
                      <div className="space-y-0">
                        {securitySettings?.map((setting) => (
                          <SettingItem
                            key={setting?.id}
                            type={setting?.type}
                            label={setting?.label}
                            description={setting?.description}
                            value={setting?.value}
                            onChange={(value) => console.log('Setting changed:', value)}
                            options={setting?.options}
                            icon={setting?.icon}
                            placeholder=""
                            error=""
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === 'data' && (
                    <div>
                      <h3 className="font-heading font-semibold text-base md:text-lg text-foreground mb-4">
                        Data Retention & Backup
                      </h3>
                      <div className="space-y-0">
                        {dataRetentionSettings?.map((setting) => (
                          <SettingItem
                            key={setting?.id}
                            type={setting?.type}
                            label={setting?.label}
                            description={setting?.description}
                            value={setting?.value}
                            onChange={(value) => console.log('Setting changed:', value)}
                            options={setting?.options}
                            icon={setting?.icon}
                            placeholder=""
                            error=""
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === 'audit' && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-heading font-semibold text-base md:text-lg text-foreground">
                          Recent Configuration Changes
                        </h3>
                        <Button
                          variant="outline"
                          size="sm"
                          iconName="Download"
                          iconPosition="left"
                        >
                          Export Logs
                        </Button>
                      </div>
                      <AuditLogTable logs={auditLogs} />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <SystemHealthWidget metrics={systemHealthMetrics} />

                <div className="bg-card border border-border rounded-lg p-4 md:p-6">
                  <h3 className="font-heading font-semibold text-base md:text-lg text-foreground mb-4">
                    Quick Actions
                  </h3>
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      fullWidth
                      iconName="RefreshCw"
                      iconPosition="left"
                    >
                      Refresh System Cache
                    </Button>
                    <Button
                      variant="outline"
                      fullWidth
                      iconName="Database"
                      iconPosition="left"
                    >
                      Run Database Optimization
                    </Button>
                    <Button
                      variant="outline"
                      fullWidth
                      iconName="FileText"
                      iconPosition="left"
                    >
                      Generate System Report
                    </Button>
                    <Button
                      variant="outline"
                      fullWidth
                      iconName="AlertTriangle"
                      iconPosition="left"
                    >
                      Test Notification System
                    </Button>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-lg p-4 md:p-6">
                  <h3 className="font-heading font-semibold text-base md:text-lg text-foreground mb-4">
                    System Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b border-border">
                      <span className="text-sm text-muted-foreground">Version</span>
                      <span className="text-sm font-medium text-foreground">v2.4.1</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-border">
                      <span className="text-sm text-muted-foreground">Last Updated</span>
                      <span className="text-sm font-medium text-foreground">Jan 15, 2026</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-border">
                      <span className="text-sm text-muted-foreground">Environment</span>
                      <span className="text-sm font-medium text-foreground">Production</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-muted-foreground">Uptime</span>
                      <span className="text-sm font-medium text-foreground">99.98%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 rounded-lg p-4 md:p-6">
                  <div className="flex items-start space-x-3 mb-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/20 flex-shrink-0">
                      <Icon name="Info" size={20} color="var(--color-primary)" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-heading font-semibold text-sm text-foreground mb-1">
                        Configuration Best Practices
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Always test configuration changes in a staging environment before applying to production. Enable audit logging to track all system modifications.
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    fullWidth
                    iconName="BookOpen"
                    iconPosition="left"
                  >
                    View Documentation
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ConfigurationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={getModalTitle()}
        description={getModalDescription()}
        configType={currentConfigType}
        currentConfig={currentConfig}
        onSave={handleSaveConfiguration}
      />
    </>
  );
};

export default SystemConfigurationPanel;