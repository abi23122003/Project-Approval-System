import React from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';

const DocumentCard = ({ document, isSelected, onSelect, onPreview, onDownload }) => {
  const getStatusColor = () => {
    switch (document?.status) {
      case 'Approved':
        return 'bg-success/10 text-success';
      case 'Pending Review':
        return 'bg-warning/10 text-warning';
      case 'Rejected':
        return 'bg-error/10 text-error';
      case 'Draft':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getFileIcon = () => {
    const extension = document?.fileName?.split('.')?.pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'FileText';
      case 'doc': case'docx':
        return 'FileText';
      case 'xls': case'xlsx':
        return 'Sheet';
      case 'ppt': case'pptx':
        return 'Presentation';
      case 'zip': case'rar':
        return 'Archive';
      default:
        return 'File';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024)?.toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024))?.toFixed(1)} MB`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date?.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <div
      className={`bg-card border rounded-lg p-4 transition-smooth hover:shadow-elevation-md ${
        isSelected ? 'border-primary shadow-elevation-sm' : 'border-border'
      }`}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(document?.id, e?.target?.checked)}
          className="mt-1 w-4 h-4 rounded border-border text-primary focus:ring-primary focus:ring-offset-0"
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center flex-shrink-0">
                <Icon name={getFileIcon()} size={16} color="var(--color-primary)" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-foreground truncate">
                  {document?.fileName}
                </h4>
                <p className="text-xs text-muted-foreground">
                  v{document?.version}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => onPreview(document)}
                className="p-1.5 rounded hover:bg-muted transition-smooth"
                title="Preview"
              >
                <Icon name="Eye" size={16} color="var(--color-foreground)" />
              </button>
              <button
                onClick={() => onDownload(document)}
                className="p-1.5 rounded hover:bg-muted transition-smooth"
                title="Download"
              >
                <Icon name="Download" size={16} color="var(--color-foreground)" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 mb-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Icon name="Calendar" size={12} />
              {formatDate(document?.uploadDate)}
            </span>
            <span className="flex items-center gap-1">
              <Icon name="HardDrive" size={12} />
              {formatFileSize(document?.fileSize)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
              {document?.status === 'Approved' && <Icon name="CheckCircle" size={12} />}
              {document?.status === 'Pending Review' && <Icon name="Clock" size={12} />}
              {document?.status === 'Rejected' && <Icon name="XCircle" size={12} />}
              {document?.status === 'Draft' && <Icon name="Edit" size={12} />}
              {document?.status}
            </span>

            {document?.guideApproval && (
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full overflow-hidden border border-border">
                  <Image
                    src={document?.guideApproval?.avatar}
                    alt={document?.guideApproval?.avatarAlt}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {document?.guideApproval?.name}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentCard;