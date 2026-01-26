import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Icon from '../AppIcon';
import Button from './Button';

const QuickActions = () => {
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);

  const actionsByRoute = {
    '/student-dashboard': [
      { label: 'New Project', icon: 'Plus', variant: 'default', action: 'create-project' },
      { label: 'Upload Document', icon: 'Upload', variant: 'outline', action: 'upload-doc' },
      { label: 'View Timeline', icon: 'Calendar', variant: 'ghost', action: 'view-timeline' }
    ],
    '/student-project-proposal-form': [
      { label: 'Save Draft', icon: 'Save', variant: 'outline', action: 'save-draft' },
      { label: 'Preview', icon: 'Eye', variant: 'ghost', action: 'preview' },
      { label: 'Submit', icon: 'Send', variant: 'default', action: 'submit' }
    ],
    '/student-document-management': [
      { label: 'Upload File', icon: 'Upload', variant: 'default', action: 'upload-file' },
      { label: 'Create Folder', icon: 'FolderPlus', variant: 'outline', action: 'create-folder' },
      { label: 'Download All', icon: 'Download', variant: 'ghost', action: 'download-all' }
    ],
    '/guide-dashboard': [
      { label: 'Review Projects', icon: 'ClipboardCheck', variant: 'default', action: 'review-projects' },
      { label: 'Export Report', icon: 'FileDown', variant: 'outline', action: 'export-report' }
    ],
    '/guide-project-review-interface': [
      { label: 'Approve', icon: 'CheckCircle', variant: 'success', action: 'approve' },
      { label: 'Request Changes', icon: 'AlertCircle', variant: 'warning', action: 'request-changes' },
      { label: 'Reject', icon: 'XCircle', variant: 'destructive', action: 'reject' },
      { label: 'Add Comment', icon: 'MessageSquare', variant: 'outline', action: 'add-comment' }
    ]
  };

  const currentActions = actionsByRoute?.[location?.pathname] || [];

  const handleAction = (action) => {
    console.log(`Action triggered: ${action}`);
    setIsExpanded(false);
  };

  if (currentActions?.length === 0) {
    return null;
  }

  return (
    <>
      <div className="hidden lg:flex items-center gap-3 mb-6">
        {currentActions?.map((action) => (
          <Button
            key={action?.action}
            variant={action?.variant}
            iconName={action?.icon}
            iconPosition="left"
            onClick={() => handleAction(action?.action)}
          >
            {action?.label}
          </Button>
        ))}
      </div>
      <div className="lg:hidden fixed bottom-6 right-6 z-[100]">
        {isExpanded && (
          <>
            <div
              className="fixed inset-0 bg-background z-[90]"
              onClick={() => setIsExpanded(false)}
            />
            <div className="absolute bottom-16 right-0 bg-card border border-border rounded-lg shadow-elevation-xl p-2 min-w-[200px] z-[100]">
              {currentActions?.map((action) => (
                <button
                  key={action?.action}
                  onClick={() => handleAction(action?.action)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-smooth text-left"
                >
                  <Icon name={action?.icon} size={18} color="var(--color-foreground)" />
                  <span className="text-sm font-medium text-foreground">{action?.label}</span>
                </button>
              ))}
            </div>
          </>
        )}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-elevation-xl flex items-center justify-center transition-smooth hover:scale-105 active:scale-95"
        >
          <Icon name={isExpanded ? 'X' : 'Zap'} size={24} />
        </button>
      </div>
    </>
  );
};

export default QuickActions;