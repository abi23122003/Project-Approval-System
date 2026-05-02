import React, { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Sidebar from '../../components/ui/Sidebar';
import NotificationCard from './components/NotificationCard';
import FilterPanel from './components/FilterPanel';
import NotificationSettings from './components/NotificationSettings';
import QuickActions from './components/QuickActions';
import { fetchAuditEvents, isDemoSession, getRole } from '../../utils/api';

const DEMO_NOTIFICATIONS = [
  { id: 1, title: 'Project Submission Approved', message: 'Your project has been reviewed and approved. You can now proceed to the next phase of development.', sender: 'Review System', senderAvatar: null, senderAvatarAlt: '', type: 'approval', category: 'Project Management', priority: 'high', timestamp: new Date(Date.now() - 3600000), isRead: false },
  { id: 2, title: 'Review Request Assigned', message: 'You have been assigned to review a project. Please check your review queue.', sender: 'System Administrator', senderAvatar: null, senderAvatarAlt: '', type: 'review', category: 'Academic Review', priority: 'critical', timestamp: new Date(Date.now() - 7200000), isRead: false },
  { id: 3, title: 'Feedback Available', message: 'Your faculty guide has provided detailed feedback on your project proposal. Please review the comments.', sender: 'Faculty Guide', senderAvatar: null, senderAvatarAlt: '', type: 'feedback', category: 'Feedback', priority: 'medium', timestamp: new Date(Date.now() - 10800000), isRead: false },
  { id: 4, title: 'Upcoming Deadline Reminder', message: 'Reminder: Your project final submission deadline is approaching. Please ensure all required documents are uploaded.', sender: 'AcademicProjectHub System', senderAvatar: null, senderAvatarAlt: '', type: 'deadline', category: 'Deadline Alert', priority: 'high', timestamp: new Date(Date.now() - 86400000), isRead: true },
  { id: 5, title: 'System Maintenance Scheduled', message: 'AcademicProjectHub will undergo scheduled maintenance. The system will be temporarily unavailable.', sender: 'IT Department', senderAvatar: null, senderAvatarAlt: '', type: 'system', category: 'System Update', priority: 'low', timestamp: new Date(Date.now() - 172800000), isRead: true },
];

const eventTypeToNotif = (e, idx) => {
  const typeMap = { LOGIN: 'system', LOGOUT: 'system', CREATE: 'submission', UPDATE: 'feedback', DELETE: 'deadline', APPROVE: 'approval', REJECT: 'deadline' };
  const type = typeMap[e.event_type?.split('_')[0]] || 'system';
  const priorityMap = { APPROVE: 'high', REJECT: 'high', DELETE: 'critical', LOGIN: 'low', LOGOUT: 'low' };
  const priority = priorityMap[e.event_type?.split('_')[0]] || 'medium';
  return {
    id: e.id || idx,
    title: `${e.event_type?.replace(/_/g, ' ')} — ${e.entity_type || 'System Event'}`,
    message: e.details_json ? JSON.stringify(e.details_json).slice(0, 120).replace(/[{}"]/, '') : `Entity #${e.entity_id || ''}`,
    sender: e.actor ? `User #${e.actor}` : 'System',
    senderAvatar: null, senderAvatarAlt: '',
    type, category: type === 'approval' ? 'Project Management' : type === 'system' ? 'System Update' : 'Academic Review',
    priority,
    timestamp: new Date(e.event_time),
    isRead: true,
  };
};

const NotificationCenter = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    showUnreadOnly: false,
    priority: 'all',
    type: 'all',
    category: 'all',
    timeRange: 'all'
  });

  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const isDemo = isDemoSession();
    if (isDemo) {
      setNotifications(DEMO_NOTIFICATIONS);
      setLoading(false);
      return;
    }
    fetchAuditEvents()
      .then(events => {
        if (events && events.length > 0) {
          setNotifications(events.map((e, i) => eventTypeToNotif(e, i)));
        } else {
          setNotifications(DEMO_NOTIFICATIONS);
        }
      })
      .catch(() => setNotifications(DEMO_NOTIFICATIONS))
      .finally(() => setLoading(false));
  }, []);

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