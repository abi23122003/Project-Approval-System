import React, { useState } from 'react';
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

const AdminDashboard = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const statsData = [
  {
    title: 'Total Users',
    value: '2,847',
    change: '+12.5%',
    changeType: 'positive',
    icon: 'Users',
    iconColor: 'bg-primary/10',
    trend: 'up'
  },
  {
    title: 'Active Sessions',
    value: '1,234',
    change: '+8.2%',
    changeType: 'positive',
    icon: 'Activity',
    iconColor: 'bg-success/10',
    trend: 'up'
  },
  {
    title: 'System Uptime',
    value: '99.8%',
    change: '+0.3%',
    changeType: 'positive',
    icon: 'Server',
    iconColor: 'bg-accent/10',
    trend: 'up'
  },
  {
    title: 'Pending Actions',
    value: '47',
    change: '-15.3%',
    changeType: 'positive',
    icon: 'AlertCircle',
    iconColor: 'bg-warning/10',
    trend: 'down'
  }];


  const usersData = [
  {
    id: 1,
    name: 'Sarah Johnson',
    email: 'sarah.johnson@university.edu',
    userId: 'STU2024001',
    role: 'Student',
    status: 'Active',
    lastActive: '2 hours ago',
    avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_14fee5e48-1763295271225.png",
    avatarAlt: 'Professional headshot of young woman with long brown hair wearing navy blazer smiling at camera'
  },
  {
    id: 2,
    name: 'Dr. Michael Chen',
    email: 'michael.chen@university.edu',
    userId: 'GDE2024015',
    role: 'Guide',
    status: 'Active',
    lastActive: '30 minutes ago',
    avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1ffeb43ad-1763298672388.png",
    avatarAlt: 'Professional headshot of Asian man with short black hair wearing white shirt and glasses'
  },
  {
    id: 3,
    name: 'Prof. Emily Rodriguez',
    email: 'emily.rodriguez@university.edu',
    userId: 'REV2024008',
    role: 'Reviewer',
    status: 'Active',
    lastActive: '1 hour ago',
    avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1a36548bd-1763296665300.png",
    avatarAlt: 'Professional headshot of Hispanic woman with curly dark hair wearing burgundy blouse'
  },
  {
    id: 4,
    name: 'Dr. James Wilson',
    email: 'james.wilson@university.edu',
    userId: 'HOD2024003',
    role: 'HOD',
    status: 'Active',
    lastActive: '15 minutes ago',
    avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_130504d21-1763295915180.png",
    avatarAlt: 'Professional headshot of middle-aged man with gray hair wearing dark suit and tie'
  },
  {
    id: 5,
    name: 'Lisa Anderson',
    email: 'lisa.anderson@university.edu',
    userId: 'ADM2024001',
    role: 'Admin',
    status: 'Active',
    lastActive: 'Just now',
    avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1f4c07e6c-1763297701460.png",
    avatarAlt: 'Professional headshot of woman with blonde hair in bun wearing white blouse'
  },
  {
    id: 6,
    name: 'David Martinez',
    email: 'david.martinez@university.edu',
    userId: 'STU2024089',
    role: 'Student',
    status: 'Inactive',
    lastActive: '3 days ago',
    avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_19ae43960-1763296244601.png",
    avatarAlt: 'Professional headshot of young Hispanic man with short dark hair wearing casual blue shirt'
  },
  {
    id: 7,
    name: 'Dr. Rachel Kim',
    email: 'rachel.kim@university.edu',
    userId: 'GDE2024022',
    role: 'Guide',
    status: 'Suspended',
    lastActive: '1 week ago',
    avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1a1de5981-1763296334381.png",
    avatarAlt: 'Professional headshot of Asian woman with long black hair wearing red blazer'
  },
  {
    id: 8,
    name: 'Thomas Brown',
    email: 'thomas.brown@university.edu',
    userId: 'STU2024156',
    role: 'Student',
    status: 'Pending',
    lastActive: 'Never',
    avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1e01acda8-1763296453008.png",
    avatarAlt: 'Professional headshot of young man with beard wearing gray sweater outdoors'
  }];


  const activitiesData = [
  {
    id: 1,
    type: 'user_created',
    action: 'New User Account Created',
    description: 'Student account STU2024234 created successfully',
    performedBy: 'Admin Lisa Anderson',
    ipAddress: '192.168.1.45',
    timestamp: '5 minutes ago',
    severity: 'low'
  },
  {
    id: 2,
    type: 'role_changed',
    action: 'User Role Modified',
    description: 'User role changed from Student to Guide for user GDE2024025',
    performedBy: 'Admin Lisa Anderson',
    ipAddress: '192.168.1.45',
    timestamp: '15 minutes ago',
    severity: 'medium'
  },
  {
    id: 3,
    type: 'security_alert',
    action: 'Multiple Failed Login Attempts',
    description: 'User STU2024089 exceeded maximum login attempts',
    performedBy: 'System',
    ipAddress: '203.45.67.89',
    timestamp: '1 hour ago',
    severity: 'high'
  },
  {
    id: 4,
    type: 'backup_created',
    action: 'System Backup Completed',
    description: 'Automated daily backup completed successfully (2.4 GB)',
    performedBy: 'System',
    ipAddress: 'Internal',
    timestamp: '2 hours ago',
    severity: 'low'
  },
  {
    id: 5,
    type: 'config_changed',
    action: 'System Configuration Updated',
    description: 'Email notification settings modified',
    performedBy: 'Admin Lisa Anderson',
    ipAddress: '192.168.1.45',
    timestamp: '3 hours ago',
    severity: 'medium'
  },
  {
    id: 6,
    type: 'user_deleted',
    action: 'User Account Deleted',
    description: 'Inactive student account STU2023567 permanently removed',
    performedBy: 'Admin Lisa Anderson',
    ipAddress: '192.168.1.45',
    timestamp: '4 hours ago',
    severity: 'medium'
  }];


  const systemHealthData = [
  {
    id: 1,
    name: 'Database Performance',
    category: 'Infrastructure',
    icon: 'Database',
    status: 'healthy',
    currentValue: '45ms',
    percentage: 85,
    threshold: '< 100ms',
    lastChecked: '2 minutes ago'
  },
  {
    id: 2,
    name: 'API Response Time',
    category: 'Performance',
    icon: 'Zap',
    status: 'healthy',
    currentValue: '120ms',
    percentage: 92,
    threshold: '< 200ms',
    lastChecked: '1 minute ago'
  },
  {
    id: 3,
    name: 'Storage Usage',
    category: 'Resources',
    icon: 'HardDrive',
    status: 'warning',
    currentValue: '78%',
    percentage: 78,
    threshold: '< 80%',
    lastChecked: '5 minutes ago'
  },
  {
    id: 4,
    name: 'Memory Usage',
    category: 'Resources',
    icon: 'Cpu',
    status: 'healthy',
    currentValue: '62%',
    percentage: 62,
    threshold: '< 85%',
    lastChecked: '1 minute ago'
  },
  {
    id: 5,
    name: 'Network Latency',
    category: 'Network',
    icon: 'Wifi',
    status: 'healthy',
    currentValue: '12ms',
    percentage: 95,
    threshold: '< 50ms',
    lastChecked: '30 seconds ago'
  },
  {
    id: 6,
    name: 'Error Rate',
    category: 'Reliability',
    icon: 'AlertTriangle',
    status: 'critical',
    currentValue: '2.3%',
    percentage: 23,
    threshold: '< 1%',
    lastChecked: 'Just now'
  }];


  const roleDistributionData = [
  { name: 'Student', value: 1847 },
  { name: 'Guide', value: 456 },
  { name: 'Reviewer', value: 234 },
  { name: 'HOD', value: 89 },
  { name: 'Admin', value: 221 }];


  const backupsData = [
  {
    id: 1,
    name: 'Daily Automated Backup',
    status: 'completed',
    createdAt: 'Jan 26, 2026 02:00 AM',
    size: 2567890123,
    createdBy: 'System',
    description: 'Automated daily backup including all user data and system configurations'
  },
  {
    id: 2,
    name: 'Pre-Update Backup',
    status: 'completed',
    createdAt: 'Jan 25, 2026 11:30 PM',
    size: 2456789012,
    createdBy: 'Admin Lisa Anderson',
    description: 'Manual backup before system update deployment'
  },
  {
    id: 3,
    name: 'Weekly Full Backup',
    status: 'completed',
    createdAt: 'Jan 22, 2026 03:00 AM',
    size: 2678901234,
    createdBy: 'System',
    description: 'Weekly comprehensive backup of entire system'
  },
  {
    id: 4,
    name: 'Emergency Backup',
    status: 'failed',
    createdAt: 'Jan 20, 2026 04:15 PM',
    size: 0,
    createdBy: 'Admin Lisa Anderson',
    description: 'Emergency backup attempt - failed due to insufficient storage'
  }];


  const quickActions = [
  {
    title: 'User Management',
    description: 'Manage user accounts and permissions',
    actions: [
    { label: 'Create New User', icon: 'UserPlus', variant: 'default', onClick: () => console.log('Create user') },
    { label: 'Bulk Import Users', icon: 'Upload', variant: 'outline', onClick: () => console.log('Bulk import') },
    { label: 'Export User List', icon: 'Download', variant: 'outline', onClick: () => console.log('Export users') }]

  },
  {
    title: 'System Operations',
    description: 'Perform critical system operations',
    actions: [
    { label: 'Create Backup', icon: 'Database', variant: 'default', onClick: () => console.log('Create backup') },
    { label: 'Clear Cache', icon: 'RefreshCw', variant: 'outline', onClick: () => console.log('Clear cache') },
    { label: 'View Logs', icon: 'FileText', variant: 'outline', onClick: () => console.log('View logs') }]

  }];


  const handleEditUser = (user) => {
    console.log('Edit user:', user);
  };

  const handleDeleteUser = (user) => {
    console.log('Delete user:', user);
  };

  const handleViewDetails = (user) => {
    console.log('View details:', user);
  };

  const handleCreateBackup = () => {
    console.log('Create backup');
  };

  const handleRestoreBackup = (backup) => {
    console.log('Restore backup:', backup);
  };

  const handleDeleteBackup = (backup) => {
    console.log('Delete backup:', backup);
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar isCollapsed={isSidebarCollapsed} onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
      <Header />
      <main className={`transition-all duration-academic ease-academic pt-16 ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        <div className="max-w-[1920px] mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-foreground mb-2">
              Admin Dashboard
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Comprehensive system administration and user management control center
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
            {statsData?.map((stat, index) =>
            <StatCard key={index} {...stat} />
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
            <div className="lg:col-span-2">
              <UserManagementTable
                users={usersData}
                onEditUser={handleEditUser}
                onDeleteUser={handleDeleteUser}
                onViewDetails={handleViewDetails} />

            </div>
            <div className="space-y-4 md:space-y-6">
              {quickActions?.map((action, index) =>
              <QuickActionCard key={index} {...action} />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
            <SystemActivityLog activities={activitiesData} />
            <RoleDistributionChart data={roleDistributionData} />
          </div>

          <div className="mb-6 md:mb-8">
            <SystemHealthMonitor metrics={systemHealthData} />
          </div>

          <div className="mb-6 md:mb-8">
            <BackupManagementPanel
              backups={backupsData}
              onCreateBackup={handleCreateBackup}
              onRestoreBackup={handleRestoreBackup}
              onDeleteBackup={handleDeleteBackup} />

          </div>
        </div>
      </main>
      <Footer />
    </div>);

};

export default AdminDashboard;