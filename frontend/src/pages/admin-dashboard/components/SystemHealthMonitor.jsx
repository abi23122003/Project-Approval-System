import React from 'react';
import Icon from '../../../components/AppIcon';

const SystemHealthMonitor = ({ metrics }) => {
  const getHealthColor = (status) => {
    const colors = {
      'healthy': 'text-success',
      'warning': 'text-warning',
      'critical': 'text-error',
      'unknown': 'text-muted-foreground'
    };
    return colors?.[status] || 'text-muted-foreground';
  };

  const getHealthBgColor = (status) => {
    const colors = {
      'healthy': 'bg-success/10',
      'warning': 'bg-warning/10',
      'critical': 'bg-error/10',
      'unknown': 'bg-muted'
    };
    return colors?.[status] || 'bg-muted';
  };

  const getHealthIcon = (status) => {
    const icons = {
      'healthy': 'CheckCircle',
      'warning': 'AlertTriangle',
      'critical': 'XCircle',
      'unknown': 'HelpCircle'
    };
    return icons?.[status] || 'HelpCircle';
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="p-4 md:p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-lg md:text-xl font-heading font-semibold text-foreground">System Health Monitor</h3>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse-subtle"></div>
            <span className="text-xs text-muted-foreground">Live</span>
          </div>
        </div>
      </div>
      <div className="p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {metrics?.map((metric) => (
            <div key={metric?.id} className="border border-border rounded-lg p-4 hover:shadow-subtle transition-all duration-academic">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg ${getHealthBgColor(metric?.status)} flex items-center justify-center`}>
                    <Icon name={metric?.icon} size={18} className={getHealthColor(metric?.status)} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{metric?.name}</p>
                    <p className="text-xs text-muted-foreground">{metric?.category}</p>
                  </div>
                </div>
                <Icon name={getHealthIcon(metric?.status)} size={20} className={getHealthColor(metric?.status)} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Current Value</span>
                  <span className="text-sm font-medium text-foreground">{metric?.currentValue}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-academic ${
                      metric?.status === 'healthy' ? 'bg-success' :
                      metric?.status === 'warning' ? 'bg-warning' :
                      metric?.status === 'critical'? 'bg-error' : 'bg-muted-foreground'
                    }`}
                    style={{ width: `${metric?.percentage}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Threshold</span>
                  <span className="text-xs text-muted-foreground">{metric?.threshold}</span>
                </div>
              </div>

              {metric?.lastChecked && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    Last checked: {metric?.lastChecked}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SystemHealthMonitor;