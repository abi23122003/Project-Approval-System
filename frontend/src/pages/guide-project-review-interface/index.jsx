import React, { useCallback, useEffect, useState } from 'react';
import Header from '../../components/ui/Header';
import Button from '../../components/ui/Button';
import { apiFetch, fetchAllPages } from '../../utils/api';

const ReviewQueue = () => {
  const [queue, setQueue] = useState([]); const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const [reason, setReason] = useState(''); const [decision, setDecision] = useState('APPROVE');
  const [saving, setSaving] = useState(false); const [result, setResult] = useState(null);
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { const items = await fetchAllPages('/faculty/projects/review-queue/'); setQueue(items); setSelectedId(current => items.some(item => item.id === current) ? current : items[0]?.id ?? null); }
    catch (err) { setError(err.message || 'Could not load the review queue.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const selected = queue.find(project => project.id === selectedId);
  const submit = async event => {
    event.preventDefault(); setError(''); setResult(null);
    if (decision === 'REJECT' && !reason.trim()) { setError('A reason is required when rejecting a project.'); return; }
    setSaving(true);
    try {
      const response = await apiFetch(`/faculty/projects/${selectedId}/review/`, { method: 'POST', body: JSON.stringify({ decision, reason: reason.trim() }) });
      setResult(response); setReason(''); await load();
    } catch (err) { setError(err.message || 'Could not submit the review.'); }
    finally { setSaving(false); }
  };
  return <div className="min-h-screen bg-background"><Header/><main className="mx-auto max-w-6xl space-y-6 p-6 pt-24"><h1 className="text-3xl font-bold">Faculty review queue</h1>
    {error && <div role="alert" className="rounded border border-error p-4 text-error">{error} <Button variant="outline" onClick={load} disabled={loading || saving}>Retry</Button></div>}
    {result && <div role="status" className="rounded border border-success p-4"><p>Decision recorded. Stage: {result.stage ?? '—'}; remaining stages: {result.remaining_stages ?? '—'}; awaiting HOD: {result.awaiting_hod ? 'Yes' : 'No'}; project status: {result.project_status || '—'}.</p></div>}
    {loading ? <p role="status">Loading review queue…</p> : !error && queue.length === 0 ? <p className="rounded border p-6">No projects are awaiting your review.</p> : <div className="grid gap-6 md:grid-cols-[18rem_1fr]"><nav className="space-y-2" aria-label="Review queue">{queue.map(project => <button key={project.id} onClick={() => setSelectedId(project.id)} className={`w-full rounded border p-3 text-left ${selectedId === project.id ? 'border-primary bg-primary/5' : ''}`}><span className="block font-medium">{project.title}</span><span className="text-sm text-muted-foreground">{project.status}</span></button>)}</nav>{selected && <section className="space-y-5 rounded border bg-card p-5"><h2 className="text-xl font-semibold">{selected.title}</h2><p>Status: {selected.status}</p><p>Project #{selected.id}</p><form onSubmit={submit} className="space-y-4 border-t pt-4"><label className="block text-sm font-medium">Decision<select value={decision} onChange={event => setDecision(event.target.value)} disabled={saving} className="mt-1 block w-full rounded border bg-background p-2"><option value="APPROVE">Approve</option><option value="REJECT">Reject</option></select></label><label className="block text-sm font-medium">Reason {decision === 'REJECT' ? '(required)' : '(optional)'}<textarea value={reason} onChange={event => setReason(event.target.value)} disabled={saving} rows={4} className="mt-1 block w-full rounded border bg-background p-2" /></label><Button type="submit" disabled={saving || !selected}>{saving ? 'Submitting…' : 'Submit decision'}</Button></form></section>}</div>}
  </main></div>;
};
export default ReviewQueue;
