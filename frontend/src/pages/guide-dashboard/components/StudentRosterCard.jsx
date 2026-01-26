import React from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';

const StudentRosterCard = ({ student, isSelected, onClick }) => {
  const getStatusColor = (status) => {
    const colors = {
      'In Progress': 'bg-primary/10 text-primary',
      'Pending Review': 'bg-warning/10 text-warning',
      'Approved': 'bg-success/10 text-success',
      'Needs Revision': 'bg-error/10 text-error',
      'Submitted': 'bg-accent/10 text-accent'
    };
    return colors?.[status] || 'bg-muted text-muted-foreground';
  };

  const getPriorityIcon = (priority) => {
    if (priority === 'high') return { name: 'AlertCircle', color: 'var(--color-error)' };
    if (priority === 'medium') return { name: 'Clock', color: 'var(--color-warning)' };
    return { name: 'CheckCircle', color: 'var(--color-success)' };
  };

  const priorityIcon = getPriorityIcon(student?.priority);

  return (
    <button
      onClick={onClick}
      className={`w-full p-3 md:p-4 rounded-lg border transition-smooth text-left ${
        isSelected
          ? 'bg-primary/5 border-primary shadow-elevation-sm'
          : 'bg-card border-border hover:bg-muted hover:border-primary/30'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden bg-muted">
            <Image
              src={student?.avatar}
              alt={student?.avatarAlt}
              className="w-full h-full object-cover"
            />
          </div>
          {student?.pendingActions > 0 && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-error text-error-foreground rounded-full flex items-center justify-center text-xs font-medium">
              {student?.pendingActions}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="text-sm md:text-base font-medium text-foreground truncate">
              {student?.name}
            </h4>
            <Icon name={priorityIcon?.name} size={16} color={priorityIcon?.color} className="flex-shrink-0" />
          </div>

          <p className="text-xs md:text-sm text-muted-foreground line-clamp-1 mb-2">
            {student?.projectTitle}
          </p>

          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(student?.status)}`}>
              {student?.status}
            </span>
            <span className="text-xs text-muted-foreground">
              Phase {student?.currentPhase}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Icon name="Clock" size={12} />
              {student?.lastActivity}
            </span>
            <span className="font-medium text-foreground">
              {student?.progressScore}%
            </span>
          </div>
        </div>
      </div>
    </button>
  );
};

export default StudentRosterCard;