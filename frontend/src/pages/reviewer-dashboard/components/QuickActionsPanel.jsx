import React from 'react';
import Icon from '../../../components/AppIcon';


const QuickActionsPanel = () => {
  const quickActions = [
    {
      id: 1,
      title: "Start New Evaluation",
      description: "Begin reviewing a pending project",
      icon: "ClipboardCheck",
      iconColor: "bg-primary/10 text-primary",
      action: "start-evaluation"
    },
    {
      id: 2,
      title: "View Guidelines",
      description: "Review evaluation criteria and rubrics",
      icon: "BookOpen",
      iconColor: "bg-accent/10 text-accent",
      action: "view-guidelines"
    },
    {
      id: 3,
      title: "Export Reports",
      description: "Download assessment reports",
      icon: "Download",
      iconColor: "bg-success/10 text-success",
      action: "export-reports"
    },
    {
      id: 4,
      title: "Batch Evaluation",
      description: "Evaluate multiple similar projects",
      icon: "Layers",
      iconColor: "bg-warning/10 text-warning",
      action: "batch-evaluation"
    }
  ];

  return (
    <div className="bg-card border border-border rounded-lg p-4 md:p-6">
      <h3 className="text-lg md:text-xl font-heading font-semibold text-foreground mb-4">
        Quick Actions
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {quickActions?.map((action) => (
          <button
            key={action?.id}
            className="flex items-start gap-3 p-4 rounded-lg border border-border hover:bg-muted/50 hover:border-primary/20 transition-all duration-academic text-left"
          >
            <div className={`flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0 ${action?.iconColor}`}>
              <Icon name={action?.icon} size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground mb-1">
                {action?.title}
              </p>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {action?.description}
              </p>
            </div>
            <Icon name="ChevronRight" size={16} className="text-muted-foreground flex-shrink-0 mt-1" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActionsPanel;