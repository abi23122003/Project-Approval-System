import React, { useRef, useState } from 'react';
import Button from '../../../components/ui/Button';
import { apiFetch } from '../../../utils/api';

const extensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.zip', '.rar'];
const MAX_SIZE = 26214400;

const UploadZone = ({ onUpload, category, project, latestPercent = 0, onError }) => {
  const inputRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [recorded, setRecorded] = useState([]);
  const [busy, setBusy] = useState(false);
  const canUpload = project?.status === 'APPROVED';
  const handleFiles = async fileList => {
    const accepted = [];
    const rejected = [];
    Array.from(fileList || []).forEach(file => {
      const ext = `.${file.name.split('.').pop().toLowerCase()}`;
      if (!extensions.includes(ext)) rejected.push(`${file.name}: unsupported file type. Allowed: ${extensions.join(', ')}.`);
      else if (file.size > MAX_SIZE) rejected.push(`${file.name}: exceeds the 25 MB size limit.`);
      else accepted.push(file);
    });
    setMessages(rejected);
    if (!canUpload || !accepted.length) return;
    setBusy(true);
    try {
      const update = await apiFetch(`/projects/${project.id}/progress/`, { method: 'POST', body: JSON.stringify({ percent_complete: Number(latestPercent) || 0, steps_completed: `Document upload: ${accepted.length} file(s)` }) });
      for (const file of accepted) {
        try {
          await apiFetch(`/progress-updates/${update.id}/documents/`, { method: 'POST', body: JSON.stringify({ original_filename: file.name, mime_type: file.type || 'application/octet-stream', byte_size: file.size, storage_path: file.name }) });
          const item = { fileName: file.name, fileSize: file.size, category };
          setRecorded(previous => [...previous, item]);
          onUpload?.(item);
        } catch (error) { rejected.push(`${file.name}: ${error.message}`); }
      }
      setMessages(rejected);
    } catch (error) { setMessages([error.message || 'Could not record file details.']); onError?.(error); }
    finally { setBusy(false); if (inputRef.current) inputRef.current.value = ''; }
  };
  return <div className="space-y-4"><p className="rounded border border-primary/20 bg-primary/5 p-3 text-sm">File details are recorded; file storage is not connected yet, so file contents are not saved.</p>
    {!canUpload && <p className="rounded border p-3 text-sm">Uploads are available once your project is approved.</p>}
    <div className="rounded-lg border-2 border-dashed p-8 text-center"><p className="mb-2 font-medium">Choose files to record</p><p className="mb-4 text-sm text-muted-foreground">PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, ZIP, RAR · Maximum 25 MB</p><input ref={inputRef} type="file" multiple accept={extensions.join(',')} disabled={!canUpload || busy} onChange={event => handleFiles(event.target.files)} /><Button disabled={!canUpload || busy} onClick={() => inputRef.current?.click()}>{busy ? 'Recording…' : 'Browse Files'}</Button></div>
    {messages.length > 0 && <ul role="alert" className="space-y-1 text-sm text-error">{messages.map((message, index) => <li key={`${index}-${message}`}>{message}</li>)}</ul>}
    {recorded.map((file, index) => <p key={`${index}-${file.fileName}`} className="text-sm">{file.fileName} — Recorded</p>)}
  </div>;
};
export default UploadZone;
