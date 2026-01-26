import React from 'react';
import Icon from '../../../components/AppIcon';

const SecurityIndicator = ({ type, label, status }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'active':
        return 'text-success';
      case 'warning':
        return 'text-warning';
      case 'error':
        return 'text-error';
      default:
        return 'text-muted-foreground';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'ldap':
        return 'Database';
      case 'sis':
        return 'Server';
      case 'session':
        return 'Clock';
      default:
        return 'Shield';
    }
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg">
      <Icon name={getIcon()} size={16} color={`var(--color-${status === 'active' ? 'success' : 'muted-foreground'})`} />
      <span className="text-xs md:text-sm text-foreground">{label}</span>
      <div className={`w-2 h-2 rounded-full ${getStatusColor()} ml-auto`} />
    </div>
  );
};

export default SecurityIndicator;