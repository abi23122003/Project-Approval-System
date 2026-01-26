import React from 'react';
import Icon from '../../../components/AppIcon';

const ActivityFeedItem = ({ activity }) => {
  const getActivityIcon = (type) => {
    const icons = {
      'comment': 'MessageSquare',
      'approval': 'CheckCircle',
      'revision': 'AlertCircle',
      'submission': 'Upload',
      'meeting': 'Calendar',
      'document': 'FileText'
    };
    return icons?.[type] || 'Bell';
  };

  const getActivityColor = (type) => {
    const colors = {
      'comment': 'bg-primary/10 text-primary',
      'approval': 'bg-success/10 text-success',
      'revision': 'bg-warning/10 text-warning',
      'submission': 'bg-accent/10 text-accent',
      'meeting': 'bg-secondary/10 text-secondary',
      'document': 'bg-muted text-muted-foreground'
    };
    return colors?.[type] || colors?.['document'];
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffMs = now - activityTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="flex gap-3 p-3 hover:bg-muted rounded-lg transition-smooth">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getActivityColor(activity?.type)}`}>
        <Icon name={getActivityIcon(activity?.type)} size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs md:text-sm text-foreground mb-1 line-clamp-2">
          {activity?.message}
        </p>
        <span className="text-xs text-muted-foreground">
          {getTimeAgo(activity?.timestamp)}
        </span>
      </div>
    </div>
  );
};

export default ActivityFeedItem;