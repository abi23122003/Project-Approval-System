import React from 'react';
import Icon from '../../../components/AppIcon';

const PendingTaskCard = ({ task }) => {
  const getPriorityColor = (priority) => {
    const colors = {
      'High': 'bg-error/10 text-error border-error/20',
      'Medium': 'bg-warning/10 text-warning border-warning/20',
      'Low': 'bg-success/10 text-success border-success/20'
    };
    return colors?.[priority] || colors?.['Medium'];
  };

  const getDaysUntilDue = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysLeft = getDaysUntilDue(task?.dueDate);

  return (
    <div className="bg-card border border-border rounded-lg p-4 hover:shadow-elevation-md transition-smooth">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm md:text-base font-heading font-semibold text-foreground mb-1 line-clamp-2">
            {task?.title}
          </h4>
          <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">
            {task?.description}
          </p>
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded border text-xs font-medium whitespace-nowrap ${getPriorityColor(task?.priority)}`}>
          <Icon name="AlertCircle" size={12} />
          <span>{task?.priority}</span>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs md:text-sm">
        <div className="flex items-center gap-2">
          <Icon name="Calendar" size={14} color="var(--color-muted-foreground)" />
          <span className="text-muted-foreground">Due: {task?.dueDate}</span>
        </div>
        <span className={`font-medium ${daysLeft <= 3 ? 'text-error' : daysLeft <= 7 ? 'text-warning' : 'text-success'}`}>
          {daysLeft > 0 ? `${daysLeft} days left` : daysLeft === 0 ? 'Due today' : 'Overdue'}
        </span>
      </div>
      <button className="w-full mt-3 flex items-center justify-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-smooth text-sm font-medium">
        <Icon name="CheckCircle" size={16} />
        <span>Complete Task</span>
      </button>
    </div>
  );
};

export default PendingTaskCard;