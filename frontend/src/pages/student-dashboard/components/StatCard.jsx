import React from 'react';
import Icon from '../../../components/AppIcon';

const StatCard = ({ title, value, icon, trend, trendValue, color = 'primary' }) => {
  const getColorClasses = (colorName) => {
    const colors = {
      'primary': 'bg-primary/10 text-primary',
      'success': 'bg-success/10 text-success',
      'warning': 'bg-warning/10 text-warning',
      'error': 'bg-error/10 text-error',
      'accent': 'bg-accent/10 text-accent'
    };
    return colors?.[colorName] || colors?.['primary'];
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 md:p-6 shadow-elevation-sm hover:shadow-elevation-md transition-smooth">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs md:text-sm text-muted-foreground mb-1">
            {title}
          </p>
          <h3 className="text-xl md:text-2xl lg:text-3xl font-heading font-bold text-foreground">
            {value}
          </h3>
        </div>
        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center ${getColorClasses(color)}`}>
          <Icon name={icon} size={20} />
        </div>
      </div>

      {trend && trendValue && (
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
            trend === 'up' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
          }`}>
            <Icon name={trend === 'up' ? 'TrendingUp' : 'TrendingDown'} size={12} />
            <span>{trendValue}</span>
          </div>
          <span className="text-xs text-muted-foreground">vs last month</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;