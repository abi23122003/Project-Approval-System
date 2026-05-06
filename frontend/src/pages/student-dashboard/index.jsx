import React, { useState, useEffect } from 'react';
import Header from '../../components/ui/Header';
import Breadcrumbs from '../../components/ui/Breadcrumbs';
import QuickActions from '../../components/ui/QuickActions';
import Icon from '../../components/AppIcon';
import ProjectStatusCard from './components/ProjectStatusCard';
import TimelinePhase from './components/TimelinePhase';
import GuideInfoCard from './components/GuideInfoCard';
import PendingTaskCard from './components/PendingTaskCard';
import ActivityFeedItem from './components/ActivityFeedItem';
import StatCard from './components/StatCard';
import UpcomingDeadlineCard from './components/UpcomingDeadlineCard';
import DocumentQuickUpload from './components/DocumentQuickUpload';
import { useNavigate } from 'react-router-dom';
import {
  apiFetch,
  fetchStudentProject,
  fetchStudentProgress,
  getUserEmail,
  isDemoSession,
} from '../../utils/api';

// ─── Demo / fallback data ────────────────────────────────────────────────────

const DEMO_PROJECT = {
  id: 'PRJ-NEW',
  title: 'Your Project Will Appear Here',
  status: 'Not Started',
  guide: 'No guide assigned yet',
  deadline: '--',
  progress: 0,
};

const DEMO_GUIDE = {
  name: 'Your Faculty Guide',
  designation: 'Faculty',
  department: '--',
  email: '--',
  phone: '--',
  office: '--',
  availability: '--',
  avatar: null,
  avatarAlt: 'Faculty avatar',
};

const DEMO_TIMELINE = [
  {
    title: 'Project Proposal Submission',
    description: 'Initial project proposal submitted and approved by faculty guide',
    status: 'completed',
    date: '09/15/2024',
    tasks: [
      { name: 'Problem statement defined', completed: true },
      { name: 'Objectives outlined', completed: true },
      { name: 'Methodology proposed', completed: true },
    ],
    documents: ['Proposal.pdf', 'Abstract.docx'],
  },
  {
    title: 'Literature Review',
    description: 'Comprehensive review of existing research and methodologies',
    status: 'completed',
    date: '10/20/2024',
    tasks: [
      { name: '25+ papers reviewed', completed: true },
      { name: 'Gap analysis completed', completed: true },
      { name: 'References compiled', completed: true },
    ],
    documents: ['LiteratureReview.pdf'],
  },
  {
    title: 'System Design & Architecture',
    description: 'Detailed system design with architecture diagrams',
    status: 'current',
    date: '01/15/2025',
    tasks: [
      { name: 'Architecture diagram created', completed: true },
      { name: 'Database schema designed', completed: true },
      { name: 'API specifications drafted', completed: false },
    ],
    documents: ['SystemDesign.pdf'],
  },
  {
    title: 'Implementation Phase',
    description: 'Core system development and feature implementation',
    status: 'pending',
    date: '02/28/2025',
    tasks: [
      { name: 'Backend development', completed: false },
      { name: 'Frontend implementation', completed: false },
      { name: 'Integration testing', completed: false },
    ],
  },
  {
    title: 'Testing & Validation',
    description: 'Comprehensive testing and validation of implemented system',
    status: 'pending',
    date: '03/20/2025',
    tasks: [
      { name: 'Unit testing', completed: false },
      { name: 'Integration testing', completed: false },
      { name: 'User acceptance testing', completed: false },
    ],
  },
  {
    title: 'Final Documentation & Presentation',
    description: 'Complete project documentation and final presentation',
    status: 'pending',
    date: '04/10/2025',
    tasks: [
      { name: 'Final report compilation', completed: false },
      { name: 'Presentation slides prepared', completed: false },
      { name: 'Demo video created', completed: false },
    ],
  },
];

const DEMO_TASKS = [
  {
    title: 'Submit Literature Review Chapter',
    description: 'Complete and submit the literature review section',
    priority: 'High',
    dueDate: '02/05/2025',
  },
  {
    title: 'Upload Dataset Documentation',
    description: 'Provide detailed documentation of the dataset used',
    priority: 'Medium',
    dueDate: '02/10/2025',
  },
  {
    title: 'Schedule Mid-term Review Meeting',
    description: 'Coordinate with guide and committee for mid-term review',
    priority: 'High',
    dueDate: '02/08/2025',
  },
  {
    title: 'Update Project Timeline',
    description: 'Revise project timeline based on current progress',
    priority: 'Low',
    dueDate: '02/15/2025',
  },
];

