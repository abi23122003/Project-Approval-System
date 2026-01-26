import React from 'react';

import Button from '../../../components/ui/Button';

const QuickActionCard = ({ title, description, actions }) => {
  return (
    <div className="bg-card border border-border rounded-lg p-4 md:p-6">
      <h3 className="text-base md:text-lg font-heading font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4 md:mb-6">{description}</p>
      <div className="space-y-2">
        {actions?.map((action, index) => (
          <Button
            key={index}
            variant={action?.variant || 'outline'}
            fullWidth
            iconName={action?.icon}
            iconPosition="left"
            onClick={action?.onClick}
          >
            {action?.label}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default QuickActionCard;