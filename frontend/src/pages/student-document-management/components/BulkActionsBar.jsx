import React from 'react';

import Button from '../../../components/ui/Button';

const BulkActionsBar = ({ selectedCount, onDownloadAll, onArchiveAll, onUpdateStatus, onClearSelection }) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-card border border-border rounded-lg shadow-elevation-xl p-4 z-[100] min-w-[320px] md:min-w-[480px]">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
            <span className="text-sm font-semibold text-primary">{selectedCount}</span>
          </div>
          <span className="text-sm font-medium text-foreground">
            {selectedCount} {selectedCount === 1 ? 'file' : 'files'} selected
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            iconName="Download"
            onClick={onDownloadAll}
            title="Download selected files"
          >
            Download
          </Button>
          <Button
            variant="outline"
            size="sm"
            iconName="Archive"
            onClick={onArchiveAll}
            title="Archive selected files"
          >
            Archive
          </Button>
          <Button
            variant="outline"
            size="sm"
            iconName="RefreshCw"
            onClick={onUpdateStatus}
            title="Update status"
          >
            Update
          </Button>
          <Button
            variant="ghost"
            size="sm"
            iconName="X"
            onClick={onClearSelection}
            title="Clear selection"
          />
        </div>
      </div>
    </div>
  );
};

export default BulkActionsBar;