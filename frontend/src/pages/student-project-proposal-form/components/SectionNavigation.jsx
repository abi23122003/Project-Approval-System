import React from 'react';
import Icon from '../../../components/AppIcon';

const SectionNavigation = ({ steps, currentStep, onStepClick, validationStatus }) => {
  return (
    <div className="bg-card border-r border-border h-full overflow-y-auto">
      <div className="p-4 border-b border-border">
        <h3 className="font-heading font-semibold text-foreground text-sm md:text-base">Form Sections</h3>
      </div>
      <nav className="p-2">
        {steps?.map((step, index) => {
          const isCompleted = validationStatus?.[step?.id]?.isValid;
          const isCurrent = index === currentStep;
          const isAccessible = index <= currentStep;

          return (
            <button
              key={step?.id}
              onClick={() => isAccessible && onStepClick(index)}
              disabled={!isAccessible}
              className={`w-full flex items-center gap-3 p-3 rounded-lg mb-2 transition-smooth text-left ${
                isCurrent
                  ? 'bg-primary/10 text-primary'
                  : isAccessible
                  ? 'hover:bg-muted text-foreground'
                  : 'opacity-50 cursor-not-allowed text-muted-foreground'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isCompleted
                    ? 'bg-success text-success-foreground'
                    : isCurrent
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {isCompleted ? (
                  <Icon name="Check" size={14} />
                ) : (
                  <span className="text-xs">{index + 1}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{step?.label}</p>
                {validationStatus?.[step?.id] && (
                  <p className="text-xs text-muted-foreground">
                    {validationStatus?.[step?.id]?.completedFields}/{validationStatus?.[step?.id]?.totalFields} fields
                  </p>
                )}
              </div>
              {isCurrent && <Icon name="ChevronRight" size={16} />}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default SectionNavigation;