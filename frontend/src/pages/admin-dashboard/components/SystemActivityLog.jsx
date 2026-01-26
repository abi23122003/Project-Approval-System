import React from 'react';
import Icon from '../../../components/AppIcon';

const SystemActivityLog = ({ activities }) => {
  const getActivityIcon = (type) => {
    const icons = {
      'user_created': 'UserPlus',
      'user_updated': 'UserCheck',
      'user_deleted': 'UserMinus',
      'role_changed': 'Shield',
      'login': 'LogIn',
      'logout': 'LogOut',
      'config_changed': 'Settings',
      'backup_created': 'Database',
      'system_update': 'RefreshCw',
      'security_alert': 'AlertTriangle'
    };
    return icons?.[type] || 'Activity';
  };

  const getActivityColor = (type) => {
    const colors = {
      'user_created': 'text-success',
      'user_updated': 'text-primary',
      'user_deleted': 'text-error',
      'role_changed': 'text-warning',
      'login': 'text-accent',
      'logout': 'text-muted-foreground',
      'config_changed': 'text-brand-purple',
      'backup_created': 'text-success',
      'system_update': 'text-primary',
      'security_alert': 'text-error'
    };
    return colors?.[type] || 'text-foreground';
  };

  const getActivityBgColor = (type) => {
    const colors = {
      'user_created': 'bg-success/10',
      'user_updated': 'bg-primary/10',
      'user_deleted': 'bg-error/10',
      'role_changed': 'bg-warning/10',
      'login': 'bg-accent/10',
      'logout': 'bg-muted',
      'config_changed': 'bg-brand-purple/10',
      'backup_created': 'bg-success/10',
      'system_update': 'bg-primary/10',
      'security_alert': 'bg-error/10'
    };
    return colors?.[type] || 'bg-muted';
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="p-4 md:p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-lg md:text-xl font-heading font-semibold text-foreground">System Activity Log</h3>
          <button className="flex items-center space-x-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors duration-academic">
            <Icon name="Download" size={16} />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>
      <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
        {activities?.map((activity) => (
          <div key={activity?.id} className="p-4 md:p-6 hover:bg-muted/30 transition-colors duration-academic">
            <div className="flex items-start space-x-4">
              <div className={`flex-shrink-0 w-10 h-10 rounded-lg ${getActivityBgColor(activity?.type)} flex items-center justify-center`}>
                <Icon name={getActivityIcon(activity?.type)} size={18} className={getActivityColor(activity?.type)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-1">
                  <p className="text-sm font-medium text-foreground">{activity?.action}</p>
                  <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">{activity?.timestamp}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{activity?.description}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                    <Icon name="User" size={12} className="mr-1" />
                    {activity?.performedBy}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                    <Icon name="MapPin" size={12} className="mr-1" />
                    {activity?.ipAddress}
                  </span>
                  {activity?.severity && (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      activity?.severity === 'high' ? 'bg-error/10 text-error' :
                      activity?.severity === 'medium'? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'
                    }`}>
                      {activity?.severity?.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {activities?.length === 0 && (
        <div className="p-8 md:p-12 text-center">
          <Icon name="Activity" size={48} className="mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No recent activity</p>
        </div>
      )}
    </div>
  );
};

export default SystemActivityLog;