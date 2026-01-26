import React from 'react';

import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';

const EvaluationCard = ({ evaluation }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'in-progress':
        return 'bg-accent/10 text-accent border-accent/20';
      case 'completed':
        return 'bg-success/10 text-success border-success/20';
      case 'overdue':
        return 'bg-error/10 text-error border-error/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'text-error';
      case 'medium':
        return 'text-warning';
      case 'low':
        return 'text-success';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 md:p-6 hover:shadow-subtle transition-all duration-academic">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3 mb-3">
            <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-lg overflow-hidden bg-muted">
              <Image
                src={evaluation?.studentAvatar}
                alt={evaluation?.studentAvatarAlt}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base md:text-lg font-heading font-semibold text-foreground mb-1 line-clamp-1">
                {evaluation?.projectTitle}
              </h3>
              <p className="text-sm text-muted-foreground">
                {evaluation?.studentName} • {evaluation?.department}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${getStatusColor(evaluation?.status)}`}>
              {evaluation?.status?.charAt(0)?.toUpperCase() + evaluation?.status?.slice(1)?.replace('-', ' ')}
            </span>
            <span className={`inline-flex items-center gap-1 text-xs font-medium ${getPriorityColor(evaluation?.priority)}`}>
              <Icon name="AlertCircle" size={14} />
              {evaluation?.priority?.charAt(0)?.toUpperCase() + evaluation?.priority?.slice(1)} Priority
            </span>
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {evaluation?.projectDescription}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Icon name="Calendar" size={14} />
              <span>Due: {evaluation?.dueDate}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Icon name="FileText" size={14} />
              <span>{evaluation?.documentsCount} Documents</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Icon name="Clock" size={14} />
              <span>Submitted: {evaluation?.submittedDate}</span>
            </div>
          </div>
        </div>

        <div className="flex lg:flex-col gap-2">
          <Button
            variant="default"
            size="sm"
            iconName="ClipboardCheck"
            iconPosition="left"
            fullWidth
            className="lg:w-auto"
          >
            Start Review
          </Button>
          <Button
            variant="outline"
            size="sm"
            iconName="Eye"
            iconPosition="left"
            fullWidth
            className="lg:w-auto"
          >
            View Details
          </Button>
        </div>
      </div>
      {evaluation?.progress !== undefined && (
        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">Evaluation Progress</span>
            <span className="text-xs font-semibold text-foreground">{evaluation?.progress}%</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-academic"
              style={{ width: `${evaluation?.progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default EvaluationCard;