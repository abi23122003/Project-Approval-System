import React, { useCallback, useEffect, useState } from 'react';
import Header from '../../components/ui/Header';
import Button from '../../components/ui/Button';
import { apiFetch, fetchAllPages, fetchFacultyProjectProgress, fetchMentoredProjects } from '../../utils/api';

const GuideDashboard = () => {
  const [projects, setProjects] = useState([]); const [selected, setSelected] = useState(null);
  const [progress, setProgress] = useState([]); const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true); const [loadError, setLoadError] = useState('');
  const [progressError, setProgressError] = useState(''); const [requestError, setRequestError] = useState('');
  const [busyId, setBusyId] = useState(null); const [note, setNote] = useState('');
  const loadProjects = useCallback(async () => {
    setLoading(true); setLoadError('');
    try { const data = await fetchMentoredProjects(); setProjects(data); setSelected(current => data.find(item => item.id === current?.id) || data[0] || null); }
    catch (error) { setLoadError(error.message || 'Could not load mentored projects.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { loadProjects(); }, [loadProjects]);
  const loadProjectData = useCallback(async id => {
    if (!id) { setProgress([]); setRequests([]); return; }
    setProgressError(''); setRequestError('');
    try { const data = await fetchFacultyProjectProgress(id); setProgress(data); }
    catch (error) { setProgressError(error.message || 'Could not load project progress.'); }
    try { setRequests(await fetchAllPages(`/join-requests/?project=${id}`)); }
    catch (error) { setRequestError(error.message || 'Could not load join requests.'); }
  }, []);
  useEffect(() => { loadProjectData(selected?.id); }, [selected?.id, loadProjectData]);
  const decide = async (requestId, decision) => {
    setBusyId(requestId); setRequestError('');
    try { await apiFetch(`/join-requests/${requestId}/${decision}/`, { method: 'POST', body: JSON.stringify({ note }) }); setNote(''); await loadProjectData(selected?.id); }
    catch (error) { setRequestError(error.message || 'Could not update the join request.'); }
    finally { setBusyId(null); }
  };
  return <div className="min-h-screen bg-background"><Header/><main className="mx-auto max-w-6xl space-y-6 p-6 pt-24"><h1 className="text-3xl font-bold">Mentored projects</h1>
    {loadError && <div role="alert" className="rounded border border-error p-4">{loadError} <Button onClick={loadProjects}>Retry</Button></div>}
    {loading ? <p role="status">Loading mentored projects…</p> : !loadError && projects.length === 0 ? <p className="rounded border p-6">No mentored projects yet.</p> : <div className="grid gap-6 md:grid-cols-[18rem_1fr]">
      <section className="space-y-2" aria-label="Projects">{projects.map(project => <button key={project.id} onClick={() => setSelected(project)} className={`w-full rounded border p-3 text-left ${selected?.id === project.id ? 'border-primary bg-primary/5' : ''}`}><span className="block font-medium">{project.title}</span><span className="text-sm text-muted-foreground">{project.status}</span></button>)}</section>
      {selected && <section className="space-y-5"><div className="rounded border bg-card p-5"><h2 className="text-xl font-semibold">{selected.title}</h2><p className="mt-2">Status: {selected.status}</p>{selected.created_at && <p className="text-sm text-muted-foreground">Created {new Date(selected.created_at).toLocaleDateString()}</p>}</div>
        <section className="rounded border bg-card p-5"><h2 className="font-semibold">Latest progress</h2>{progressError ? <p role="alert">{progressError} <Button onClick={() => loadProjectData(selected.id)}>Retry</Button></p> : progress.length ? <p className="mt-2">{progress[0].percent_complete}% — {progress[0].steps_completed}</p> : <p className="mt-2">No progress updates yet.</p>}</section>
        <section className="space-y-3 rounded border bg-card p-5"><h2 className="font-semibold">Join requests</h2>{requestError && <p role="alert" className="text-error">{requestError} <Button onClick={() => loadProjectData(selected.id)}>Retry</Button></p>}{requests.filter(request => request.status === 'PENDING').length ? requests.filter(request => request.status === 'PENDING').map(request => <div key={request.id} className="flex flex-wrap items-center gap-3 border-t py-3"><span className="mr-auto">Student #{request.student}</span><input aria-label="Optional decision note" value={note} onChange={event => setNote(event.target.value)} placeholder="Optional note" className="rounded border bg-background px-3 py-2"/><Button disabled={busyId !== null} onClick={() => decide(request.id, 'approve')}>{busyId === request.id ? 'Saving…' : 'Approve'}</Button><Button variant="outline" disabled={busyId !== null} onClick={() => decide(request.id, 'reject')}>{busyId === request.id ? 'Saving…' : 'Reject'}</Button></div>) : !requestError && <p>No pending join requests.</p>}</section>
      </section>}
    </div>}
  </main></div>;
};
export default GuideDashboard;
