import React from 'react';
import Icon from '../../../components/AppIcon';

const ProjectTimelinePanel = ({ student }) => {
  if (!student) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-6 md:p-8">
        <div className="w-16 h-16 md:w-20 md:h-20 bg-muted rounded-full flex items-center justify-center mb-4">
          <Icon name="Users" size={32} color="var(--color-muted-foreground)" />
        </div>
        <h3 className="text-lg md:text-xl font-heading font-semibold text-foreground mb-2">
          No Student Selected
        </h3>
        <p className="text-sm md:text-base text-muted-foreground max-w-md">
          Select a student from the roster to view their project timeline and progress details
        </p>
      </div>
    );
  }

  const getStatusColor = (status) => {
    const colors = {
      completed: 'bg-success text-success-foreground',
      current: 'bg-primary text-primary-foreground',
      pending: 'bg-muted text-muted-foreground'
    };
    return colors?.[status] || 'bg-muted text-muted-foreground';
  };

  const getStatusIcon = (status) => {
    if (status === 'completed') return 'CheckCircle';
    if (status === 'current') return 'Clock';
    return 'Circle';
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 md:p-6 border-b border-border">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden bg-muted flex-shrink-0">
            <img
              src={student?.avatar}
              alt={student?.avatarAlt}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg md:text-xl font-heading font-semibold text-foreground mb-1">
              {student?.name}
            </h2>
            <p className="text-sm md:text-base text-muted-foreground mb-2">
              {student?.email}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs md:text-sm px-2 py-1 bg-primary/10 text-primary rounded-full">
                {student?.department}
              </span>
              <span className="text-xs md:text-sm text-muted-foreground">
                Roll: {student?.rollNumber}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-muted rounded-lg p-3 md:p-4">
          <h3 className="text-sm md:text-base font-medium text-foreground mb-2">
            {student?.projectTitle}
          </h3>
          <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">
            {student?.projectDescription}
          </p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h3 className="text-base md:text-lg font-heading font-semibold text-foreground">
            Project Timeline
          </h3>
          <span className="text-sm md:text-base font-medium text-primary">
            {student?.progressScore}% Complete
          </span>
        </div>

        <div className="relative">
          <div className="absolute left-4 md:left-5 top-0 bottom-0 w-0.5 bg-border" />

          <div className="space-y-4 md:space-y-6">
            {student?.timeline?.map((milestone, index) => (
              <div key={index} className="relative flex gap-4">
                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getStatusColor(milestone?.status)}`}>
                  <Icon name={getStatusIcon(milestone?.status)} size={16} />
                </div>

                <div className="flex-1 pb-4 md:pb-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
                    <h4 className="text-sm md:text-base font-medium text-foreground">
                      {milestone?.title}
                    </h4>
                    <span className="text-xs md:text-sm text-muted-foreground whitespace-nowrap">
                      {milestone?.date}
                    </span>
                  </div>

                  <p className="text-xs md:text-sm text-muted-foreground mb-3">
                    {milestone?.description}
                  </p>

                  {milestone?.submissions && milestone?.submissions?.length > 0 && (
                    <div className="space-y-2">
                      {milestone?.submissions?.map((submission, subIndex) => (
                        <div
                          key={subIndex}
                          className="bg-card border border-border rounded-lg p-3"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs md:text-sm font-medium text-foreground">
                              {submission?.title}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              submission?.status === 'Approved' ?'bg-success/10 text-success'
                                : submission?.status === 'Pending' ?'bg-warning/10 text-warning' :'bg-error/10 text-error'
                            }`}>
                              {submission?.status}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Submitted: {submission?.submittedDate}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="p-4 md:p-6 border-t border-border">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="bg-card border border-border rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Icon name="FileText" size={16} color="var(--color-primary)" />
              <span className="text-xs text-muted-foreground">Documents</span>
            </div>
            <p className="text-lg md:text-xl font-semibold text-foreground">
              {student?.analytics?.totalDocuments}
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Icon name="MessageSquare" size={16} color="var(--color-accent)" />
              <span className="text-xs text-muted-foreground">Comments</span>
            </div>
            <p className="text-lg md:text-xl font-semibold text-foreground">
              {student?.analytics?.totalComments}
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Icon name="Calendar" size={16} color="var(--color-success)" />
              <span className="text-xs text-muted-foreground">Meetings</span>
            </div>
            <p className="text-lg md:text-xl font-semibold text-foreground">
              {student?.analytics?.totalMeetings}
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Icon name="TrendingUp" size={16} color="var(--color-warning)" />
              <span className="text-xs text-muted-foreground">Score</span>
            </div>
            <p className="text-lg md:text-xl font-semibold text-foreground">
              {student?.analytics?.averageScore}/10
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectTimelinePanel;