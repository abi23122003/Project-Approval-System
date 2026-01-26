import React from 'react';
import Icon from '../../../components/AppIcon';

const StatCard = ({ title, value, change, changeType, icon, iconColor }) => {
  const getChangeColor = () => {
    if (changeType === 'positive') return 'text-success';
    if (changeType === 'negative') return 'text-error';
    return 'text-muted-foreground';
  };

  const getChangeIcon = () => {
    if (changeType === 'positive') return 'TrendingUp';
    if (changeType === 'negative') return 'TrendingDown';
    return 'Minus';
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 md:p-6 hover:shadow-subtle transition-all duration-academic">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <h3 className="text-2xl md:text-3xl font-heading font-bold text-foreground">
            {value}
          </h3>
        </div>
        <div className={`flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-lg ${iconColor}`}>
          <Icon name={icon} size={20} className="md:w-6 md:h-6" />
        </div>
      </div>
      
      {change && (
        <div className={`flex items-center gap-1.5 text-xs font-medium ${getChangeColor()}`}>
          <Icon name={getChangeIcon()} size={14} />
          <span>{change}</span>
          <span className="text-muted-foreground">vs last month</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;