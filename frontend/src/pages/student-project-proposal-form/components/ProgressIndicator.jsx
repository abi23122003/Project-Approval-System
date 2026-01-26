import React from 'react';
import Icon from '../../../components/AppIcon';

const ProgressIndicator = ({ currentStep, steps, onStepClick }) => {
  return (
    <div className="bg-card border-b border-border py-4 px-4 md:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between gap-2 md:gap-4 overflow-x-auto pb-2">
          {steps?.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            const isAccessible = index <= currentStep;

            return (
              <React.Fragment key={step?.id}>
                <button
                  onClick={() => isAccessible && onStepClick(index)}
                  disabled={!isAccessible}
                  className={`flex items-center gap-2 md:gap-3 flex-shrink-0 transition-smooth ${
                    isAccessible ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                  }`}
                >
                  <div
                    className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-smooth ${
                      isCompleted
                        ? 'bg-success text-success-foreground'
                        : isCurrent
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {isCompleted ? (
                      <Icon name="Check" size={16} />
                    ) : (
                      <span className="text-sm font-medium">{index + 1}</span>
                    )}
                  </div>
                  <div className="hidden md:block text-left">
                    <p
                      className={`text-xs md:text-sm font-medium transition-smooth ${
                        isCurrent ? 'text-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      {step?.label}
                    </p>
                    {step?.validation && (
                      <p className="text-xs text-muted-foreground">{step?.validation}</p>
                    )}
                  </div>
                </button>
                {index < steps?.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 min-w-[20px] md:min-w-[40px] transition-smooth ${
                      isCompleted ? 'bg-success' : 'bg-border'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProgressIndicator;