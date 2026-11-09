import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/ui/Header';
import Breadcrumbs from '../../components/ui/Breadcrumbs';
import QuickActions from '../../components/ui/QuickActions';
import {
  apiFetch,
  fetchApprovedProjects,
  fetchStudentJoinRequests,
  fetchStudentProject,
  fetchStudentProgress,
  getUserEmail,
} from '../../utils/api';
import Button from '../../components/ui/Button';

const StudentDashboard = () => {
  const [project, setProject] = useState(null);
  const [progress, setProgress] = useState([]);
  const [approvedProjects, setApprovedProjects] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionNotice, setActionNotice] = useState('');

  // Progress update form state
  const [percentComplete, setPercentComplete] = useState('');
  const [stepsCompleted, setStepsCompleted] = useState('');
  const [submittingProgress, setSubmittingProgress] = useState(false);
  const [progressFormError, setProgressFormError] = useState('');

  // Join request state
  const [busyRequestId, setBusyRequestId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [nextProject, updates, approved, requests] = await Promise.all([
        fetchStudentProject(),
        fetchStudentProgress(),
        fetchApprovedProjects().catch(() => []),
        fetchStudentJoinRequests().catch(() => []),
      ]);
      setProject(nextProject);
      setProgress(updates || []);
      setApprovedProjects(approved || []);
      setJoinRequests(requests || []);
    } catch (err) {
      setError(err.message || 'Could not load your dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleProgressSubmit = async (e) => {
    e.preventDefault();
    if (!project?.id) return;
    const percentNum = Number(percentComplete);
    if (isNaN(percentNum) || percentNum < 0 || percentNum > 100) {
      setProgressFormError('Progress percentage must be between 0 and 100.');
      return;
    }
    if (!stepsCompleted.trim()) {
      setProgressFormError('Please describe the steps or work completed.');
      return;
    }
    setSubmittingProgress(true);
    setProgressFormError('');
    try {
      await apiFetch(`/projects/${project.id}/progress/`, {
        method: 'POST',
        body: JSON.stringify({
          percent_complete: percentNum,
          steps_completed: stepsCompleted.trim(),
        }),
      });
      setPercentComplete('');
      setStepsCompleted('');
      setActionNotice('Progress update recorded successfully.');
      try {
        const updates = await fetchStudentProgress();
        setProgress(updates || []);
      } catch (refreshErr) {
        setProgressFormError(refreshErr.message || 'Could not refresh progress list.');
      }
    } catch (err) {
      setProgressFormError(err.message || 'Could not submit progress update.');
    } finally {
      setSubmittingProgress(false);
    }
  };

  const handleRequestJoin = async (projectId) => {
    setBusyRequestId(`join-${projectId}`);
    setActionNotice('');
    setError('');
    try {
      await apiFetch('/join-requests/', {
        method: 'POST',
        body: JSON.stringify({ project: projectId }),
      });
      setActionNotice('Join request submitted.');
      const requests = await fetchStudentJoinRequests();
      setJoinRequests(requests || []);
    } catch (err) {
      setError(err.message || 'Could not submit join request.');
    } finally {
      setBusyRequestId(null);
    }
  };

  const handleCancelJoin = async (requestId) => {
    setBusyRequestId(`cancel-${requestId}`);
    setActionNotice('');
    setError('');
    try {
      await apiFetch(`/join-requests/${requestId}/cancel/`, {
        method: 'POST',
      });
      setActionNotice('Join request cancelled.');
      const requests = await fetchStudentJoinRequests();
      setJoinRequests(requests || []);
    } catch (err) {
      setError(err.message || 'Could not cancel join request.');
    } finally {
      setBusyRequestId(null);
    }
  };

  const latestProgress = progress[0]?.percent_complete ?? 0;
  const requestedProjectIds = new Set(joinRequests.filter((r) => r.status === 'PENDING').map((r) => r.project));

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-6xl space-y-6 p-6 pt-24">
        <Breadcrumbs />
        <h1 className="text-3xl font-bold">Student Dashboard</h1>
        <p>Welcome back, {getUserEmail() || 'Student'}</p>
        <QuickActions />

        {error && (
          <div role="alert" className="rounded border border-error p-4 text-error">
            {error} <Button variant="outline" onClick={load}>Retry</Button>
          </div>
        )}

        {actionNotice && (
          <p role="status" className="rounded border border-success p-3 text-success">
            {actionNotice}
          </p>
        )}

        {loading ? (
          <p role="status">Loading your dashboard…</p>
        ) : project ? (
          <section className="rounded-lg border bg-card p-6 space-y-3">
            <h2 className="text-2xl font-semibold">{project.title}</h2>
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <p><span className="font-medium">Status:</span> {project.status}</p>
              <p><span className="font-medium">Progress:</span> {latestProgress}%</p>
              <p><span className="font-medium">Student:</span> {project.student_name || '—'}</p>
              <p><span className="font-medium">Mentor:</span> {project.mentor_name || project.mentor_faculty || 'Not assigned'}</p>
            </div>
            {project.abstract && (
              <div className="rounded bg-muted/40 p-3 mt-3">
                <p className="text-xs font-medium text-muted-foreground uppercase">Abstract</p>
                <p className="mt-1 text-sm whitespace-pre-wrap">{project.abstract}</p>
              </div>
            )}
          </section>
        ) : (
          <section className="rounded-lg border bg-card p-8 text-center">
            <h2 className="text-xl font-semibold">No project yet</h2>
            <p className="mt-2 text-muted-foreground">Submit a project proposal or join an approved project to get started.</p>
            <Link
              to="/student-project-proposal-form"
              className="mt-4 inline-block text-primary underline"
            >
              Create project proposal
            </Link>
          </section>
        )}

        {/* Progress update submission form */}
        {!loading && project && (
          project.is_team_leader ? (
            <section className="rounded-lg border bg-card p-6 space-y-4">
              <h2 className="text-xl font-semibold">Submit Progress Update</h2>
              {progressFormError && (
                <p role="alert" className="text-sm text-error">{progressFormError}</p>
              )}
              <form onSubmit={handleProgressSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="percent-input" className="block text-sm font-medium">Percent Complete (0-100)</label>
                    <input
                      id="percent-input"
                      type="number"
                      min="0"
                      max="100"
                      value={percentComplete}
                      onChange={(e) => setPercentComplete(e.target.value)}
                      placeholder="e.g. 50"
                      disabled={submittingProgress}
                      className="mt-1 block w-full rounded border bg-background p-2 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="steps-input" className="block text-sm font-medium">Steps / Work Completed</label>
                  <textarea
                    id="steps-input"
                    rows={3}
                    value={stepsCompleted}
                    onChange={(e) => setStepsCompleted(e.target.value)}
                    placeholder="Describe recent milestones and progress…"
                    disabled={submittingProgress}
                    className="mt-1 block w-full rounded border bg-background p-2 text-sm"
                  />
                </div>
                <Button type="submit" disabled={submittingProgress || !percentComplete || !stepsCompleted.trim()}>
                  {submittingProgress ? 'Submitting…' : 'Submit Progress Update'}
                </Button>
              </form>
            </section>
          ) : (
            <section className="rounded-lg border bg-card p-6">
              <h2 className="text-xl font-semibold">Submit Progress Update</h2>
              <p className="mt-2 text-sm text-muted-foreground">Only the project team leader can submit progress updates.</p>
            </section>
          )
        )}

        {/* Recent progress updates list */}
        {!loading && project && (
          <section className="rounded-lg border bg-card p-6">
            <h2 className="text-xl font-semibold">Recent progress</h2>
            {progress.length ? (
              <ul className="mt-3 space-y-2">
                {progress.slice(0, 6).map((item) => (
                  <li key={item.id} className="border-b py-2 text-sm">
                    <span className="font-medium">{item.percent_complete}%</span> — {item.steps_completed}{' '}
                    <span className="text-xs text-muted-foreground">
                      {item.created_at ? new Date(item.created_at).toLocaleString() : ''}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">No progress updates yet.</p>
            )}
          </section>
        )}

        {/* My Join Requests */}
        {!loading && joinRequests.length > 0 && (
          <section className="rounded-lg border bg-card p-6">
            <h2 className="text-xl font-semibold">My Join Requests</h2>
            <ul className="mt-3 divide-y text-sm">
              {joinRequests.map((req) => (
                <li key={req.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <span className="font-medium">Project #{req.project}</span>
                    <span className="ml-3 text-xs text-muted-foreground">Status: {req.status}</span>
                    {req.review_note && (
                      <p className="mt-1 text-xs text-muted-foreground">Note: {req.review_note}</p>
                    )}
                  </div>
                  {req.status === 'PENDING' && (
                    <Button
                      variant="outline"
                      disabled={busyRequestId === `cancel-${req.id}`}
                      onClick={() => handleCancelJoin(req.id)}
                    >
                      {busyRequestId === `cancel-${req.id}` ? 'Cancelling…' : 'Cancel Request'}
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Approved Projects in Department */}
        {!loading && (
          <section className="rounded-lg border bg-card p-6">
            <h2 className="text-xl font-semibold">Approved Projects in Department</h2>
            <p className="text-xs text-muted-foreground mt-1">Explore approved projects or request to join a team.</p>
            {approvedProjects.length ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {approvedProjects.map((p) => (
                  <article key={p.id} className="rounded border bg-background p-4 space-y-2 text-sm">
                    <h3 className="font-semibold text-base">{p.title}</h3>
                    <p className="text-xs text-muted-foreground">Student: {p.student_name || '—'} · Mentor: {p.mentor_name || '—'}</p>
                    {p.abstract && (
                      <p className="text-xs text-muted-foreground line-clamp-3">{p.abstract}</p>
                    )}
                    {!project && (
                      <div className="pt-2">
                        {requestedProjectIds.has(p.id) ? (
                          <span className="text-xs text-muted-foreground italic">Request submitted</span>
                        ) : (
                          <Button
                            variant="outline"
                            disabled={busyRequestId === `join-${p.id}`}
                            onClick={() => handleRequestJoin(p.id)}
                          >
                            {busyRequestId === `join-${p.id}` ? 'Sending…' : 'Request to Join'}
                          </Button>
                        )}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">No approved projects in your department at this time.</p>
            )}
          </section>
        )}
      </main>
    </div>
  );
};

export default StudentDashboard;
