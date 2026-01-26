import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ConfigurationCard = ({ 
  title, 
  description, 
  icon, 
  iconColor = "var(--color-primary)",
  status,
  lastModified,
  onConfigure,
  children 
}) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'text-success bg-success/10';
      case 'warning':
        return 'text-warning bg-warning/10';
      case 'inactive':
        return 'text-muted-foreground bg-muted';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'warning':
        return 'Needs Attention';
      case 'inactive':
        return 'Inactive';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 md:p-6 hover:shadow-subtle transition-all duration-academic">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-3 md:space-x-4">
          <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-lg bg-primary/10 flex-shrink-0">
            <Icon name={icon} size={20} color={iconColor} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-heading font-semibold text-base md:text-lg text-foreground mb-1">
              {title}
            </h3>
            <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">
              {description}
            </p>
          </div>
        </div>
        {status && (
          <span className={`px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap ${getStatusColor(status)}`}>
            {getStatusText(status)}
          </span>
        )}
      </div>

      {children && (
        <div className="mb-4">
          {children}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4 border-t border-border">
        {lastModified && (
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <Icon name="Clock" size={14} />
            <span>Modified: {lastModified}</span>
          </div>
        )}
        <Button 
          variant="outline" 
          size="sm"
          iconName="Settings"
          iconPosition="left"
          onClick={onConfigure}
          className="w-full sm:w-auto"
        >
          Configure
        </Button>
      </div>
    </div>
  );
};

export default ConfigurationCard;