const DEMO_ACTIVITIES = [
  { type: 'approval', message: 'Guide approved your System Design document', timestamp: new Date(Date.now() - 7200000) },
  { type: 'comment', message: 'New feedback received on Literature Review chapter', timestamp: new Date(Date.now() - 14400000) },
  { type: 'submission', message: 'You submitted Database Schema Design document', timestamp: new Date(Date.now() - 86400000) },
  { type: 'meeting', message: 'Upcoming meeting scheduled for next week', timestamp: new Date(Date.now() - 172800000) },
];

const DEMO_DEADLINES = [
  { title: 'Literature Review Submission', category: 'Documentation', date: '02/05/2025' },
  { title: 'Mid-term Review Presentation', category: 'Milestone', date: '02/08/2025' },
  { title: 'Dataset Documentation Upload', category: 'Documentation', date: '02/10/2025' },
  { title: 'Progress Report Submission', category: 'Report', date: '02/15/2025' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const statusLabel = (code) => {
  const map = {
    DRAFT: 'Draft',
    SUBMITTED: 'Submitted',
    UNDER_REVIEW: 'Under Review',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
  };
  return map[code] || code || 'Unknown';
};

const daysUntil = (dateStr) => {
  if (!dateStr) return '--';
  const diff = new Date(dateStr) - new Date();
  return Math.max(0, Math.ceil(diff / 86400000));
};

const formatDate = (dateStr) => {
  if (!dateStr) return '--';
  try { return new Date(dateStr).toLocaleDateString(); } catch { return dateStr; }
};

// ─── Component ────────────────────────────────────────────────────────────────

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [selectedView, setSelectedView] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Real data state
  const [project, setProject] = useState(null);
  const [progressUpdates, setProgressUpdates] = useState([]);

  const email = getUserEmail();
  const isDemo = isDemoSession();

  useEffect(() => {
    if (isDemo) {
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const [proj, prog] = await Promise.all([
          fetchStudentProject(),   // returns null if no project (404/403)
          fetchStudentProgress(),  // returns [] if no project (404/403)
        ]);
        setProject(proj ?? null);
        setProgressUpdates(prog ?? []);
      } catch (e) {
        console.error('Student dashboard load error:', e);
        // Only show error banner for unexpected failures (not 404/403 which are handled)
        if (e.status !== 404 && e.status !== 403) {
          setError('Could not load your project data. Please try refreshing.');
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isDemo]);

  // ── Derive display values ────────────────────────────────────────────────

  const latestProgress = progressUpdates[0]?.percent_complete ?? null;
  const progressValue = latestProgress !== null ? latestProgress : (project ? 0 : DEMO_PROJECT.progress);

  const currentProject = project
    ? {
        id: `PRJ-${project.id}`,
        title: project.title,
        status: statusLabel(project.status),
        guide: `Faculty ID #${project.mentor_faculty}`,
        deadline: formatDate(project.submitted_at || project.created_at),
        progress: progressValue,
      }
    : DEMO_PROJECT;

  const guideInfo = project
    ? {
        ...DEMO_GUIDE,
        name: `Faculty ID #${project.mentor_faculty}`,
        email: '',
      }
    : DEMO_GUIDE;

  const docsSubmitted = progressUpdates.length;
  const daysToDeadline = project?.submitted_at
    ? daysUntil(project.submitted_at)
    : '--';

  const stats = project
    ? [
        { title: 'Project Progress', value: `${progressValue}%`, icon: 'TrendingUp', color: 'primary' },
        { title: 'Progress Updates', value: `${docsSubmitted}`, icon: 'FileText', color: 'success' },
        { title: 'Project Status', value: statusLabel(project.status), icon: 'AlertCircle', color: 'warning' },
        { title: 'Days Since Created', value: `${Math.ceil((Date.now() - new Date(project.created_at)) / 86400000)}`, icon: 'Calendar', color: 'accent' },
      ]
    : isDemo
    ? [
        // Demo only: show illustrative numbers
        { title: 'Project Progress', value: '0%', icon: 'TrendingUp', color: 'primary' },
        { title: 'Documents Submitted', value: '0', icon: 'FileText', color: 'success' },
        { title: 'Pending Tasks', value: '0', icon: 'AlertCircle', color: 'warning' },
        { title: 'Days to Deadline', value: '--', icon: 'Calendar', color: 'accent' },
      ]
    : [
        // Real user with no project yet → show zeros
        { title: 'Project Progress', value: '0%', icon: 'TrendingUp', color: 'primary' },
        { title: 'Documents Submitted', value: '0', icon: 'FileText', color: 'success' },
        { title: 'Pending Tasks', value: '0', icon: 'AlertCircle', color: 'warning' },
        { title: 'Days to Deadline', value: '--', icon: 'Calendar', color: 'accent' },
      ];

  // Activities derived from progress updates (real) or demo
  const recentActivities = progressUpdates.length
    ? progressUpdates.slice(0, 6).map((p) => ({
        type: 'submission',
        message: `Progress update: ${p.percent_complete}% — ${p.steps_completed?.slice(0, 80) || ''}`,
        timestamp: new Date(p.created_at),
      }))
    : isDemo
    ? DEMO_ACTIVITIES
    : [];

  const studentName = email
    ? email.split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : 'Student';

  const studentInfo = {
    name: studentName,
    studentId: email || 'N/A',
    gpa: '--',
    semester: 'Current Semester',
  };

  // Timeline derived from real progress updates; empty for new real users
  const timelinePhases = project
    ? progressUpdates.length > 0
      ? progressUpdates.slice(0, 6).map((p, i) => ({
          title: `Progress Update #${i + 1}`,
          description: p.steps_completed || 'Progress recorded',
          status: i === 0 ? 'current' : 'completed',
          date: formatDate(p.created_at),
          tasks: [
            { name: `Completion: ${p.percent_complete}%`, completed: true },
          ],
          documents: [],
        }))
      : [{ title: 'No progress updates yet', description: 'Submit your first progress update to see your timeline.', status: 'pending', date: '--', tasks: [], documents: [] }]
    : isDemo
    ? DEMO_TIMELINE
    : [{ title: 'No project yet', description: 'Create or join a project to see your timeline.', status: 'pending', date: '--', tasks: [], documents: [] }];

  // Tasks derived from real project state; empty for new real users
  const pendingTasks = project
    ? [
        project.status === 'DRAFT'
          ? { title: 'Submit your project for review', description: 'Your project is saved as draft. Submit it to begin the review process.', priority: 'High', dueDate: '--' }
          : null,
        project.status === 'UNDER_REVIEW'
          ? { title: 'Await review decision', description: 'Your project is under review. Check back for updates.', priority: 'Medium', dueDate: '--' }
          : null,
        progressUpdates.length === 0
          ? { title: 'Submit your first progress update', description: 'Keep your guide informed by submitting a progress update.', priority: 'High', dueDate: '--' }
          : null,
      ].filter(Boolean)
    : isDemo
    ? DEMO_TASKS
    : [];

  // Deadlines derived from real project; empty for new real users
  const upcomingDeadlines = project
    ? [
        project.submitted_at
          ? { title: 'Submitted', category: 'Project', date: formatDate(project.submitted_at) }
          : { title: 'Submit Project', category: 'Milestone', date: '--' },
      ]
    : isDemo
    ? DEMO_DEADLINES
    : [];

  // ── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Icon name="Loader2" size={40} color="var(--color-primary)" className="animate-spin" />
          <p className="text-muted-foreground">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-16">
        <div className="max-w-[1920px] mx-auto px-4 md:px-6 lg:px-8">
          <div className="py-4 md:py-6">
            <Breadcrumbs />

            {/* Error banner */}
            {error && (
              <div className="mb-4 p-3 bg-warning/10 border border-warning/30 rounded-lg text-sm text-warning flex items-center gap-2">
                <Icon name="AlertTriangle" size={16} color="var(--color-warning)" />
                {error}
              </div>
            )}

            {/* Demo session banner */}
            {isDemo && (
              <div className="mb-4 p-3 bg-accent/10 border border-accent/30 rounded-lg text-sm text-accent flex items-center gap-2">
                <Icon name="Info" size={16} color="var(--color-accent)" />
                Demo session — showing sample data. Log in with a real account to see live data.
              </div>
            )}

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-foreground mb-2">
                  Student Dashboard
                </h1>
                <p className="text-sm md:text-base text-muted-foreground">
                  Welcome back, {studentInfo?.name}
                </p>
              </div>

              <div className="flex items-center gap-3 p-3 md:p-4 bg-card border border-border rounded-lg">
                <div className="hidden md:block">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium text-foreground">{studentInfo?.studentId}</p>
                </div>
                <div className="h-8 w-px bg-border hidden md:block" />
                <div>
                  <p className="text-xs text-muted-foreground">Semester</p>
                  <p className="text-sm font-medium text-foreground">{studentInfo?.semester}</p>
                </div>
              </div>
            </div>

            <QuickActions />

            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {['overview', 'timeline', 'tasks', 'documents']?.map((view) => (
                <button
                  key={view}
                  onClick={() => setSelectedView(view)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-smooth ${
                    selectedView === view
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card text-foreground hover:bg-muted border border-border'
                  }`}
                >
                  {view?.charAt(0)?.toUpperCase() + view?.slice(1)}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
              <div className="lg:col-span-8 space-y-4 md:space-y-6">
                {selectedView === 'overview' && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {stats?.map((stat, index) => (
                        <StatCard key={index} {...stat} />
                      ))}
                    </div>

                    {/* ── No-project empty state (real users only) ────────── */}
                    {!isDemo && !project ? (
                      <div className="flex flex-col items-center justify-center gap-5 py-16 bg-card border border-border rounded-lg shadow-elevation-sm">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                          <Icon name="FolderPlus" size={32} color="var(--color-primary)" />
                        </div>
                        <div className="text-center max-w-sm">
                          <h2 className="text-xl font-heading font-semibold text-foreground mb-2">
                            No project submitted yet
                          </h2>
                          <p className="text-sm text-muted-foreground">
                            Get started by submitting your first project proposal. Your guide and the review committee will be notified automatically.
                          </p>
                        </div>
                        <button
                          id="start-project-proposal-btn"
                          onClick={() => navigate('/student-project-proposal-form')}
                          className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:bg-primary/90 transition-smooth shadow-elevation-sm"
                        >
                          <Icon name="Plus" size={18} color="currentColor" />
                          Start Project Proposal
                        </button>
                      </div>
                    ) : (
                      <ProjectStatusCard project={currentProject} />
                    )}

                    <div className="bg-card border border-border rounded-lg p-4 md:p-6 shadow-elevation-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg md:text-xl font-heading font-semibold text-foreground">
                          Pending Tasks
                        </h2>
                        <span className="text-sm text-muted-foreground">
                          {pendingTasks?.length} tasks
                        </span>
                      </div>
                      {pendingTasks?.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Icon name="CheckCircle" size={32} color="var(--color-success)" className="mx-auto mb-2" />
                          <p className="text-sm">No pending tasks. Create a project to get started.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {pendingTasks?.map((task, index) => (
                            <PendingTaskCard key={index} task={task} />
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {selectedView === 'timeline' && (
                  <div className="bg-card border border-border rounded-lg p-4 md:p-6 shadow-elevation-sm">
                    <h2 className="text-lg md:text-xl font-heading font-semibold text-foreground mb-6">
                      Project Timeline
                    </h2>
                    <div className="space-y-2">
                      {timelinePhases?.map((phase, index) => (
                        <TimelinePhase
                          key={index}
                          phase={phase}
                          isLast={index === timelinePhases?.length - 1}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {selectedView === 'tasks' && (
                  <div className="bg-card border border-border rounded-lg p-4 md:p-6 shadow-elevation-sm">
                    <h2 className="text-lg md:text-xl font-heading font-semibold text-foreground mb-6">
                      All Tasks
                    </h2>
                    <div className="space-y-4">
                      {pendingTasks?.map((task, index) => (
                        <PendingTaskCard key={index} task={task} />
                      ))}
                    </div>
                  </div>
                )}

                {selectedView === 'documents' && <DocumentQuickUpload />}
              </div>

              <div className="lg:col-span-4 space-y-4 md:space-y-6">
                <GuideInfoCard guide={guideInfo} />

                <div className="bg-card border border-border rounded-lg p-4 md:p-6 shadow-elevation-sm">
                  <h3 className="text-base md:text-lg font-heading font-semibold text-foreground mb-4">
                    Upcoming Deadlines
                  </h3>
                  {upcomingDeadlines?.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <Icon name="Calendar" size={28} color="var(--color-muted-foreground)" className="mx-auto mb-2" />
                      <p className="text-sm">No deadlines yet. Start a project to track milestones.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {upcomingDeadlines?.map((deadline, index) => (
                        <UpcomingDeadlineCard key={index} deadline={deadline} />
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-card border border-border rounded-lg p-4 md:p-6 shadow-elevation-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base md:text-lg font-heading font-semibold text-foreground">
                      Recent Activity
                    </h3>
                  </div>
                  {recentActivities?.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <Icon name="Activity" size={28} color="var(--color-muted-foreground)" className="mx-auto mb-2" />
                      <p className="text-sm">No activity yet. Submit a progress update to see your feed.</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {recentActivities?.map((activity, index) => (
                        <ActivityFeedItem key={index} activity={activity} />
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-card border border-border rounded-lg p-4 md:p-6 shadow-elevation-sm">
                  <h3 className="text-base md:text-lg font-heading font-semibold text-foreground mb-4">
                    Quick Links
                  </h3>
                  <div className="space-y-2">
                    {[
                      { label: 'Submit New Document', icon: 'Upload', path: '/student-document-management' },
                      { label: 'View Project Proposal', icon: 'FileText', path: '/student-project-proposal-form' },
                      { label: 'Schedule Meeting', icon: 'Calendar', path: '#' },
                      { label: 'Contact Support', icon: 'HelpCircle', path: '#' },
                    ]?.map((link, index) => (
                      <button
                        key={index}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-smooth text-left"
                      >
                        <Icon name={link?.icon} size={18} color="var(--color-foreground)" />
                        <span className="text-sm font-medium text-foreground">{link?.label}</span>
                        <Icon name="ChevronRight" size={16} color="var(--color-muted-foreground)" className="ml-auto" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;