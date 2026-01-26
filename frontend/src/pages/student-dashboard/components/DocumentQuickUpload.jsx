import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';

const DocumentQuickUpload = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const handleDragOver = (e) => {
    e?.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e?.preventDefault();
    setIsDragging(false);
    const files = Array.from(e?.dataTransfer?.files);
    handleFiles(files);
  };

  const handleFileInput = (e) => {
    const files = Array.from(e?.target?.files);
    handleFiles(files);
  };

  const handleFiles = (files) => {
    const newFiles = files?.map(file => ({
      name: file?.name,
      size: (file?.size / 1024)?.toFixed(2) + ' KB',
      type: file?.type,
      uploadProgress: 0
    }));
    setUploadedFiles(prev => [...prev, ...newFiles]);

    newFiles?.forEach((file, index) => {
      simulateUpload(uploadedFiles?.length + index);
    });
  };

  const simulateUpload = (fileIndex) => {
    const interval = setInterval(() => {
      setUploadedFiles(prev => {
        const updated = [...prev];
        if (updated?.[fileIndex]) {
          updated[fileIndex].uploadProgress += 10;
          if (updated?.[fileIndex]?.uploadProgress >= 100) {
            clearInterval(interval);
          }
        }
        return updated;
      });
    }, 200);
  };

  const removeFile = (index) => {
    setUploadedFiles(prev => prev?.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 md:p-6 shadow-elevation-sm">
      <h3 className="text-base md:text-lg font-heading font-semibold text-foreground mb-4">
        Quick Upload
      </h3>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-6 md:p-8 text-center transition-smooth ${
          isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
        }`}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Icon name="Upload" size={24} color="var(--color-primary)" />
          </div>
          <div>
            <p className="text-sm md:text-base font-medium text-foreground mb-1">
              Drop files here or click to browse
            </p>
            <p className="text-xs md:text-sm text-muted-foreground">
              PDF, DOC, DOCX up to 10MB
            </p>
          </div>
          <input
            type="file"
            multiple
            onChange={handleFileInput}
            className="hidden"
            id="file-upload"
            accept=".pdf,.doc,.docx"
          />
          <label
            htmlFor="file-upload"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-smooth cursor-pointer text-sm font-medium"
          >
            Select Files
          </label>
        </div>
      </div>
      {uploadedFiles?.length > 0 && (
        <div className="mt-4 space-y-2">
          {uploadedFiles?.map((file, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Icon name="FileText" size={20} color="var(--color-foreground)" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {file?.name}
                </p>
                <p className="text-xs text-muted-foreground">{file?.size}</p>
                {file?.uploadProgress < 100 && (
                  <div className="w-full h-1 bg-border rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${file?.uploadProgress}%` }}
                    />
                  </div>
                )}
              </div>
              {file?.uploadProgress === 100 ? (
                <Icon name="CheckCircle" size={20} color="var(--color-success)" />
              ) : (
                <button
                  onClick={() => removeFile(index)}
                  className="p-1 hover:bg-background rounded transition-smooth"
                >
                  <Icon name="X" size={16} color="var(--color-muted-foreground)" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentQuickUpload;