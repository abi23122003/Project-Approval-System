import React from 'react';
import Icon from '../../../components/AppIcon';

const MetricCard = ({ 
  title, 
  value, 
  change, 
  changeType, 
  icon, 
  iconColor, 
  trend,
  description 
}) => {
  const isPositive = changeType === 'positive';
  const isNegative = changeType === 'negative';
  const isNeutral = changeType === 'neutral';

  return (
    <div className="bg-card rounded-lg border border-border p-4 md:p-6 hover:shadow-subtle transition-all duration-academic">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <h3 className="text-2xl md:text-3xl font-heading font-bold text-foreground">
            {value}
          </h3>
        </div>
        <div 
          className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-lg"
          style={{ backgroundColor: `${iconColor}15` }}
        >
          <Icon name={icon} size={20} color={iconColor} />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {change && (
            <>
              <Icon 
                name={isPositive ? 'TrendingUp' : isNegative ? 'TrendingDown' : 'Minus'} 
                size={16} 
                color={isPositive ? 'var(--color-success)' : isNegative ? 'var(--color-error)' : 'var(--color-muted-foreground)'}
              />
              <span 
                className={`text-sm font-medium ${
                  isPositive ? 'text-success' : isNegative ? 'text-error' : 'text-muted-foreground'
                }`}
              >
                {change}
              </span>
            </>
          )}
          {description && (
            <span className="text-xs text-muted-foreground">{description}</span>
          )}
        </div>
        {trend && (
          <div className="flex items-center space-x-1">
            {trend?.map((point, index) => (
              <div 
                key={index}
                className="w-1 bg-muted rounded-full transition-all duration-academic"
                style={{ height: `${point}px` }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricCard;