import React from 'react';
import Icon from '../../../components/AppIcon';

const DraftPanel = ({ lastSaved, autoSaveEnabled, submissionChecklist, onManualSave }) => {
  const formatTimestamp = (date) => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return date?.toLocaleDateString();
  };

  const completedCount = submissionChecklist?.filter(item => item?.completed)?.length;
  const totalCount = submissionChecklist?.length;
  const completionPercentage = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="bg-card border-l border-border h-full overflow-y-auto">
      <div className="p-4 space-y-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading font-semibold text-foreground text-sm">Draft Status</h3>
            <button
              onClick={onManualSave}
              className="p-2 rounded-lg hover:bg-muted transition-smooth"
              title="Save manually"
            >
              <Icon name="Save" size={16} color="var(--color-foreground)" />
            </button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Icon
                name={autoSaveEnabled ? 'CheckCircle' : 'AlertCircle'}
                size={16}
                color={autoSaveEnabled ? 'var(--color-success)' : 'var(--color-warning)'}
              />
              <span className="text-muted-foreground">
                {autoSaveEnabled ? 'Auto-save enabled' : 'Auto-save disabled'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Icon name="Clock" size={16} color="var(--color-muted-foreground)" />
              <span className="text-muted-foreground">Last saved: {formatTimestamp(lastSaved)}</span>
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading font-semibold text-foreground text-sm">Submission Readiness</h3>
            <span className="text-xs font-medium text-primary">{completionPercentage}%</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-primary transition-smooth"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <div className="space-y-2">
            {submissionChecklist?.map((item) => (
              <div key={item?.id} className="flex items-start gap-2">
                <Icon
                  name={item?.completed ? 'CheckCircle' : 'Circle'}
                  size={16}
                  color={item?.completed ? 'var(--color-success)' : 'var(--color-muted-foreground)'}
                  className="mt-0.5 flex-shrink-0"
                />
                <span className={`text-xs ${item?.completed ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {item?.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <h3 className="font-heading font-semibold text-foreground text-sm mb-3">Quick Actions</h3>
          <div className="space-y-2">
            <button className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-smooth text-left">
              <Icon name="FileText" size={16} color="var(--color-foreground)" />
              <span className="text-sm text-foreground">Load Template</span>
            </button>
            <button className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-smooth text-left">
              <Icon name="Eye" size={16} color="var(--color-foreground)" />
              <span className="text-sm text-foreground">Preview PDF</span>
            </button>
            <button className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-smooth text-left">
              <Icon name="Download" size={16} color="var(--color-foreground)" />
              <span className="text-sm text-foreground">Export Draft</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DraftPanel;