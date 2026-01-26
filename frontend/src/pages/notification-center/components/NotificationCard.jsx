import React from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';

const NotificationCard = ({ notification, onMarkAsRead, onDelete }) => {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical':
        return 'bg-error/10 border-error text-error';
      case 'high':
        return 'bg-warning/10 border-warning text-warning';
      case 'medium':
        return 'bg-accent/10 border-accent text-accent';
      default:
        return 'bg-muted/50 border-border text-muted-foreground';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'submission':
        return 'FileText';
      case 'review':
        return 'ClipboardCheck';
      case 'feedback':
        return 'MessageSquare';
      case 'deadline':
        return 'Clock';
      case 'approval':
        return 'CheckCircle2';
      case 'system':
        return 'Settings';
      default:
        return 'Bell';
    }
  };

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const notifTime = new Date(timestamp);
    const diffMs = now - notifTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return notifTime?.toLocaleDateString();
  };

  return (
    <div
      className={`
        bg-card border rounded-lg p-4 md:p-5 lg:p-6
        transition-all duration-academic hover:shadow-subtle
        ${!notification?.isRead ? 'border-l-4 border-l-primary' : 'border-border'}
      `}
    >
      <div className="flex items-start gap-3 md:gap-4">
        <div className="flex-shrink-0">
          {notification?.senderAvatar ? (
            <Image
              src={notification?.senderAvatar}
              alt={notification?.senderAvatarAlt}
              className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Icon name={getTypeIcon(notification?.type)} size={20} color="var(--color-primary)" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="font-heading font-semibold text-sm md:text-base text-foreground">
                  {notification?.title}
                </h3>
                {!notification?.isRead && (
                  <span className="flex-shrink-0 w-2 h-2 rounded-full bg-primary animate-pulse-subtle" />
                )}
              </div>
              <p className="text-xs md:text-sm text-muted-foreground">
                {notification?.sender}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <span
                className={`
                  px-2 py-1 rounded text-xs font-medium border whitespace-nowrap
                  ${getPriorityColor(notification?.priority)}
                `}
              >
                {notification?.priority?.charAt(0)?.toUpperCase() + notification?.priority?.slice(1)}
              </span>
            </div>
          </div>

          <p className="text-sm md:text-base text-foreground mb-3 line-clamp-2">
            {notification?.message}
          </p>

          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4 text-xs md:text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Icon name="Clock" size={14} />
                {formatTimestamp(notification?.timestamp)}
              </span>
              <span className="flex items-center gap-1">
                <Icon name={getTypeIcon(notification?.type)} size={14} />
                {notification?.category}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {!notification?.isRead && (
                <button
                  onClick={() => onMarkAsRead(notification?.id)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium text-primary hover:bg-primary/10 transition-colors duration-academic"
                >
                  <Icon name="Check" size={14} />
                  Mark Read
                </button>
              )}
              <button
                onClick={() => onDelete(notification?.id)}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors duration-academic"
                aria-label="Delete notification"
              >
                <Icon name="Trash2" size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationCard;