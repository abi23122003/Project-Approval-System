import React, { useEffect, useRef, useState } from 'react';
import { apiFetch, fetchApprovedProjects, fetchStudentJoinRequests, fetchAllPages, getAccessToken, decodeJwtPayload } from '../../../utils/api';
import Button from '../../../components/ui/Button';

export default function TeamProjects({ project }) {
  const [projects, setProjects] = useState([]);
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [incoming, setIncoming] = useState([]);
  const latestLoad = useRef(0);
  const userId = decodeJwtPayload(getAccessToken())?.user_id;
  const load = async () => {
    const requestId = ++latestLoad.current;
    setLoading(true); setLoaded(false); setError('');
    try {
      const [available, mine, pending] = await Promise.all([
        fetchApprovedProjects(),
        fetchStudentJoinRequests(),
        project?.team_leader_student === userId ? fetchAllPages('/join-requests/') : Promise.resolve([]),
      ]);
      if (requestId !== latestLoad.current) return;
      setProjects(available);
      setRequests(mine);
      setIncoming(pending.filter(item => item.project === project?.id && item.student !== userId));
      setLoaded(true);
    } catch (err) { if (requestId === latestLoad.current) setError(err.message); }
    finally { if (requestId === latestLoad.current) setLoading(false); }
  };
  useEffect(() => {
    load();
    return () => { latestLoad.current += 1; };
  }, [project?.id, project?.team_leader_student, userId]);
  const act = async path => {
    setBusy(true); setError('');
    try { await apiFetch(path, { method: 'POST', body: JSON.stringify({}) }); await load(); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  const join = async id => {
    setBusy(true); setError('');
    try { await apiFetch('/join-requests/', { method: 'POST', body: JSON.stringify({ project: id }) }); await load(); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  return <section className="space-y-3 rounded border bg-card p-6"><h2 className="text-xl font-semibold">Project teams</h2>{error && <p role="alert">{error}<Button disabled={loading} onClick={load}>Retry</Button></p>}{loading && <p>Loading project teams…</p>}
    {!project && projects.map(item => <div key={item.id} className="flex justify-between border-b py-2"><span>{item.title}</span><Button disabled={loading || busy || requests.some(r => r.project === item.id && r.status === 'PENDING')} onClick={() => join(item.id)}>Request to join</Button></div>)}
    {requests.map(item => <div key={item.id}>Project #{item.project}: {item.status} {item.status === 'PENDING' && <Button disabled={loading || busy} onClick={() => act(`/join-requests/${item.id}/cancel/`)}>Cancel request</Button>}</div>)}
    {incoming.filter(item => item.status === 'PENDING').map(item => <div key={item.id} className="flex gap-2"><span>Join request from {item.student_name}</span><Button disabled={loading || busy} onClick={() => act(`/join-requests/${item.id}/approve/`)}>Approve</Button><Button disabled={loading || busy} onClick={() => act(`/join-requests/${item.id}/reject/`)}>Reject</Button></div>)}
    {!project && loaded && !loading && !projects.length && <p>No approved projects available in your department.</p>}
  </section>;
}
