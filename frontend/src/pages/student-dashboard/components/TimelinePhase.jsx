import React from 'react';
import Icon from '../../../components/AppIcon';

const TimelinePhase = ({ phase, isLast }) => {
  const getPhaseColor = (status) => {
    const colors = {
      'completed': 'bg-success text-success-foreground',
      'current': 'bg-primary text-primary-foreground',
      'pending': 'bg-muted text-muted-foreground'
    };
    return colors?.[status] || colors?.['pending'];
  };

  const getPhaseIcon = (status) => {
    const icons = {
      'completed': 'CheckCircle',
      'current': 'Clock',
      'pending': 'Circle'
    };
    return icons?.[status] || 'Circle';
  };

  return (
    <div className="flex gap-3 md:gap-4">
      <div className="flex flex-col items-center">
        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center ${getPhaseColor(phase?.status)}`}>
          <Icon name={getPhaseIcon(phase?.status)} size={16} />
        </div>
        {!isLast && (
          <div className={`w-0.5 flex-1 mt-2 ${phase?.status === 'completed' ? 'bg-success' : 'bg-border'}`} style={{ minHeight: '40px' }} />
        )}
      </div>
      <div className="flex-1 pb-6 md:pb-8">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <h4 className="text-sm md:text-base font-heading font-semibold text-foreground mb-1">
              {phase?.title}
            </h4>
            <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">
              {phase?.description}
            </p>
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {phase?.date}
          </span>
        </div>

        {phase?.tasks && phase?.tasks?.length > 0 && (
          <div className="mt-3 space-y-2">
            {phase?.tasks?.map((task, index) => (
              <div key={index} className="flex items-center gap-2 text-xs md:text-sm">
                <div className={`w-4 h-4 rounded flex items-center justify-center ${task?.completed ? 'bg-success' : 'bg-muted'}`}>
                  {task?.completed && <Icon name="Check" size={12} color="var(--color-success-foreground)" />}
                </div>
                <span className={task?.completed ? 'text-muted-foreground line-through' : 'text-foreground'}>
                  {task?.name}
                </span>
              </div>
            ))}
          </div>
        )}

        {phase?.documents && phase?.documents?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {phase?.documents?.map((doc, index) => (
              <div key={index} className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg text-xs">
                <Icon name="FileText" size={14} color="var(--color-foreground)" />
                <span className="text-foreground">{doc}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TimelinePhase;