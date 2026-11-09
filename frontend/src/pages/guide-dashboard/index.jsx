import React, { useCallback, useEffect, useRef, useState } from 'react';
import Header from '../../components/ui/Header';
import Button from '../../components/ui/Button';
import { apiFetch, fetchAllPages, fetchFacultyProjectProgress, fetchMentoredProjects, fetchProjectComments } from '../../utils/api';

const GuideDashboard = () => {
  const [projects, setProjects] = useState([]); const [selected, setSelected] = useState(null);
  const [progress, setProgress] = useState([]); const [requests, setRequests] = useState([]);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [commentSaving, setCommentSaving] = useState(false);
  const [commentError, setCommentError] = useState('');
  const [loading, setLoading] = useState(true); const [loadError, setLoadError] = useState('');
  const [progressError, setProgressError] = useState(''); const [requestError, setRequestError] = useState('');
  const [busyId, setBusyId] = useState(null); const [note, setNote] = useState('');
  const selectedRef = useRef(selected);
  const lastProjectIdRef = useRef(null);
  const loadGenerationRef = useRef(0);
  // Synchronize selectedRef before subsequent effects execute so stale-response guards see the latest selected project.
  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  const handleSelectProject = (project) => {
    setCommentText('');
    setSelected(project);
  };

  const loadProjects = useCallback(async () => {
    setLoading(true); setLoadError('');
    try { const data = await fetchMentoredProjects(); setProjects(data); setSelected(current => data.find(item => item.id === current?.id) || data[0] || null); }
    catch (error) { setLoadError(error.message || 'Could not load mentored projects.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { loadProjects(); }, [loadProjects]);

  useEffect(() => {
    setCommentText('');
  }, [selected?.id]);

  const loadProjectData = useCallback(async id => {
    if (selectedRef.current?.id !== id) {
      return;
    }
    if (!id) {
      lastProjectIdRef.current = null;
      setProgress([]);
      setRequests([]);
      setComments([]);
      return;
    }
    const generation = ++loadGenerationRef.current;
    if (lastProjectIdRef.current !== id) {
      lastProjectIdRef.current = id;
      setProgress([]);
      setRequests([]);
      setComments([]);
    }
    setProgressError(''); setRequestError(''); setCommentError('');
    try {
      const data = await fetchFacultyProjectProgress(id);
      if (selectedRef.current?.id === id && loadGenerationRef.current === generation) {
        setProgress(data);
      }
    } catch (error) {
      if (selectedRef.current?.id === id && loadGenerationRef.current === generation) {
        setProgressError(error.message || 'Could not load project progress.');
      }
    }
    try {
      const reqs = await fetchAllPages(`/join-requests/?project=${id}`);
      if (selectedRef.current?.id === id && loadGenerationRef.current === generation) {
        setRequests(reqs);
      }
    } catch (error) {
      if (selectedRef.current?.id === id && loadGenerationRef.current === generation) {
        setRequestError(error.message || 'Could not load join requests.');
      }
    }
    try {
      const c = await fetchProjectComments(id);
      if (selectedRef.current?.id === id && loadGenerationRef.current === generation) {
        setComments(c || []);
      }
    } catch (error) {
      if (selectedRef.current?.id === id && loadGenerationRef.current === generation) {
        setCommentError(error.message || 'Could not load comments.');
      }
    }
  }, []);
  useEffect(() => { loadProjectData(selected?.id); }, [selected?.id, loadProjectData]);
  const decide = async (requestId, decision) => {
    setBusyId(requestId); setRequestError('');
    try { await apiFetch(`/join-requests/${requestId}/${decision}/`, { method: 'POST', body: JSON.stringify({ note }) }); setNote(''); await loadProjectData(selected?.id); }
    catch (error) { setRequestError(error.message || 'Could not update the join request.'); }
    finally { setBusyId(null); }
  };
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !selected?.id) return;
    const targetProjectId = selected.id;
    const submittedText = commentText.trim();
    setCommentSaving(true);
    setCommentError('');
    let createdComment = null;
    try {
      createdComment = await apiFetch(`/faculty/projects/${targetProjectId}/comments/`, {
        method: 'POST',
        body: JSON.stringify({ comment_text: submittedText })
      });
      setCommentText('');
    } catch (err) {
      setCommentError(err.message || 'Could not post comment.');
      setCommentSaving(false);
      return;
    }

    try {
      if (createdComment && createdComment.id && selectedRef.current?.id === targetProjectId) {
        setComments(prev => [createdComment, ...prev.filter(c => c.id !== createdComment.id)]);
      }
      const updated = await fetchProjectComments(targetProjectId);
      if (selectedRef.current?.id === targetProjectId) {
        setComments(updated || []);
      }
    } catch (refreshErr) {
      // Refresh error handled separately so a successful POST remains reported as successful.
    } finally {
      setCommentSaving(false);
    }
  };
  return <div className="min-h-screen bg-background"><Header/><main className="mx-auto max-w-6xl space-y-6 p-6 pt-24"><h1 className="text-3xl font-bold">Mentored projects</h1>
    {loadError && <div role="alert" className="rounded border border-error p-4">{loadError} <Button onClick={loadProjects}>Retry</Button></div>}
    {loading ? <p role="status">Loading mentored projects…</p> : !loadError && projects.length === 0 ? <p className="rounded border p-6">No mentored projects yet.</p> : <div className="grid gap-6 md:grid-cols-[18rem_1fr]">
      <section className="space-y-2" aria-label="Projects">{projects.map(project => <button key={project.id} onClick={() => handleSelectProject(project)} className={`w-full rounded border p-3 text-left ${selected?.id === project.id ? 'border-primary bg-primary/5' : ''}`}><span className="block font-medium">{project.title}</span><span className="text-sm text-muted-foreground">{project.status}</span></button>)}</section>
      {selected && <section className="space-y-5"><div className="rounded border bg-card p-5"><h2 className="text-xl font-semibold">{selected.title}</h2><p className="mt-2">Status: {selected.status}</p><p className="text-sm"><span className="font-medium">Student:</span> {selected.student_name || '—'}</p>{selected.created_at && <p className="text-sm text-muted-foreground">Created {new Date(selected.created_at).toLocaleDateString()}</p>}</div>
        <section className="rounded border bg-card p-5"><h2 className="font-semibold">Latest progress</h2>{progressError ? <p role="alert">{progressError} <Button onClick={() => loadProjectData(selected.id)}>Retry</Button></p> : progress.length ? <p className="mt-2">{progress[0].percent_complete}% — {progress[0].steps_completed}</p> : <p className="mt-2">No progress updates yet.</p>}</section>
        <section className="space-y-3 rounded border bg-card p-5">
          <h2 className="font-semibold">Faculty comments</h2>
          {commentError && <p role="alert" className="text-sm text-error">{commentError}</p>}
          {comments.length ? (
            <ul className="divide-y text-sm">
              {comments.map((c) => (
                <li key={c.id} className="py-2">
                  <p className="whitespace-pre-wrap">{c.comment_text}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {c.created_at ? new Date(c.created_at).toLocaleString() : ''}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No comments yet.</p>
          )}
          <form onSubmit={handleAddComment} className="flex gap-2 pt-2">
            <input
              type="text"
              placeholder="Add a feedback comment for the team…"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              disabled={commentSaving}
              className="flex-1 rounded border bg-background px-3 py-2 text-sm"
            />
            <Button type="submit" disabled={commentSaving || !commentText.trim()}>
              {commentSaving ? 'Posting…' : 'Comment'}
            </Button>
          </form>
        </section>
        <section className="space-y-3 rounded border bg-card p-5"><h2 className="font-semibold">Join requests</h2>{requestError && <p role="alert" className="text-error">{requestError} <Button onClick={() => loadProjectData(selected.id)}>Retry</Button></p>}{requests.filter(request => request.status === 'PENDING').length ? requests.filter(request => request.status === 'PENDING').map(request => <div key={request.id} className="flex flex-wrap items-center gap-3 border-t py-3"><span className="mr-auto">Student #{request.student}</span><input aria-label="Optional decision note" value={note} onChange={event => setNote(event.target.value)} placeholder="Optional note" className="rounded border bg-background px-3 py-2"/><Button disabled={busyId !== null} onClick={() => decide(request.id, 'approve')}>{busyId === request.id ? 'Saving…' : 'Approve'}</Button><Button variant="outline" disabled={busyId !== null} onClick={() => decide(request.id, 'reject')}>{busyId === request.id ? 'Saving…' : 'Reject'}</Button></div>) : !requestError && <p>No pending join requests.</p>}</section>
      </section>}
    </div>}
  </main></div>;
};
export default GuideDashboard;
