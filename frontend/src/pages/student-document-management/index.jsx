import React, { useCallback, useEffect, useState } from 'react';
import Header from '../../components/ui/Header';
import Breadcrumbs from '../../components/ui/Breadcrumbs';
import Button from '../../components/ui/Button';
import { decodeJwtPayload, getAccessToken, apiFetch, fetchStudentProject, fetchStudentProgress } from '../../utils/api';
import UploadZone from './components/UploadZone';

const StudentDocumentManagement = () => {
  const [project, setProject] = useState(null);
  const [progress, setProgress] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { const [currentProject, updates] = await Promise.all([fetchStudentProject(), fetchStudentProgress()]); setProject(currentProject); setProgress(updates || []); setDocuments((updates || []).flatMap(update => update.documents || []).map(file => ({ ...file, fileName: file.original_filename, fileSize: file.byte_size }))); }
    catch (err) { setError(err.message || 'Could not load document data.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const download = async file => {
    let url;
    try {
      const blob = await apiFetch(`/documents/${file.id}/download/`, { responseType: "blob" });
      url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url; link.download = file.fileName; link.click();
    } catch (err) { setError(err?.message || 'Could not download the document. Please try again.'); }
    finally { if (url) setTimeout(() => URL.revokeObjectURL(url), 1000); }
  };
  return <div className="min-h-screen bg-background"><Header /><main className="mx-auto max-w-5xl space-y-6 p-6 pt-24"><Breadcrumbs /><div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-3xl font-bold">Document management</h1><p className="mt-1 text-muted-foreground">Upload and download documents for your approved project.</p></div><Button disabled={project?.status !== 'APPROVED' || project?.team_leader_student !== decodeJwtPayload(getAccessToken())?.user_id} onClick={() => setShowUpload(value => !value)}>Upload files</Button></div>
    {error && <div role="alert" className="rounded border border-error p-4">{error} <Button onClick={load}>Retry</Button></div>}
    {loading ? <p>Loading documents…</p> : <>
      {showUpload && <UploadZone project={project} latestPercent={progress[0]?.percent_complete ?? 0} category="Supporting Materials" onUpload={item => setDocuments(previous => [...previous, item])} />}
      <section className="rounded-lg border bg-card p-6"><h2 className="text-xl font-semibold">Project documents</h2>{documents.length ? <ul className="mt-3 space-y-2">{documents.map((file, index) => <li key={`${index}-${file.fileName}`} className="border-b py-2">{file.fileName} — {(file.fileSize / 1024).toFixed(1)} KB {file.downloadable && <Button onClick={() => download(file)}>Download</Button>}</li>)}</ul> : <p className="mt-3">No documents yet</p>}</section>
      {project && <section className="rounded-lg border bg-card p-6"><h2 className="text-xl font-semibold">Progress updates</h2>{progress.length ? <ul className="mt-3 space-y-2">{progress.map(item => <li key={item.id} className="border-b py-2">{item.percent_complete}% — {item.steps_completed}</li>)}</ul> : <p className="mt-3">No progress updates yet</p>}</section>}
    </>}
  </main></div>;
};
export default StudentDocumentManagement;
