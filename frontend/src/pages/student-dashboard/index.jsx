import React, { useCallback, useEffect, useState } from 'react';
import Header from '../../components/ui/Header';
import Breadcrumbs from '../../components/ui/Breadcrumbs';
import QuickActions from '../../components/ui/QuickActions';
import { fetchStudentProject, fetchStudentProgress, getUserEmail } from '../../utils/api';
import Button from '../../components/ui/Button';

const StudentDashboard = () => {
  const [project, setProject] = useState(null);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { const [nextProject, updates] = await Promise.all([fetchStudentProject(), fetchStudentProgress()]); setProject(nextProject); setProgress(updates || []); }
    catch (err) { setError(err.message || 'Could not load your dashboard.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const latestProgress = progress[0]?.percent_complete ?? 0;
  return <div className="min-h-screen bg-background"><Header /><main className="mx-auto max-w-6xl space-y-6 p-6 pt-24"><Breadcrumbs /><h1 className="text-3xl font-bold">Student Dashboard</h1><p>Welcome back, {getUserEmail() || 'Student'}</p><QuickActions />
    {error && <div role="alert" className="rounded border border-error p-4">{error} <Button onClick={load}>Retry</Button></div>}
    {loading ? <p>Loading your dashboard…</p> : project ? <section className="rounded-lg border bg-card p-6"><h2 className="text-xl font-semibold">{project.title}</h2><p className="mt-2">Status: {project.status}</p><p>Progress: {latestProgress}%</p><p className="mt-3 whitespace-pre-wrap">{project.abstract}</p><p className="mt-3">Guide: {project.mentor_faculty ?? 'Not assigned'}</p></section> : <section className="rounded-lg border bg-card p-8 text-center"><h2 className="text-xl font-semibold">No project yet</h2><p className="mt-2">Progress: 0%</p><p className="mt-2">Submit a project proposal to get started.</p><a className="mt-4 inline-block text-primary underline" href="/student-project-proposal-form">Create project proposal</a></section>}
    {!loading && project && <section className="rounded-lg border bg-card p-6"><h2 className="text-xl font-semibold">Recent progress</h2>{progress.length ? <ul className="mt-3 space-y-2">{progress.slice(0, 6).map(item => <li key={item.id} className="border-b py-2">{item.percent_complete}% — {item.steps_completed} <span className="text-sm text-muted-foreground">{item.created_at ? new Date(item.created_at).toLocaleString() : ''}</span></li>)}</ul> : <p className="mt-2">No progress updates yet.</p>}</section>}
  </main></div>;
};
export default StudentDashboard;
