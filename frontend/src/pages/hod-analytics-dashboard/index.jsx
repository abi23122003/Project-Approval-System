import React, { useCallback, useEffect, useState } from 'react';
import Header from '../../components/ui/Header';
import Button from '../../components/ui/Button';
import { apiFetch, fetchHodApprovals, fetchHodFaculty, fetchHodProjects } from '../../utils/api';

const HODAnalyticsDashboard = () => {
  const [projects, setProjects] = useState([]); const [faculty, setFaculty] = useState([]);
  const [approvals, setApprovals] = useState([]); const [loading, setLoading] = useState(true);
  const [error, setError] = useState(''); const [busyId, setBusyId] = useState(null);
  const [reasons, setReasons] = useState({}); const [notice, setNotice] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [pending, decisions, members] = await Promise.all([fetchHodProjects(), fetchHodApprovals(), fetchHodFaculty()]);
      const ids = [...new Set([...(pending || []).map(item => item.id), ...(decisions || []).map(item => item.project)])];
      const details = await Promise.all(ids.map(id => apiFetch(`/hod/projects/${id}/`)));
      setProjects(details); setApprovals(decisions || []); setFaculty(members || []);
    } catch (err) { setError(err.message || 'Could not load department data.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const decide = async (projectId, decision) => {
    const reason = (reasons[projectId] || '').trim();
    if (decision === 'REJECT' && !reason) { setError('A reason is required when rejecting a project.'); return; }
    setBusyId(projectId); setError(''); setNotice('');
    try { await apiFetch(`/hod/projects/${projectId}/decision/`, { method: 'POST', body: JSON.stringify({ decision, reason }) }); setNotice('Decision recorded.'); await load(); }
    catch (err) { setError(err.message || 'Could not record the HOD decision.'); }
    finally { setBusyId(null); }
  };
  const counts = { total: projects.length, pending: projects.filter(item => ['SUBMITTED', 'UNDER_REVIEW'].includes(item.status)).length, approved: projects.filter(item => item.status === 'APPROVED').length, rejected: projects.filter(item => item.status === 'REJECTED').length };
  return <div className="min-h-screen bg-background"><Header/><main className="mx-auto max-w-6xl space-y-6 p-6 pt-24"><h1 className="text-3xl font-bold">Department projects</h1>
    {error && <div role="alert" className="rounded border border-error p-4 text-error">{error} <Button variant="outline" disabled={loading || busyId !== null} onClick={load}>Retry</Button></div>}{notice && <p role="status" className="rounded border border-success p-3">{notice}</p>}
    {loading ? <p role="status">Loading department data…</p> : <>
      <section className="grid gap-3 sm:grid-cols-4">{[['Total projects', counts.total], ['Pending', counts.pending], ['Approved', counts.approved], ['Rejected', counts.rejected]].map(([label, count]) => <div key={label} className="rounded border bg-card p-4"><p className="text-sm text-muted-foreground">{label}</p><p className="text-2xl font-semibold">{count}</p></div>)}</section>
      <section className="space-y-3"><h2 className="text-xl font-semibold">Projects awaiting a decision</h2>{projects.filter(project => ['SUBMITTED', 'UNDER_REVIEW'].includes(project.status)).length ? projects.filter(project => ['SUBMITTED', 'UNDER_REVIEW'].includes(project.status)).map(project => <article key={project.id} className="space-y-3 rounded border bg-card p-5"><h3 className="font-semibold">{project.title}</h3><p>Status: {project.status}</p><label className="block text-sm">Reason (required for rejection)<textarea value={reasons[project.id] || ''} onChange={event => setReasons(previous => ({ ...previous, [project.id]: event.target.value }))} disabled={busyId === project.id} rows={2} className="mt-1 block w-full rounded border bg-background p-2" /></label><div className="flex gap-2"><Button disabled={busyId !== null} onClick={() => decide(project.id, 'APPROVE')}>{busyId === project.id ? 'Saving…' : 'Approve'}</Button><Button variant="outline" disabled={busyId !== null || !(reasons[project.id] || '').trim()} onClick={() => decide(project.id, 'REJECT')}>{busyId === project.id ? 'Saving…' : 'Reject'}</Button></div></article>) : <p className="rounded border p-5">No projects are awaiting your decision.</p>}</section>
      <section className="rounded border bg-card p-5"><h2 className="text-xl font-semibold">Faculty in your department</h2>{faculty.length ? <ul className="mt-3 divide-y">{faculty.map(member => <li key={member.id} className="py-3"><p className="font-medium">{`${member.first_name || ''} ${member.last_name || ''}`.trim() || member.username}</p><p className="text-sm text-muted-foreground">{member.email}</p></li>)}</ul> : <p className="mt-3">No active faculty found.</p>}</section>
      <section className="rounded border bg-card p-5"><h2 className="text-xl font-semibold">Latest HOD decisions</h2>{approvals.length ? <ul className="mt-3 divide-y">{approvals.slice(0, 10).map((item, index) => <li key={item.id || index} className="py-2">Project #{item.project}: {item.decision} {item.reason ? `— ${item.reason}` : ''}</li>)}</ul> : <p className="mt-3">No HOD decisions recorded.</p>}</section>
    </>}
  </main></div>;
};
export default HODAnalyticsDashboard;
