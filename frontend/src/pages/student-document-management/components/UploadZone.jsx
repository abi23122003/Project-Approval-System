import React, { useState, useRef, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { apiFetch, fetchStudentProject } from '../../../utils/api';

const UploadZone = ({ onUpload, category }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [projectId, setProjectId] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchStudentProject().then(proj => {
      if (proj && proj.id) setProjectId(proj.id);
    }).catch(err => console.error("Failed to fetch project ID:", err));
  }, []);

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

    if (validFiles.length === 0) return;

    if (!projectId) {
      alert('No active project found');
      return;
    }

    const uploadFiles = async () => {
      try {
        const progressResp = await apiFetch(`/projects/${projectId}/progress/`, {
          method: 'POST',
          body: JSON.stringify({ percent_complete: 0, steps_completed: `Batch document upload (${validFiles.length} files)` })
        });

        await Promise.all(validFiles.map(async (file, index) => {
          const uploadId = Date.now() + index;
          setUploadProgress(prev => [...prev, {
            id: uploadId,
            name: file?.name,
            progress: 50,
            status: 'uploading'
          }]);

          try {
            await apiFetch(`/progress-updates/${progressResp.id}/documents/`, {
              method: 'POST',
              body: JSON.stringify({
                storage_path: file.name,
                original_filename: file.name,
                mime_type: file.type || 'application/octet-stream',
                byte_size: file.size
              })
            });

            setUploadProgress(prev => prev?.map(item =>
              item?.id === uploadId ? { ...item, progress: 100, status: 'completed' } : item
            ));

            const newFile = {
              fileName: file.name,
              fileSize: file.size,
              uploadDate: new Date().toISOString()
            };

            setUploadedFiles(prev => [...prev, newFile]);
            
            if (onUpload) {
              onUpload({
                ...newFile,
                category: category
              });
            }

            setTimeout(() => {
              setUploadProgress(prev => prev?.filter(item => item?.id !== uploadId));
            }, 3000);
          } catch (err) {
            setUploadProgress(prev => prev?.map(item =>
              item?.id === uploadId ? { ...item, status: 'error', error: err.message || 'Upload failed' } : item
            ));
          }
        }));
      } catch (err) {
        alert('Failed to initialize batch upload: ' + err.message);
      }
    };
    
    uploadFiles();
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
            <div key={upload?.id} className={`bg-card border rounded-lg p-4 ${upload?.status === 'error' ? 'border-error/50 bg-error/5' : 'border-border'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Icon name="File" size={16} color={upload?.status === 'error' ? 'var(--color-error)' : 'var(--color-foreground)'} />
                  <span className={`text-sm font-medium truncate ${upload?.status === 'error' ? 'text-error' : 'text-foreground'}`}>
                    {upload?.name}
                  </span>
                </div>
                {upload?.status === 'uploading' && (
                  <span className="text-xs text-muted-foreground ml-2">
                    {upload?.progress}%
                  </span>
                )}
                {upload?.status === 'completed' && (
                  <span className="text-xs text-success ml-2 font-medium">
                    Success
                  </span>
                )}
              </div>
              
              {upload?.status === 'error' ? (
                <p className="text-xs text-error mt-1">{upload?.error}</p>
              ) : (
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-smooth"
                    style={{ width: `${upload?.progress}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {uploadedFiles?.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-foreground mb-3">Recently Uploaded</h4>
          <div className="space-y-2">
            {uploadedFiles?.map((file, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded border border-border">
                <div className="flex items-center gap-3">
                  <Icon name="CheckCircle" size={16} color="var(--color-success)" />
                  <span className="text-sm text-foreground">{file?.fileName}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  <span>{(file?.fileSize / 1024).toFixed(1)} KB</span>
                  <span className="mx-2">•</span>
                  <span>{new Date(file?.uploadDate).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadZone;