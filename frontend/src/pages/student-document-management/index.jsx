import React, { useCallback, useEffect, useState } from 'react';
import Header from '../../components/ui/Header';
import Breadcrumbs from '../../components/ui/Breadcrumbs';
import Button from '../../components/ui/Button';
import { fetchStudentDocuments, fetchStudentProject, fetchStudentProgress } from '../../utils/api';
import UploadZone from './components/UploadZone';

const StudentDocumentManagement = () => {
  const [project, setProject] = useState(null);
  const [progress, setProgress] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUpload, setShowUpload] = useState(false);

  const refreshDocuments = useCallback(async () => {
    setError('');
    try {
      const [updates, docs] = await Promise.all([
        fetchStudentProgress(),
        fetchStudentDocuments().catch((err) => {
          if (err?.status === 404 || err?.status === 403) return [];
          throw err;
        }),
      ]);
      setProgress(updates || []);
      setDocuments(docs || []);
    } catch (err) {
      setError(err.message || 'Could not load document data.');
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [currentProject, updates, docs] = await Promise.all([
        fetchStudentProject(),
        fetchStudentProgress(),
        fetchStudentDocuments().catch((err) => {
          if (err?.status === 404 || err?.status === 403) return [];
          throw err;
        }),
      ]);
      setProject(currentProject);
      setProgress(updates || []);
      setDocuments(docs || []);
    } catch (err) {
      setError(err.message || 'Could not load document data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-5xl space-y-6 p-6 pt-24">
        <Breadcrumbs />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Document management</h1>
            <p className="mt-1 text-muted-foreground">Record document details for your approved project.</p>
          </div>
          <Button
            disabled={project?.status !== 'APPROVED'}
            onClick={() => setShowUpload(value => !value)}
          >
            {showUpload ? 'Close upload' : 'Record files'}
          </Button>
        </div>

        {error && (
          <div role="alert" className="rounded border border-error p-4 text-error">
            {error} <Button variant="outline" onClick={load}>Retry</Button>
          </div>
        )}

        {loading ? (
          <p role="status">Loading documents…</p>
        ) : (
          <>
            {showUpload && (
              <UploadZone
                project={project}
                progressUpdates={progress}
                onUpload={refreshDocuments}
              />
            )}
            <section className="rounded-lg border bg-card p-6">
              <h2 className="text-xl font-semibold">Recorded file details</h2>
              {documents.length ? (
                <ul className="mt-3 space-y-2">
                  {documents.map((doc) => (
                    <li key={doc.id || doc.original_filename} className="border-b py-2 text-sm flex justify-between items-center">
                      <span className="font-medium">{doc.original_filename}</span>
                      <span className="text-xs text-muted-foreground">
                        {((doc.byte_size || 0) / 1024).toFixed(1)} KB · {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleString() : 'Recorded'}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">No documents recorded yet.</p>
              )}
            </section>
            {project && (
              <section className="rounded-lg border bg-card p-6">
                <h2 className="text-xl font-semibold">Progress updates</h2>
                {progress.length ? (
                  <ul className="mt-3 space-y-2">
                    {progress.map((item) => (
                      <li key={item.id} className="border-b py-2 text-sm">
                        <span className="font-medium">{item.percent_complete}%</span> — {item.steps_completed}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">No progress updates yet.</p>
                )}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default StudentDocumentManagement;
