import React from 'react';
import Icon from '../../../components/AppIcon';

const UpcomingDeadlineCard = ({ deadline }) => {
  const getDaysUntilDeadline = (date) => {
    const today = new Date();
    const deadlineDate = new Date(date);
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysLeft = getDaysUntilDeadline(deadline?.date);

  const getUrgencyColor = (days) => {
    if (days <= 3) return 'bg-error/10 text-error border-error/20';
    if (days <= 7) return 'bg-warning/10 text-warning border-warning/20';
    return 'bg-success/10 text-success border-success/20';
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 hover:shadow-elevation-md transition-smooth">
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getUrgencyColor(daysLeft)}`}>
          <Icon name="Calendar" size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm md:text-base font-heading font-semibold text-foreground mb-1 line-clamp-2">
            {deadline?.title}
          </h4>
          <p className="text-xs md:text-sm text-muted-foreground">
            {deadline?.category}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
          <Icon name="Clock" size={14} />
          <span>{deadline?.date}</span>
        </div>
        <span className={`text-xs md:text-sm font-medium ${
          daysLeft <= 3 ? 'text-error' : daysLeft <= 7 ? 'text-warning' : 'text-success'
        }`}>
          {daysLeft > 0 ? `${daysLeft} days` : daysLeft === 0 ? 'Today' : 'Overdue'}
        </span>
      </div>
    </div>
  );
};

export default UpcomingDeadlineCard;