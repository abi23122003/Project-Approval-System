import React from 'react';
import Icon from '../../../components/AppIcon';

const StatCard = ({ title, value, change, changeType, icon, iconColor, trend }) => {
  const getChangeColor = () => {
    if (changeType === 'positive') return 'text-success';
    if (changeType === 'negative') return 'text-error';
    return 'text-muted-foreground';
  };

  const getTrendIcon = () => {
    if (trend === 'up') return 'TrendingUp';
    if (trend === 'down') return 'TrendingDown';
    return 'Minus';
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 md:p-6 hover:shadow-subtle transition-all duration-academic">
      <div className="flex items-start justify-between mb-4">
        <div className={`flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-lg ${iconColor}`}>
          <Icon name={icon} size={20} className="md:w-6 md:h-6" />
        </div>
        {change && (
          <div className={`flex items-center space-x-1 ${getChangeColor()}`}>
            <Icon name={getTrendIcon()} size={16} />
            <span className="text-xs md:text-sm font-medium">{change}</span>
          </div>
        )}
      </div>
      <div>
        <p className="text-xs md:text-sm text-muted-foreground mb-1">{title}</p>
        <p className="text-2xl md:text-3xl font-heading font-bold text-foreground">{value}</p>
      </div>
    </div>
  );
};

export default StatCard;