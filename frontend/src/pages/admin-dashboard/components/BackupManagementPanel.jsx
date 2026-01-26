import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const BackupManagementPanel = ({ backups, onCreateBackup, onRestoreBackup, onDeleteBackup }) => {
  const getBackupStatusColor = (status) => {
    const colors = {
      'completed': 'bg-success/10 text-success',
      'in_progress': 'bg-warning/10 text-warning',
      'failed': 'bg-error/10 text-error',
      'scheduled': 'bg-primary/10 text-primary'
    };
    return colors?.[status] || 'bg-muted text-muted-foreground';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes?.[i];
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="p-4 md:p-6 border-b border-border">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
          <h3 className="text-lg md:text-xl font-heading font-semibold text-foreground">Backup Management</h3>
          <Button variant="default" iconName="Database" iconPosition="left" onClick={onCreateBackup}>
            Create Backup
          </Button>
        </div>
      </div>
      <div className="divide-y divide-border">
        {backups?.map((backup) => (
          <div key={backup?.id} className="p-4 md:p-6 hover:bg-muted/30 transition-colors duration-academic">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon name="Database" size={24} color="var(--color-primary)" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <p className="text-sm font-medium text-foreground">{backup?.name}</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getBackupStatusColor(backup?.status)}`}>
                      {backup?.status?.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center">
                      <Icon name="Calendar" size={12} className="mr-1" />
                      {backup?.createdAt}
                    </span>
                    <span className="flex items-center">
                      <Icon name="HardDrive" size={12} className="mr-1" />
                      {formatFileSize(backup?.size)}
                    </span>
                    <span className="flex items-center">
                      <Icon name="User" size={12} className="mr-1" />
                      {backup?.createdBy}
                    </span>
                  </div>
                  {backup?.description && (
                    <p className="text-xs text-muted-foreground mt-2">{backup?.description}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  iconName="Download"
                  onClick={() => onRestoreBackup(backup)}
                >
                  Restore
                </Button>
                <button
                  onClick={() => onDeleteBackup(backup)}
                  className="p-2 text-muted-foreground hover:text-error hover:bg-error/10 rounded-lg transition-colors duration-academic"
                  aria-label="Delete backup"
                >
                  <Icon name="Trash2" size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {backups?.length === 0 && (
        <div className="p-8 md:p-12 text-center">
          <Icon name="Database" size={48} className="mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">No backups available</p>
          <Button variant="outline" iconName="Plus" onClick={onCreateBackup}>
            Create First Backup
          </Button>
        </div>
      )}
    </div>
  );
};

export default BackupManagementPanel;