import React, { useState, useRef } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const UploadZone = ({ onUpload, category }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState([]);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e?.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e?.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e?.preventDefault();
    setIsDragging(false);
    const files = Array.from(e?.dataTransfer?.files);
    handleFiles(files);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e?.target?.files);
    handleFiles(files);
  };

  const handleFiles = (files) => {
    const validFiles = files?.filter(file => {
      const validFormats = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.zip', '.rar'];
      const extension = '.' + file?.name?.split('.')?.pop()?.toLowerCase();
      return validFormats?.includes(extension);
    });

    if (validFiles?.length !== files?.length) {
      alert('Some files were skipped due to invalid format. Supported formats: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, ZIP, RAR');
    }

    validFiles?.forEach((file, index) => {
      const uploadId = Date.now() + index;
      setUploadProgress(prev => [...prev, {
        id: uploadId,
        name: file?.name,
        progress: 0,
        status: 'uploading'
      }]);

      simulateUpload(uploadId, file);
    });
  };

  const simulateUpload = (uploadId, file) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 30;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setUploadProgress(prev => prev?.map(item =>
          item?.id === uploadId ? { ...item, progress: 100, status: 'completed' } : item
        ));
        
        setTimeout(() => {
          setUploadProgress(prev => prev?.filter(item => item?.id !== uploadId));
          onUpload({
            fileName: file?.name,
            fileSize: file?.size,
            category: category,
            uploadDate: new Date()?.toISOString()
          });
        }, 1000);
      } else {
        setUploadProgress(prev => prev?.map(item =>
          item?.id === uploadId ? { ...item, progress: Math.floor(progress) } : item
        ));
      }
    }, 300);
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-smooth ${
          isDragging
            ? 'border-primary bg-primary/5' :'border-border hover:border-primary/50'
        }`}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Icon name="Upload" size={32} color="var(--color-primary)" />
          </div>
          <div>
            <h3 className="text-lg font-heading font-semibold text-foreground mb-2">
              Drop files here or click to upload
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Supported formats: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, ZIP, RAR
            </p>
            <p className="text-xs text-muted-foreground">
              Maximum file size: 50MB per file
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar"
          />
          <Button
            variant="default"
            iconName="FolderOpen"
            iconPosition="left"
            onClick={() => fileInputRef?.current?.click()}
          >
            Browse Files
          </Button>
        </div>
      </div>
      {uploadProgress?.length > 0 && (
        <div className="space-y-2">
          {uploadProgress?.map((upload) => (
            <div key={upload?.id} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Icon name="File" size={16} color="var(--color-foreground)" />
                  <span className="text-sm font-medium text-foreground truncate">
                    {upload?.name}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground ml-2">
                  {upload?.progress}%
                </span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-smooth"
                  style={{ width: `${upload?.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UploadZone;