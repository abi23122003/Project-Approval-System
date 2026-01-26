import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Image from '../../../components/AppImage';

const VersionHistoryModal = ({ document, onClose, onRollback }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date?.toLocaleDateString('en-US', { 
      month: 'short', 
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
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl max-h-[80vh] bg-card border border-border rounded-lg shadow-elevation-xl z-[1020] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-heading font-semibold text-foreground">
              Version History
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {document?.fileName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted transition-smooth"
          >
            <Icon name="X" size={20} color="var(--color-foreground)" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
          <div className="space-y-4">
            {document?.versionHistory?.map((version, index) => (
              <div
                key={version?.versionNumber}
                className="bg-muted/50 border border-border rounded-lg p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold">
                        v{version?.versionNumber}
                      </span>
                      {index === 0 && (
                        <span className="px-2 py-1 bg-success/10 text-success rounded text-xs font-medium">
                          Current
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 mb-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Icon name="Calendar" size={14} />
                        {formatDate(version?.uploadDate)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Icon name="HardDrive" size={14} />
                        {formatFileSize(version?.fileSize)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-full overflow-hidden border border-border">
                        <Image
                          src={version?.uploadedBy?.avatar}
                          alt={version?.uploadedBy?.avatarAlt}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-sm text-foreground">
                        {version?.uploadedBy?.name}
                      </span>
                    </div>

                    {version?.changes && (
                      <div className="bg-card rounded p-3 mb-3">
                        <p className="text-xs font-medium text-foreground mb-2">Changes:</p>
                        <p className="text-sm text-muted-foreground">{version?.changes}</p>
                      </div>
                    )}

                    {version?.comments && version?.comments?.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-foreground">Comments:</p>
                        {version?.comments?.map((comment, idx) => (
                          <div key={idx} className="bg-card rounded p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium text-foreground">
                                {comment?.author}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(comment?.date)}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">{comment?.text}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      iconName="Download"
                      onClick={() => console.log('Download version', version?.versionNumber)}
                    >
                      Download
                    </Button>
                    {index !== 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        iconName="RotateCcw"
                        onClick={() => onRollback(version?.versionNumber)}
                      >
                        Rollback
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default VersionHistoryModal;