import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const QuickActions = ({ onMarkAllRead, onDeleteAll, unreadCount }) => {
  return (
    <div className="bg-card border border-border rounded-lg p-4 md:p-5 lg:p-6">
      <h2 className="font-heading font-semibold text-lg md:text-xl text-foreground mb-4">
        Quick Actions
      </h2>
      
      <div className="space-y-3">
        <Button
          variant="outline"
          fullWidth
          iconName="CheckCheck"
          iconPosition="left"
          onClick={onMarkAllRead}
          disabled={unreadCount === 0}
        >
          Mark All as Read ({unreadCount})
        </Button>

        <Button
          variant="outline"
          fullWidth
          iconName="Archive"
          iconPosition="left"
        >
          Archive Read Notifications
        </Button>

        <Button
          variant="destructive"
          fullWidth
          iconName="Trash2"
          iconPosition="left"
          onClick={onDeleteAll}
        >
          Clear All Notifications
        </Button>
      </div>

      <div className="mt-6 pt-6 border-t border-border">
        <h3 className="font-heading font-semibold text-sm text-foreground mb-3">
          Export Options
        </h3>
        <div className="space-y-2">
          <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors duration-academic">
            <Icon name="Download" size={16} />
            Export as PDF
          </button>
          <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors duration-academic">
            <Icon name="FileSpreadsheet" size={16} />
            Export as CSV
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickActions;