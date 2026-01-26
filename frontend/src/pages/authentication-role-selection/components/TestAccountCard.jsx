import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const TestAccountCard = ({ account, onQuickLogin }) => {
  return (
    <div className="p-4 md:p-5 bg-card border border-border rounded-lg hover:shadow-elevation-md transition-smooth">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
          <Icon name={account?.icon} size={20} color="var(--color-primary)" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm md:text-base font-medium text-foreground mb-1">
            {account?.name}
          </h4>
          <p className="text-xs md:text-sm text-muted-foreground">
            {account?.role}
          </p>
        </div>
      </div>
      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2">
          <Icon name="Mail" size={14} color="var(--color-muted-foreground)" />
          <span className="text-xs md:text-sm text-muted-foreground font-mono">
            {account?.email}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Icon name="Key" size={14} color="var(--color-muted-foreground)" />
          <span className="text-xs md:text-sm text-muted-foreground font-mono">
            {account?.password}
          </span>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        fullWidth
        iconName="LogIn"
        iconPosition="left"
        onClick={() => onQuickLogin(account)}
      >
        Quick Login
      </Button>
    </div>
  );
};

export default TestAccountCard;