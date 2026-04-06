import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';
import Button from './Button';

const QuickActions = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  const showToast = (message) => {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:var(--color-primary,#2563eb);color:#fff;padding:10px 20px;border-radius:8px;font-size:14px;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,.15)`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  };

  const actionsByRoute = {
    '/student-dashboard': [
      { label: 'New Project', icon: 'Plus', variant: 'default', action: 'create-project', navigate: '/student-project-proposal-form' },
      { label: 'Upload Document', icon: 'Upload', variant: 'outline', action: 'upload-doc', navigate: '/student-document-management' },
      { label: 'View Timeline', icon: 'Calendar', variant: 'ghost', action: 'view-timeline', navigate: null }
    ],
    '/student-project-proposal-form': [
      { label: 'Save Draft', icon: 'Save', variant: 'outline', action: 'save-draft', navigate: null },
      { label: 'Preview', icon: 'Eye', variant: 'ghost', action: 'preview', navigate: null },
      { label: 'Submit', icon: 'Send', variant: 'default', action: 'submit', navigate: null }
    ],
    '/student-document-management': [
      { label: 'Upload File', icon: 'Upload', variant: 'default', action: 'upload-file', navigate: null },
      { label: 'Create Folder', icon: 'FolderPlus', variant: 'outline', action: 'create-folder', navigate: null },
      { label: 'Download All', icon: 'Download', variant: 'ghost', action: 'download-all', navigate: null }
    ],
    '/guide-dashboard': [
      { label: 'Review Projects', icon: 'ClipboardCheck', variant: 'default', action: 'review-projects', navigate: '/guide-project-review-interface' },
      { label: 'Export Report', icon: 'FileDown', variant: 'outline', action: 'export-report', navigate: null }
    ],
    '/guide-project-review-interface': [
      { label: 'Approve', icon: 'CheckCircle', variant: 'success', action: 'approve', navigate: null },
      { label: 'Request Changes', icon: 'AlertCircle', variant: 'warning', action: 'request-changes', navigate: null },
      { label: 'Reject', icon: 'XCircle', variant: 'destructive', action: 'reject', navigate: null },
      { label: 'Add Comment', icon: 'MessageSquare', variant: 'outline', action: 'add-comment', navigate: null }
    ]
  };

  const currentActions = actionsByRoute?.[location?.pathname] || [];

  const toastMessages = {
    'save-draft': 'Draft saved successfully!',
    'preview': 'Opening preview…',
    'submit': 'Submitting proposal…',
    'upload-file': 'Opening file picker…',
    'create-folder': 'Creating new folder…',
    'download-all': 'Preparing download…',
    'export-report': 'Generating report…',
    'approve': 'Project approved!',
    'request-changes': 'Change request sent.',
    'reject': 'Project rejected.',
    'add-comment': 'Comment box opened.',
    'view-timeline': 'Scrolling to timeline…'
  };

  const handleAction = (action) => {
    // Find the action config
    const actionConfig = currentActions?.find(a => a?.action === action);
    
    if (!actionConfig) {
      console.error(`Action ${action} not found in currentActions`);
      return;
    }

    // If navigate path exists, use navigation
    if (actionConfig?.navigate) {
      navigate(actionConfig.navigate);
    } else {
      // Otherwise show a toast notification
      const messageText = toastMessages[action] || `${action} triggered`;
      showToast(messageText);
    }

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