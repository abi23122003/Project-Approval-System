import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const DocumentPreviewModal = ({ document, onClose, onDownload }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date?.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024)?.toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024))?.toFixed(1)} MB`;
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-background/80 z-[1010]"
        onClick={onClose}
      />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl max-h-[90vh] bg-card border border-border rounded-lg shadow-elevation-xl z-[1020] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center">
              <Icon name="FileText" size={20} color="var(--color-primary)" />
            </div>
            <div>
              <h2 className="text-lg font-heading font-semibold text-foreground">
                {document?.fileName}
              </h2>
              <p className="text-sm text-muted-foreground">
                Version {document?.version}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              iconName="Download"
              iconPosition="left"
              onClick={() => onDownload(document)}
            >
              Download
            </Button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-muted transition-smooth"
            >
              <Icon name="X" size={20} color="var(--color-foreground)" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Upload Date</p>
                <p className="text-sm text-foreground">{formatDate(document?.uploadDate)}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">File Size</p>
                <p className="text-sm text-foreground">{formatFileSize(document?.fileSize)}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Status</p>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  document?.status === 'Approved' ? 'bg-success/10 text-success' :
                  document?.status === 'Pending Review' ? 'bg-warning/10 text-warning' :
                  document?.status === 'Rejected'? 'bg-error/10 text-error' : 'bg-muted text-muted-foreground'
                }`}>
                  {document?.status}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Category</p>
                <p className="text-sm text-foreground">{document?.category}</p>
              </div>
              {document?.guideApproval && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Reviewed By</p>
                  <p className="text-sm text-foreground">{document?.guideApproval?.name}</p>
                </div>
              )}
              {document?.submissionDeadline && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Submission Deadline</p>
                  <p className="text-sm text-foreground">{formatDate(document?.submissionDeadline)}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon name="FileText" size={48} color="var(--color-primary)" />
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Document preview is not available in this demo
                </p>
                <Button
                  variant="default"
                  iconName="Download"
                  iconPosition="left"
                  onClick={() => onDownload(document)}
                >
                  Download to View
                </Button>
              </div>
            </div>
          </div>

          {document?.metadata && (
            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Document Metadata</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                {Object.entries(document?.metadata)?.map(([key, value]) => (
                  <div key={key} className="flex items-start gap-2">
                    <span className="text-muted-foreground capitalize">{key?.replace(/([A-Z])/g, ' $1')?.trim()}:</span>
                    <span className="text-foreground font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default DocumentPreviewModal;