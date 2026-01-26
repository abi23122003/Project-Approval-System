import React from 'react';
import Icon from '../../../components/AppIcon';

const ProjectStatusCard = ({ project }) => {
  const getStatusColor = (status) => {
    const colors = {
      'In Progress': 'bg-primary/10 text-primary border-primary/20',
      'Under Review': 'bg-warning/10 text-warning border-warning/20',
      'Approved': 'bg-success/10 text-success border-success/20',
      'Revision Required': 'bg-error/10 text-error border-error/20',
      'Draft': 'bg-muted text-muted-foreground border-border'
    };
    return colors?.[status] || colors?.['Draft'];
  };

  const getStatusIcon = (status) => {
    const icons = {
      'In Progress': 'Clock',
      'Under Review': 'Eye',
      'Approved': 'CheckCircle',
      'Revision Required': 'AlertCircle',
      'Draft': 'FileText'
    };
    return icons?.[status] || 'FileText';
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 md:p-6 shadow-elevation-sm hover:shadow-elevation-md transition-smooth">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-base md:text-lg font-heading font-semibold text-foreground mb-1 line-clamp-2">
            {project?.title}
          </h3>
          <p className="text-xs md:text-sm text-muted-foreground">
            Project ID: {project?.id}
          </p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${getStatusColor(project?.status)}`}>
          <Icon name={getStatusIcon(project?.status)} size={14} />
          <span className="text-xs font-medium whitespace-nowrap">{project?.status}</span>
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-foreground">
          <Icon name="User" size={16} color="var(--color-muted-foreground)" />
          <span className="text-muted-foreground">Guide:</span>
          <span className="font-medium">{project?.guide}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-foreground">
          <Icon name="Calendar" size={16} color="var(--color-muted-foreground)" />
          <span className="text-muted-foreground">Deadline:</span>
          <span className="font-medium">{project?.deadline}</span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs md:text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium text-foreground">{project?.progress}%</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${project?.progress}%` }}
            />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
        <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-smooth text-sm font-medium">
          <Icon name="Eye" size={16} />
          <span>View Details</span>
        </button>
        <button className="flex items-center justify-center gap-2 px-3 py-2 border border-border rounded-lg hover:bg-muted transition-smooth text-sm font-medium text-foreground">
          <Icon name="Edit" size={16} />
          <span className="hidden md:inline">Edit</span>
        </button>
      </div>
    </div>
  );
};

export default ProjectStatusCard;