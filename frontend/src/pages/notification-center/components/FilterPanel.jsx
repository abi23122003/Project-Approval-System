import React from 'react';
import Icon from '../../../components/AppIcon';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';

const FilterPanel = ({ filters, onFilterChange, notificationStats }) => {
  const priorityOptions = [
    { value: 'all', label: 'All Priorities' },
    { value: 'critical', label: 'Critical' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' }
  ];

  const typeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'submission', label: 'Submissions' },
    { value: 'review', label: 'Reviews' },
    { value: 'feedback', label: 'Feedback' },
    { value: 'deadline', label: 'Deadlines' },
    { value: 'approval', label: 'Approvals' },
    { value: 'system', label: 'System Updates' }
  ];

  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    { value: 'Project Management', label: 'Project Management' },
    { value: 'Academic Review', label: 'Academic Review' },
    { value: 'System Update', label: 'System Update' },
    { value: 'Deadline Alert', label: 'Deadline Alert' },
    { value: 'Feedback', label: 'Feedback' }
  ];

  const timeRangeOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' }
  ];

  return (
    <div className="bg-card border border-border rounded-lg p-4 md:p-5 lg:p-6">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h2 className="font-heading font-semibold text-lg md:text-xl text-foreground">
          Filters
        </h2>
        <button
          onClick={() => onFilterChange('reset')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors duration-academic"
        >
          <Icon name="RotateCcw" size={16} />
          Reset
        </button>
      </div>
      <div className="space-y-4 md:space-y-5">
        <div className="grid grid-cols-1 gap-4">
          <Checkbox
            label="Show unread only"
            checked={filters?.showUnreadOnly}
            onChange={(e) => onFilterChange('showUnreadOnly', e?.target?.checked)}
          />
        </div>

        <div>
          <Select
            label="Priority Level"
            options={priorityOptions}
            value={filters?.priority}
            onChange={(value) => onFilterChange('priority', value)}
          />
        </div>

        <div>
          <Select
            label="Notification Type"
            options={typeOptions}
            value={filters?.type}
            onChange={(value) => onFilterChange('type', value)}
          />
        </div>

        <div>
          <Select
            label="Category"
            options={categoryOptions}
            value={filters?.category}
            onChange={(value) => onFilterChange('category', value)}
          />
        </div>

        <div>
          <Select
            label="Time Range"
            options={timeRangeOptions}
            value={filters?.timeRange}
            onChange={(value) => onFilterChange('timeRange', value)}
          />
        </div>

        <div className="pt-4 border-t border-border">
          <h3 className="font-heading font-semibold text-sm text-foreground mb-3">
            Statistics
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total</span>
              <span className="font-semibold text-foreground">{notificationStats?.total}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Unread</span>
              <span className="font-semibold text-primary">{notificationStats?.unread}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Critical</span>
              <span className="font-semibold text-error">{notificationStats?.critical}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;