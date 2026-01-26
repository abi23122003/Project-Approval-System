import React from 'react';
import Icon from '../../../components/AppIcon';

const RecentActivities = ({ activities }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'project': return 'FileText';
      case 'review': return 'CheckCircle';
      case 'submission': return 'Upload';
      case 'approval': return 'ThumbsUp';
      case 'alert': return 'AlertCircle';
      default: return 'Activity';
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'project': return 'var(--color-primary)';
      case 'review': return 'var(--color-success)';
      case 'submission': return 'var(--color-accent)';
      case 'approval': return 'var(--color-brand-purple)';
      case 'alert': return 'var(--color-warning)';
      default: return 'var(--color-muted-foreground)';
    }
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = Math.floor((now - time) / 1000 / 60);

    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  };

  return (
    <div className="bg-card rounded-lg border border-border p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg md:text-xl font-heading font-semibold text-foreground">
          Recent Activities
        </h2>
        <button className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm text-primary hover:bg-primary/10 transition-colors duration-academic">
          <span>View All</span>
          <Icon name="ArrowRight" size={16} />
        </button>
      </div>
      <div className="space-y-4">
        {activities?.map((activity) => (
          <div 
            key={activity?.id}
            className="flex items-start space-x-4 p-3 rounded-lg hover:bg-muted/50 transition-colors duration-academic"
          >
            <div 
              className="flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0"
              style={{ backgroundColor: `${getActivityColor(activity?.type)}15` }}
            >
              <Icon 
                name={getActivityIcon(activity?.type)} 
                size={18} 
                color={getActivityColor(activity?.type)} 
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground mb-1">
                {activity?.description}
              </p>
              <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                <span>{activity?.user}</span>
                <span>•</span>
                <span>{formatTime(activity?.timestamp)}</span>
              </div>
            </div>
            {activity?.badge && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                activity?.badge === 'urgent' ? 'bg-error/10 text-error' :
                activity?.badge === 'new'? 'bg-accent/10 text-accent' : 'bg-muted text-muted-foreground'
              }`}>
                {activity?.badge}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentActivities;