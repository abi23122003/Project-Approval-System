import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/ui/Sidebar';
import Header from '../../components/ui/Header';
import Footer from '../../components/ui/Footer';
import MetricCard from './components/MetricCard';
import DepartmentOverview from './components/DepartmentOverview';
import PerformanceChart from './components/PerformanceChart';
import FacultyPerformance from './components/FacultyPerformance';
import ResourceAllocation from './components/ResourceAllocation';
import StudentAnalytics from './components/StudentAnalytics';
import RecentActivities from './components/RecentActivities';
import QuickActions from './components/QuickActions';
import Icon from '../../components/AppIcon';
import {
  apiFetch,
  fetchHodProjects,
  fetchHodApprovals,
  fetchHodProgress,
  fetchFacultyList,
  isDemoSession,
} from '../../utils/api';

// ─── Static / demo data that stays constant ───────────────────────────────────

const RESOURCE_ALLOCATION = [
  { name: 'Research', value: 35 },
  { name: 'Infrastructure', value: 25 },
  { name: 'Faculty Development', value: 20 },
  { name: 'Student Programs', value: 15 },
  { name: 'Administration', value: 5 },
];

const BUDGET_BREAKDOWN = [
  { category: 'Research & Development', amount: 840000, percentage: 35, status: 'on-track', statusLabel: 'On Track' },
  { category: 'Infrastructure & Equipment', amount: 600000, percentage: 25, status: 'on-track', statusLabel: 'On Track' },
  { category: 'Faculty Development', amount: 480000, percentage: 20, status: 'warning', statusLabel: 'Review Needed' },
  { category: 'Student Programs', amount: 360000, percentage: 15, status: 'on-track', statusLabel: 'On Track' },
  { category: 'Administration', amount: 120000, percentage: 5, status: 'on-track', statusLabel: 'On Track' },
];

const QUICK_ACTIONS = [
  { label: 'Generate Report', description: 'Create departmental analytics report', icon: 'FileText', color: 'var(--color-primary)' },
  { label: 'Review Budgets', description: 'Analyze resource allocation', icon: 'DollarSign', color: 'var(--color-success)' },
  { label: 'Faculty Meeting', description: 'Schedule department meeting', icon: 'Calendar', color: 'var(--color-accent)' },
  { label: 'Approve Projects', description: 'Review pending proposals', icon: 'CheckCircle', color: 'var(--color-brand-purple)' },
];

// Faculty are fetched live; below is only used as fallback shape template
const DEMO_FACULTY_PLACEHOLDER = [
  { id: 1, name: 'Faculty Member 1', avatar: null, avatarAlt: '', role: 'Professor', projects: 0, rating: 0, workload: 0, status: 'active' },
  { id: 2, name: 'Faculty Member 2', avatar: null, avatarAlt: '', role: 'Associate Professor', projects: 0, rating: 0, workload: 0, status: 'active' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const groupByMonth = (items, dateField) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const map = {};
  items.forEach((item) => {
    const d = new Date(item[dateField]);
    if (!isNaN(d)) {
      const key = months[d.getMonth()];
      map[key] = (map[key] || 0) + 1;
    }
  });
  return map;
};

// ─── Component ────────────────────────────────────────────────────────────────

const HODAnalyticsDashboard = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Real data
  const [projects, setProjects] = useState([]);
  const [decisions, setDecisions] = useState([]);   // HOD approval records
  const [progressUpdates, setProgressUpdates] = useState([]);
  const [facultyList, setFacultyList] = useState([]);

  // Pending projects awaiting HOD decision (removed optimistically on action)
  const [pendingProjects, setPendingProjects] = useState([]);
  const [decidingId, setDecidingId] = useState(null); // id being actioned right now

  const isDemo = isDemoSession();

  useEffect(() => {
    if (isDemo) { setLoading(false); return; }

    const load = async () => {
      try {
        const [proj, approv, prog, faculty] = await Promise.all([
          fetchHodProjects().catch(() => []),
          fetchHodApprovals().catch(() => []),
          fetchHodProgress().catch(() => []),
          fetchFacultyList().catch(() => []),
        ]);
        const projList = proj || [];
        setProjects(projList);
        setDecisions(approv || []);
        // Seed the pending list from freshly fetched projects
        setPendingProjects(projList.filter((p) => p.status === 'SUBMITTED'));
        setProgressUpdates(prog || []);
        setFacultyList(faculty?.length ? faculty.slice(0, 5).map((u, i) => ({
          id: u.id || i,
          name: u.name || u.email || `Faculty #${u.id}`,
          avatar: u.avatar || null,
          avatarAlt: '',
          role: u.role || 'Faculty',
          projects: 0,
          rating: 0,
          workload: 0,
          status: 'active',
        })) : DEMO_FACULTY_PLACEHOLDER);
      } catch (e) {
        console.error('HOD dashboard load error:', e);
        setError('Could not load analytics data. Showing partial data.');
        setFacultyList(DEMO_FACULTY_PLACEHOLDER);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isDemo]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Decision handler ─────────────────────────────────────────────────────

  const handleDecision = async (projectId, decision) => {
    setDecidingId(projectId);
    try {
      await apiFetch(`/hod/projects/${projectId}/decision/`, {
        method: 'POST',
        body: JSON.stringify({ decision }),
      });
      // Optimistically remove from pending list on success
      setPendingProjects((prev) => prev.filter((p) => p.id !== projectId));
    } catch (e) {
      setError(`Decision failed: ${e.message || 'Unknown error'}`);
    } finally {
      setDecidingId(null);
    }
  };

  // ── Derived metrics ──────────────────────────────────────────────────────

  const totalProjects = isDemo ? 248 : projects.length;
  const approvedCount = isDemo ? 156 : decisions.filter((a) => a.decision === 'APPROVE').length;
  const rejectedCount = isDemo ? 12  : decisions.filter((a) => a.decision === 'REJECT').length;
  const pendingCount  = isDemo ? 80  : projects.filter((p) => p.status === 'SUBMITTED' || p.status === 'UNDER_REVIEW').length;
  const completionRate = isDemo ? '94.2%' : totalProjects > 0 ? `${Math.round((approvedCount / totalProjects) * 100)}%` : '0%';

  const metricsData = [
    {
      title: 'Total Projects',
      value: isDemo ? '248' : String(totalProjects),
      change: isDemo ? '+12.5%' : `${pendingCount} pending`,
      changeType: 'positive',
      icon: 'FolderOpen',
      iconColor: 'var(--color-primary)',
      description: isDemo ? 'vs last semester' : 'under review',
      trend: [12, 18, 15, 22, 28, 24, 30],
    },
    {
      title: 'Approved Projects',
      value: isDemo ? '156' : String(approvedCount),
      change: isDemo ? '+8.3%' : rejectedCount > 0 ? `${rejectedCount} rejected` : 'none rejected',
      changeType: 'positive',
      icon: 'CheckCircle',
      iconColor: 'var(--color-success)',
      description: isDemo ? 'this semester' : 'total approved',
      trend: [15, 20, 18, 25, 30, 28, 35],
    },
    {
      title: 'Pending Review',
      value: isDemo ? '42' : String(pendingCount),
      change: isDemo ? '+2' : 'awaiting decision',
      changeType: pendingCount > 20 ? 'negative' : 'positive',
      icon: 'Clock',
      iconColor: 'var(--color-warning)',
      description: isDemo ? 'this week' : 'submitted/under review',
      trend: [10, 12, 11, 14, 16, 15, 18],
    },
    {
      title: 'Completion Rate',
      value: completionRate,
      change: isDemo ? '+3.1%' : 'approved vs total',
      changeType: 'positive',
      icon: 'TrendingUp',
      iconColor: 'var(--color-brand-purple)',
      description: isDemo ? 'above target' : 'this period',
      trend: [20, 22, 24, 26, 28, 30, 32],
    },
  ];

  const departmentOverviewData = [
    {
      label: 'Approved Projects',
      value: isDemo ? '156' : String(approvedCount),
      icon: 'CheckCircle',
      color: 'var(--color-success)',
      status: 'excellent',
      statusLabel: 'Approved',
      subtitle: totalProjects > 0 ? `${Math.round((approvedCount / Math.max(totalProjects, 1)) * 100)}% of total` : 'N/A',
    },
    {
      label: 'Pending Review',
      value: isDemo ? '34' : String(pendingCount),
      icon: 'Clock',
      color: 'var(--color-warning)',
      status: 'good',
      statusLabel: pendingCount > 20 ? 'High' : 'Good',
      subtitle: 'Awaiting decision',
    },
    {
      label: 'Rejected Projects',
      value: isDemo ? '12' : String(rejectedCount),
      icon: 'XCircle',
      color: 'var(--color-error)',
      status: rejectedCount > 20 ? 'critical' : 'good',
      statusLabel: rejectedCount > 20 ? 'Review Process' : 'Manageable',
      subtitle: 'Sent back for revision',
    },
    {
      label: 'Progress Updates',
      value: isDemo ? '89' : String(progressUpdates.length),
      icon: 'Activity',
      color: 'var(--color-primary)',
      status: 'excellent',
      statusLabel: 'Active',
      subtitle: 'Total submissions',
    },
  ];

  // Build performance chart from real project creation dates
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const byMonth = groupByMonth(projects, 'created_at');
  const approvalByMonth = groupByMonth(decisions.filter((a) => a.decision === 'APPROVE'), 'decided_at');

  const performanceChartData = isDemo
    ? [
        { name: 'Jan', completed: 42, inProgress: 28, pending: 12 },
        { name: 'Feb', completed: 38, inProgress: 32, pending: 15 },
        { name: 'Mar', completed: 45, inProgress: 30, pending: 10 },
        { name: 'Apr', completed: 52, inProgress: 25, pending: 8 },
        { name: 'May', completed: 48, inProgress: 28, pending: 12 },
        { name: 'Jun', completed: 55, inProgress: 22, pending: 7 },
      ]
    : months.map((m) => ({
        name: m,
        completed: approvalByMonth[m] || 0,
        inProgress: byMonth[m] || 0,
        pending: Math.max(0, (byMonth[m] || 0) - (approvalByMonth[m] || 0)),
      }));

  // Recent activities from approvals
  const recentActivitiesData = isDemo
    ? [
        { id: 1, type: 'approval', description: 'New research proposal submitted for review', user: 'Department System', timestamp: new Date(Date.now() - 300000), badge: 'new' },
        { id: 2, type: 'review', description: 'Quarterly performance review cycle started', user: 'Admin System', timestamp: new Date(Date.now() - 1800000), badge: null },
        { id: 3, type: 'alert', description: 'Budget threshold reached for Infrastructure', user: 'Finance System', timestamp: new Date(Date.now() - 3600000), badge: 'urgent' },
        { id: 4, type: 'submission', description: 'New batch of project submissions received', user: 'Student Portal', timestamp: new Date(Date.now() - 7200000), badge: null },
      ]
    : decisions.slice(0, 5).map((a, i) => ({
        id: a.id || i,
        type: a.decision === 'APPROVE' ? 'approval' : 'alert',
        description: `Project #${a.project} — ${a.decision === 'APPROVE' ? 'Approved' : 'Rejected'}${a.reason ? ': ' + a.reason.slice(0, 60) : ''}`,
        user: `HOD #${a.hod}`,
        timestamp: new Date(a.decided_at),
        badge: a.decision === 'APPROVE' ? 'new' : 'urgent',
      }));

  const studentAnalyticsData = [
    { label: 'Total Projects',  value: isDemo ? '1,847' : String(totalProjects), icon: 'FolderOpen',  color: 'var(--color-primary)',       change: '+8.3%',  changeType: 'positive' },
    { label: 'Approved',        value: isDemo ? '892'   : String(approvedCount), icon: 'CheckCircle', color: 'var(--color-success)',       change: '+12.1%', changeType: 'positive' },
    { label: 'Rejection Rate',  value: isDemo ? '3.68'  : totalProjects > 0 ? `${Math.round((rejectedCount / Math.max(totalProjects, 1)) * 100)}%` : '0%', icon: 'XCircle', color: 'var(--color-error)', change: '', changeType: 'negative' },
    { label: 'Completion Rate', value: completionRate,                           icon: 'TrendingUp',  color: 'var(--color-brand-purple)', change: '+5%',    changeType: 'positive' },
  ];

  const enrollmentTrendData = [
    { month: 'Aug', enrolled: 320, graduated: 0, dropped: 5 },
    { month: 'Sep', enrolled: 315, graduated: 0, dropped: 8 },
    { month: 'Oct', enrolled: 310, graduated: 0, dropped: 3 },
    { month: 'Nov', enrolled: 308, graduated: 0, dropped: 4 },
    { month: 'Dec', enrolled: 305, graduated: 0, dropped: 2 },
    { month: 'Jan', enrolled: 303, graduated: 285, dropped: 6 },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Icon name="Loader2" size={40} color="var(--color-primary)" className="animate-spin" />
          <p className="text-muted-foreground">Loading analytics…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar isCollapsed={isSidebarCollapsed} onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />

      <div className={`transition-all duration-academic ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <Header />

        <main className="pt-16 px-4 md:px-6 lg:px-8 pb-8">
          <div className="max-w-7xl mx-auto">

            {error && (
              <div className="mb-4 p-3 bg-warning/10 border border-warning/30 rounded-lg text-sm text-warning flex items-center gap-2">
                <Icon name="AlertTriangle" size={16} color="var(--color-warning)" />
                {error}
              </div>
            )}

            {isDemo && (
              <div className="mb-4 p-3 bg-accent/10 border border-accent/30 rounded-lg text-sm text-accent flex items-center gap-2">
                <Icon name="Info" size={16} color="var(--color-accent)" />
                Demo session — showing sample analytics data.
              </div>
            )}

            <div className="mb-6 md:mb-8">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-foreground mb-2">
                HOD Analytics Dashboard
              </h1>
              <p className="text-sm md:text-base text-muted-foreground">
                Comprehensive departmental insights and strategic planning tools for academic excellence
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
              {metricsData?.map((metric, index) => (
                <MetricCard key={index} {...metric} />
              ))}
            </div>

            <div className="grid grid-cols-1 gap-6 md:gap-8 mb-6 md:mb-8">
              <DepartmentOverview data={departmentOverviewData} />
            </div>

            {/* ── Pending Review Section ───────────────────────────────── */}
            {!isDemo && (
              <div className="mb-6 md:mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-warning/10 rounded-lg flex items-center justify-center">
                    <Icon name="Clock" size={18} color="var(--color-warning)" />
                  </div>
                  <div>
                    <h2 className="text-lg font-heading font-semibold text-foreground">
                      Pending Review
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {pendingProjects.length} project{pendingProjects.length !== 1 ? 's' : ''} awaiting your decision
                    </p>
                  </div>
                </div>

                {pendingProjects.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 bg-card border border-border rounded-xl text-center gap-3">
                    <Icon name="CheckCircle" size={36} color="var(--color-success)" />
                    <p className="text-sm font-medium text-foreground">All caught up!</p>
                    <p className="text-xs text-muted-foreground">No projects are waiting for a decision.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {pendingProjects.map((project) => {
                      const isActioning = decidingId === project.id;
                      const submittedDate = project.submitted_at || project.created_at;
                      return (
                        <div
                          key={project.id}
                          className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4 shadow-sm hover:shadow-elevation-md transition-shadow"
                        >
                          {/* Header */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className="text-sm font-semibold text-foreground leading-snug truncate">
                                {project.title || `Project #${project.id}`}
                              </h3>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {project.student_name || project.student_email || `Student #${project.student}`}
                              </p>
                            </div>
                            <span className="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full bg-warning/10 text-warning border border-warning/20">
                              {project.status}
                            </span>
                          </div>

                          {/* Meta */}
                          <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                            {project.department && (
                              <div className="flex items-center gap-1.5">
                                <Icon name="Building" size={12} color="currentColor" />
                                <span className="truncate">{project.department}</span>
                              </div>
                            )}
                            {submittedDate && (
                              <div className="flex items-center gap-1.5">
                                <Icon name="Calendar" size={12} color="currentColor" />
                                <span>
                                  {new Date(submittedDate).toLocaleDateString('en-IN', {
                                    day: '2-digit', month: 'short', year: 'numeric',
                                  })}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2 mt-auto">
                            <button
                              id={`approve-project-${project.id}`}
                              disabled={isActioning}
                              onClick={() => handleDecision(project.id, 'APPROVE')}
                              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-success/10 text-success border border-success/20 hover:bg-success hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isActioning ? (
                                <Icon name="Loader2" size={14} color="currentColor" className="animate-spin" />
                              ) : (
                                <Icon name="Check" size={14} color="currentColor" />
                              )}
                              Approve
                            </button>
                            <button
                              id={`reject-project-${project.id}`}
                              disabled={isActioning}
                              onClick={() => handleDecision(project.id, 'REJECT')}
                              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-error/10 text-error border border-error/20 hover:bg-error hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Icon name="X" size={14} color="currentColor" />
                              Reject
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-6 md:mb-8">
              <PerformanceChart data={performanceChartData} title="Project Performance Trends" />
              <StudentAnalytics data={studentAnalyticsData} enrollmentTrend={enrollmentTrendData} />
            </div>

            <div className="grid grid-cols-1 gap-6 md:gap-8 mb-6 md:mb-8">
              <FacultyPerformance faculty={facultyList} />
            </div>

            <div className="grid grid-cols-1 gap-6 md:gap-8 mb-6 md:mb-8">
              <ResourceAllocation data={RESOURCE_ALLOCATION} budgetData={BUDGET_BREAKDOWN} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
              <div className="lg:col-span-2">
                <RecentActivities activities={recentActivitiesData} />
              </div>
              <div>
                <QuickActions actions={QUICK_ACTIONS} />
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default HODAnalyticsDashboard;