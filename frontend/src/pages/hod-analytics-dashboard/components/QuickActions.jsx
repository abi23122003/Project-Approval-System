import React from 'react';
import Icon from '../../../components/AppIcon';

const QuickActions = ({ actions }) => {
  return (
    <div className="bg-card rounded-lg border border-border p-4 md:p-6">
      <h2 className="text-lg md:text-xl font-heading font-semibold text-foreground mb-6">
        Quick Actions
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {actions?.map((action, index) => (
          <button
            key={index}
            className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:border-primary/30 hover:bg-primary/5 transition-all duration-academic text-left"
          >
            <div 
              className="flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0"
              style={{ backgroundColor: `${action?.color}15` }}
            >
              <Icon name={action?.icon} size={20} color={action?.color} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-foreground mb-0.5">
                {action?.label}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {action?.description}
              </p>
            </div>
            <Icon name="ChevronRight" size={16} className="text-muted-foreground flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;