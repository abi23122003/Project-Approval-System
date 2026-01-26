import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const QuickActionsPanel = ({ selectedStudent }) => {
  const upcomingDeadlines = [
    {
      id: 1,
      title: "Project Proposal Review",
      student: "Sarah Johnson",
      date: "2026-01-28",
      time: "10:00 AM",
      priority: "high"
    },
    {
      id: 2,
      title: "Mid-term Evaluation",
      student: "Michael Chen",
      date: "2026-01-29",
      time: "2:00 PM",
      priority: "medium"
    },
    {
      id: 3,
      title: "Final Report Submission",
      student: "Emily Rodriguez",
      date: "2026-01-30",
      time: "5:00 PM",
      priority: "high"
    }
  ];

  const notifications = [
    {
      id: 1,
      type: "submission",
      message: "New document submitted by Alex Kumar",
      time: "2 hours ago",
      icon: "FileText"
    },
    {
      id: 2,
      type: "meeting",
      message: "Meeting scheduled with Jessica Lee",
      time: "4 hours ago",
      icon: "Calendar"
    },
    {
      id: 3,
      type: "comment",
      message: "Comment added by David Park",
      time: "1 day ago",
      icon: "MessageSquare"
    }
  ];

  const getPriorityColor = (priority) => {
    if (priority === 'high') return 'border-l-error';
    if (priority === 'medium') return 'border-l-warning';
    return 'border-l-success';
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 md:p-6 border-b border-border">
        <h3 className="text-base md:text-lg font-heading font-semibold text-foreground mb-4">
          Quick Actions
        </h3>
        <div className="space-y-2">
          <Button
            variant="default"
            iconName="Plus"
            iconPosition="left"
            fullWidth
            disabled={!selectedStudent}
          >
            Schedule Meeting
          </Button>
          <Button
            variant="outline"
            iconName="MessageSquare"
            iconPosition="left"
            fullWidth
            disabled={!selectedStudent}
          >
            Add Feedback
          </Button>
          <Button
            variant="outline"
            iconName="FileDown"
            iconPosition="left"
            fullWidth
            disabled={!selectedStudent}
          >
            Export Report
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm md:text-base font-heading font-semibold text-foreground">
              Upcoming Deadlines
            </h3>
            <Icon name="Calendar" size={18} color="var(--color-primary)" />
          </div>

          <div className="space-y-3">
            {upcomingDeadlines?.map((deadline) => (
              <div
                key={deadline?.id}
                className={`bg-card border-l-4 ${getPriorityColor(deadline?.priority)} border-t border-r border-b border-border rounded-r-lg p-3 transition-smooth hover:shadow-elevation-sm`}
              >
                <h4 className="text-xs md:text-sm font-medium text-foreground mb-1">
                  {deadline?.title}
                </h4>
                <p className="text-xs text-muted-foreground mb-2">
                  {deadline?.student}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Icon name="Clock" size={12} />
                  <span>{deadline?.date} at {deadline?.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm md:text-base font-heading font-semibold text-foreground">
              Recent Activity
            </h3>
            <Icon name="Bell" size={18} color="var(--color-accent)" />
          </div>

          <div className="space-y-3">
            {notifications?.map((notification) => (
              <div
                key={notification?.id}
                className="bg-card border border-border rounded-lg p-3 transition-smooth hover:bg-muted"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Icon name={notification?.icon} size={14} color="var(--color-primary)" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs md:text-sm text-foreground mb-1">
                      {notification?.message}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {notification?.time}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="p-4 md:p-6 border-t border-border">
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Icon name="Info" size={20} color="var(--color-primary)" className="flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-foreground mb-1">
                Keyboard Shortcuts
              </h4>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p><kbd className="px-1.5 py-0.5 bg-muted rounded text-foreground">J</kbd> / <kbd className="px-1.5 py-0.5 bg-muted rounded text-foreground">K</kbd> Navigate students</p>
                <p><kbd className="px-1.5 py-0.5 bg-muted rounded text-foreground">Enter</kbd> View details</p>
                <p><kbd className="px-1.5 py-0.5 bg-muted rounded text-foreground">F</kbd> Filter students</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickActionsPanel;