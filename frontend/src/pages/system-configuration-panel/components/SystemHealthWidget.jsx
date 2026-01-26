import React from 'react';
import Icon from '../../../components/AppIcon';

const SystemHealthWidget = ({ metrics }) => {
  const getHealthColor = (status) => {
    switch (status) {
      case 'healthy':
        return 'text-success';
      case 'warning':
        return 'text-warning';
      case 'critical':
        return 'text-error';
      default:
        return 'text-muted-foreground';
    }
  };

  const getHealthIcon = (status) => {
    switch (status) {
      case 'healthy':
        return 'CheckCircle2';
      case 'warning':
        return 'AlertTriangle';
      case 'critical':
        return 'XCircle';
      default:
        return 'HelpCircle';
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-heading font-semibold text-base md:text-lg text-foreground">
          System Health
        </h3>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse-subtle" />
          <span className="text-xs md:text-sm text-muted-foreground">Live</span>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {metrics?.map((metric) => (
          <div key={metric?.id} className="flex items-start space-x-3 p-3 rounded-lg bg-muted/30">
            <div className={`flex items-center justify-center w-10 h-10 rounded-lg bg-background flex-shrink-0 ${getHealthColor(metric?.status)}`}>
              <Icon name={getHealthIcon(metric?.status)} size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-foreground">{metric?.name}</span>
                <span className="text-xs font-medium text-muted-foreground whitespace-nowrap ml-2">
                  {metric?.value}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 mb-1">
                <div 
                  className={`h-1.5 rounded-full transition-all duration-academic ${
                    metric?.status === 'healthy' ? 'bg-success' :
                    metric?.status === 'warning' ? 'bg-warning' : 'bg-error'
                  }`}
                  style={{ width: `${metric?.percentage}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">{metric?.description}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SystemHealthWidget;