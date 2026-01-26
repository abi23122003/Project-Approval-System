import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Sidebar from '../../components/ui/Sidebar';
import NotificationCard from './components/NotificationCard';
import FilterPanel from './components/FilterPanel';
import NotificationSettings from './components/NotificationSettings';
import QuickActions from './components/QuickActions';

const NotificationCenter = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [filters, setFilters] = useState({
    showUnreadOnly: false,
    priority: 'all',
    type: 'all',
    category: 'all',
    timeRange: 'all'
  });

  const [notifications, setNotifications] = useState([
  {
    id: 1,
    title: 'Project Submission Approved',
    message: 'Your project "Machine Learning in Healthcare" has been approved by Dr. Sarah Johnson. You can now proceed to the next phase of development.',
    sender: 'Dr. Sarah Johnson',
    senderAvatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1b43e8b7f-1763295504724.png",
    senderAvatarAlt: 'Professional headshot of woman with shoulder-length brown hair wearing navy blazer and white blouse',
    type: 'approval',
    category: 'Project Management',
    priority: 'high',
    timestamp: new Date('2026-01-26T10:15:00'),
    isRead: false
  },
  {
    id: 2,
    title: 'Review Request Assigned',
    message: 'You have been assigned to review the project "Blockchain Applications in Supply Chain" submitted by John Martinez. Review deadline: January 30, 2026.',
    sender: 'System Administrator',
    senderAvatar: null,
    senderAvatarAlt: '',
    type: 'review',
    category: 'Academic Review',
    priority: 'critical',
    timestamp: new Date('2026-01-26T09:30:00'),
    isRead: false
  },
  {
    id: 3,
    title: 'Feedback Available',
    message: 'Dr. Michael Chen has provided detailed feedback on your project proposal. Please review the comments and make necessary revisions.',
    sender: 'Dr. Michael Chen',
    senderAvatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1bb8988be-1763295050652.png",
    senderAvatarAlt: 'Professional headshot of Asian man with short black hair wearing gray suit and blue tie',
    type: 'feedback',
    category: 'Feedback',
    priority: 'medium',
    timestamp: new Date('2026-01-26T08:45:00'),
    isRead: false
  },
  {
    id: 4,
    title: 'Upcoming Deadline Reminder',
    message: 'Reminder: Your project final submission is due in 3 days (January 29, 2026). Please ensure all required documents are uploaded.',
    sender: 'AcademicFlow System',
    senderAvatar: null,
    senderAvatarAlt: '',
    type: 'deadline',
    category: 'Deadline Alert',
    priority: 'high',
    timestamp: new Date('2026-01-26T07:00:00'),
    isRead: true
  },
  {
    id: 5,
    title: 'New Project Submission',
    message: 'Emily Rodriguez has submitted a new project "AI-Powered Educational Platform" for your review. The project includes comprehensive documentation and prototype demonstrations.',
    sender: 'Emily Rodriguez',
    senderAvatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1631c1677-1763295642190.png",
    senderAvatarAlt: 'Professional headshot of Hispanic woman with long dark hair wearing burgundy blouse',
    type: 'submission',
    category: 'Project Management',
    priority: 'medium',
    timestamp: new Date('2026-01-25T16:20:00'),
    isRead: true
  },
  {
    id: 6,
    title: 'System Maintenance Scheduled',
    message: 'AcademicFlow will undergo scheduled maintenance on January 28, 2026, from 2:00 AM to 4:00 AM EST. The system will be temporarily unavailable during this period.',
    sender: 'IT Department',
    senderAvatar: null,
    senderAvatarAlt: '',
    type: 'system',
    category: 'System Update',
    priority: 'low',
    timestamp: new Date('2026-01-25T14:00:00'),
    isRead: true
  },
  {
    id: 7,
    title: 'Review Completed',
    message: 'Your review for the project "Sustainable Energy Solutions" has been successfully submitted. The student will be notified of your feedback.',
    sender: 'AcademicFlow System',
    senderAvatar: null,
    senderAvatarAlt: '',
    type: 'review',
    category: 'Academic Review',
    priority: 'low',
    timestamp: new Date('2026-01-25T11:30:00'),
    isRead: true
  },
  {
    id: 8,
    title: 'Critical: Evaluation Overdue',
    message: 'The evaluation for project "Data Analytics Dashboard" is now 2 days overdue. Please complete the assessment as soon as possible to avoid delays in the academic process.',
    sender: 'Department Head',
    senderAvatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1c5942421-1763295562537.png",
    senderAvatarAlt: 'Professional headshot of senior man with gray hair and beard wearing dark suit',
    type: 'deadline',
    category: 'Deadline Alert',
    priority: 'critical',
    timestamp: new Date('2026-01-25T09:00:00'),
    isRead: false
  },
  {
    id: 9,
    title: 'Project Milestone Achieved',
    message: 'Congratulations! Your project "IoT Smart Home System" has successfully completed Phase 2 evaluation with excellent scores. Proceed to Phase 3 implementation.',
    sender: 'Dr. Amanda Williams',
    senderAvatar: "https://img.rocket.new/generatedImages/rocket_gen_img_16e75c406-1763294340369.png",
    senderAvatarAlt: 'Professional headshot of woman with blonde hair in bun wearing teal blazer',
    type: 'approval',
    category: 'Project Management',
    priority: 'medium',
    timestamp: new Date('2026-01-24T15:45:00'),
    isRead: true
  },
  {
    id: 10,
    title: 'Feedback Request',
    message: 'Student David Thompson has requested additional clarification on your previous feedback regarding the methodology section of his project proposal.',
    sender: 'David Thompson',
    senderAvatar: "https://img.rocket.new/generatedImages/rocket_gen_img_17f90d383-1763293392637.png",
    senderAvatarAlt: 'Professional headshot of young man with short brown hair wearing blue shirt',
    type: 'feedback',
    category: 'Feedback',
    priority: 'medium',
    timestamp: new Date('2026-01-24T13:20:00'),
    isRead: true
  }]
  );

  const handleMarkAsRead = (id) => {
    setNotifications(notifications?.map((notif) =>
    notif?.id === id ? { ...notif, isRead: true } : notif
    ));
  };

  const handleDelete = (id) => {
    setNotifications(notifications?.filter((notif) => notif?.id !== id));
  };

  const handleMarkAllRead = () => {
    setNotifications(notifications?.map((notif) => ({ ...notif, isRead: true })));
  };

  const handleDeleteAll = () => {
    if (window.confirm('Are you sure you want to delete all notifications? This action cannot be undone.')) {
      setNotifications([]);
    }
  };

  const handleFilterChange = (key, value) => {
    if (key === 'reset') {
      setFilters({
        showUnreadOnly: false,
        priority: 'all',
        type: 'all',
        category: 'all',
        timeRange: 'all'
      });
    } else {
      setFilters({ ...filters, [key]: value });
    }
  };

  const filteredNotifications = useMemo(() => {
    let filtered = [...notifications];

    if (searchQuery) {
      filtered = filtered?.filter((notif) =>
      notif?.title?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
      notif?.message?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
      notif?.sender?.toLowerCase()?.includes(searchQuery?.toLowerCase())
      );
    }

    if (filters?.showUnreadOnly) {
      filtered = filtered?.filter((notif) => !notif?.isRead);
    }

    if (filters?.priority !== 'all') {
      filtered = filtered?.filter((notif) => notif?.priority === filters?.priority);
    }

    if (filters?.type !== 'all') {
      filtered = filtered?.filter((notif) => notif?.type === filters?.type);
    }

    if (filters?.category !== 'all') {
      filtered = filtered?.filter((notif) => notif?.category === filters?.category);
    }

    if (filters?.timeRange !== 'all') {
      const now = new Date();
      filtered = filtered?.filter((notif) => {
        const notifDate = new Date(notif.timestamp);
        const diffDays = Math.floor((now - notifDate) / 86400000);

        switch (filters?.timeRange) {
          case 'today':
            return diffDays === 0;
          case 'week':
            return diffDays <= 7;
          case 'month':
            return diffDays <= 30;
          default:
            return true;
        }
      });
    }

    return filtered?.sort((a, b) => b?.timestamp - a?.timestamp);
  }, [notifications, searchQuery, filters]);

  const notificationStats = useMemo(() => ({
    total: notifications?.length,
    unread: notifications?.filter((n) => !n?.isRead)?.length,
    critical: notifications?.filter((n) => n?.priority === 'critical')?.length
  }), [notifications]);

  return (
    <>
      <Helmet>
        <title>Notification Center - AcademicFlow</title>
        <meta name="description" content="Centralized communication hub with smart filtering and priority management for all academic notifications" />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />


        <main className={`
          transition-all duration-academic ease-academic
          ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}
        `}>
          <div className="p-4 md:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              <div className="mb-6 md:mb-8">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h1 className="font-heading font-bold text-2xl md:text-3xl lg:text-4xl text-foreground mb-2">
                      Notification Center
                    </h1>
                    <p className="text-sm md:text-base text-muted-foreground">
                      Stay updated with all your academic communications and alerts
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    iconName="Settings"
                    onClick={() => setIsSettingsOpen(true)}>

                    Settings
                  </Button>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg">
                    <Icon name="Bell" size={18} color="var(--color-primary)" />
                    <span className="text-sm font-medium text-primary">
                      {notificationStats?.unread} Unread
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-error/10 rounded-lg">
                    <Icon name="AlertCircle" size={18} color="var(--color-error)" />
                    <span className="text-sm font-medium text-error">
                      {notificationStats?.critical} Critical
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
                    <Icon name="Archive" size={18} />
                    <span className="text-sm font-medium text-foreground">
                      {notificationStats?.total} Total
                    </span>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <Input
                  type="search"
                  placeholder="Search notifications by title, message, or sender..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e?.target?.value)}
                  className="max-w-2xl" />

              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
                <div className="lg:col-span-3 space-y-4">
                  {filteredNotifications?.length === 0 ?
                  <div className="bg-card border border-border rounded-lg p-8 md:p-12 text-center">
                      <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-muted flex items-center justify-center">
                          <Icon name="Inbox" size={32} className="text-muted-foreground" />
                        </div>
                      </div>
                      <h3 className="font-heading font-semibold text-lg md:text-xl text-foreground mb-2">
                        No Notifications Found
                      </h3>
                      <p className="text-sm md:text-base text-muted-foreground max-w-md mx-auto">
                        {searchQuery || filters?.showUnreadOnly || filters?.priority !== 'all' || filters?.type !== 'all' ? 'Try adjusting your filters or search query to see more results.' : 'You\'re all caught up! No new notifications at this time.'}
                      </p>
                    </div> :

                  filteredNotifications?.map((notification) =>
                  <NotificationCard
                    key={notification?.id}
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                    onDelete={handleDelete} />

                  )
                  }
                </div>

                <div className="space-y-6">
                  <FilterPanel
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    notificationStats={notificationStats} />

                  <QuickActions
                    onMarkAllRead={handleMarkAllRead}
                    onDeleteAll={handleDeleteAll}
                    unreadCount={notificationStats?.unread} />

                </div>
              </div>
            </div>
          </div>
        </main>

        <NotificationSettings
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)} />

      </div>
    </>);

};

export default NotificationCenter;