import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/ui/Sidebar';
import Header from '../../components/ui/Header';
import Footer from '../../components/ui/Footer';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import StatCard from './components/StatCard';
import EvaluationCard from './components/EvaluationCard';
import AssessmentHistoryTable from './components/AssessmentHistoryTable';
import ScoringRubricCard from './components/ScoringRubricCard';
import ComparativeAnalysisChart from './components/ComparativeAnalysisChart';
import QuickActionsPanel from './components/QuickActionsPanel';
import {
  fetchAllPages,
  isDemoSession,
} from '../../utils/api';

// ─── Demo fallback data ───────────────────────────────────────────────────────

const DEMO_QUEUE = [
  { id: 1, projectTitle: 'AI-Powered Healthcare Diagnosis System', projectDescription: 'Development of machine learning model for early disease detection.', studentName: 'Student A (Demo)', studentAvatar: null, studentAvatarAlt: 'Student photo', department: 'Computer Science', status: 'pending', priority: 'high', dueDate: 'Jan 28, 2026', submittedDate: 'Jan 24, 2026', documentsCount: 8, progress: 0 },
  { id: 2, projectTitle: 'Sustainable Energy Grid Optimization', projectDescription: 'Smart grid management using IoT sensors and predictive analytics.', studentName: 'Student B (Demo)', studentAvatar: null, studentAvatarAlt: 'Student photo', department: 'Electrical Engineering', status: 'in-progress', priority: 'medium', dueDate: 'Jan 30, 2026', submittedDate: 'Jan 23, 2026', documentsCount: 12, progress: 45 },
  { id: 3, projectTitle: 'Autonomous Vehicle Navigation System', projectDescription: 'Advanced computer vision for real-time obstacle detection.', studentName: 'Student C (Demo)', studentAvatar: null, studentAvatarAlt: 'Student photo', department: 'Mechanical Engineering', status: 'pending', priority: 'high', dueDate: 'Jan 27, 2026', submittedDate: 'Jan 25, 2026', documentsCount: 15, progress: 0 },
];

const DEMO_HISTORY = [
  { id: 1, projectTitle: 'Machine Learning Model for Predictive Maintenance', projectImage: 'https://img.rocket.new/generatedImages/rocket_gen_img_113617219-1764737686388.png', projectImageAlt: 'ML visualization', studentName: 'Alex Thompson', studentAvatar: 'https://img.rocket.new/generatedImages/rocket_gen_img_1eb27b9bd-1763296842514.png', studentAvatarAlt: 'Student photo', department: 'Computer Science', score: 88, status: 'completed', evaluationDate: 'Jan 20, 2026' },
  { id: 2, projectTitle: 'Renewable Energy Storage System Design', projectImage: 'https://images.unsplash.com/photo-1685905735715-6e16669143fd', projectImageAlt: 'Solar panels', studentName: 'Maria Garcia', studentAvatar: 'https://img.rocket.new/generatedImages/rocket_gen_img_1123f2aed-1763293403622.png', studentAvatarAlt: 'Student photo', department: 'Electrical Engineering', score: 92, status: 'completed', evaluationDate: 'Jan 18, 2026' },
  { id: 3, projectTitle: 'Advanced Robotics Control System', projectImage: 'https://img.rocket.new/generatedImages/rocket_gen_img_11d8d2592-1768245051030.png', projectImageAlt: 'Robotic arm', studentName: 'James Wilson', studentAvatar: 'https://img.rocket.new/generatedImages/rocket_gen_img_182183743-1763294553218.png', studentAvatarAlt: 'Student photo', department: 'Mechanical Engineering', score: 85, status: 'completed', evaluationDate: 'Jan 15, 2026' },
];

const DEMO_RUBRIC = {
  title: 'AI-Powered Healthcare Diagnosis System',
  description: 'Comprehensive evaluation rubric for machine learning project assessment',
  totalScore: 82, maxScore: 100,
  reviewerName: 'Current Reviewer',
  evaluationDate: new Date().toLocaleDateString(),
  criteria: [
    { id: 1, name: 'Technical Implementation', description: 'Quality of code and technical execution', score: 85, maxScore: 100, feedback: 'Excellent implementation.', subCriteria: [{ id: 1, name: 'Code Quality', score: 88, maxScore: 100 }, { id: 2, name: 'Architecture Design', score: 82, maxScore: 100 }] },
    { id: 2, name: 'Innovation & Creativity', description: 'Originality of approach', score: 78, maxScore: 100, feedback: 'Good application of existing techniques.', subCriteria: [{ id: 1, name: 'Novel Approach', score: 75, maxScore: 100 }, { id: 2, name: 'Problem Solving', score: 82, maxScore: 100 }] },
  ],
};

const DEMO_COMPARATIVE = [
  { name: 'Technical', currentProject: 85, departmentAverage: 78, universityAverage: 75 },
  { name: 'Innovation', currentProject: 78, departmentAverage: 80, universityAverage: 76 },
  { name: 'Documentation', currentProject: 80, departmentAverage: 75, universityAverage: 73 },
  { name: 'Testing', currentProject: 86, departmentAverage: 82, universityAverage: 79 },
  { name: 'Presentation', currentProject: 82, departmentAverage: 77, universityAverage: 74 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const statusLabel = (code) => {
  const map = { DRAFT: 'Draft', SUBMITTED: 'Submitted', UNDER_REVIEW: 'Under Review', APPROVED: 'Approved', REJECTED: 'Rejected' };
  return map[code] || code || 'Unknown';
};

const DEPT_AVATARS = [
  'https://img.rocket.new/generatedImages/rocket_gen_img_103b528db-1763293982935.png',
  'https://img.rocket.new/generatedImages/rocket_gen_img_1cb933d20-1763293416126.png',
  'https://img.rocket.new/generatedImages/rocket_gen_img_1420e84f9-1763293742638.png',
];

const mapProjectToEvaluation = (p, idx) => ({
  id: p.id,
  projectTitle: p.title,
  projectDescription: p.title,
  studentName: `Student #${p.team_leader_student}`,
  studentAvatar: DEPT_AVATARS[idx % DEPT_AVATARS.length],
  studentAvatarAlt: 'Student photo',
  department: `Dept #${p.department}`,
  status: p.status === 'SUBMITTED' ? 'pending' : p.status === 'UNDER_REVIEW' ? 'in-progress' : 'pending',
  priority: 'medium',
  dueDate: p.submitted_at ? new Date(p.submitted_at).toLocaleDateString() : '--',
  submittedDate: new Date(p.created_at).toLocaleDateString(),
  documentsCount: 0,
  progress: p.status === 'UNDER_REVIEW' ? 50 : 0,
});

// ─── Component ────────────────────────────────────────────────────────────────

const ReviewerDashboard = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('queue');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [loading, setLoading] = useState(true);
  const [evaluationQueue, setEvaluationQueue] = useState([]);
  const [assessmentHistory, setAssessmentHistory] = useState(DEMO_HISTORY);

  const isDemo = isDemoSession();

  const departmentOptions = [
    { value: 'all', label: 'All Departments' },
    { value: 'computer-science', label: 'Computer Science' },
    { value: 'electrical', label: 'Electrical Engineering' },
    { value: 'mechanical', label: 'Mechanical Engineering' },
    { value: 'civil', label: 'Civil Engineering' },
  ];

  useEffect(() => {
    if (isDemo) {
      setEvaluationQueue(DEMO_QUEUE);
      setLoading(false);
      return;
    }
    const load = async () => {
      try {
        // Reviewer sees approved projects from faculty endpoint
        const approved = await fetchAllPages('/faculty/projects/approved/').catch(() => []);
        const submitted = await fetchAllPages('/hod/projects/').catch(() => []);
        const all = [...submitted, ...approved];
        setEvaluationQueue(all.map((p, i) => mapProjectToEvaluation(p, i)));
      } catch (e) {
        console.error('Reviewer load error:', e);
        setEvaluationQueue(DEMO_QUEUE);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isDemo]);

  const filteredQueue = filterDepartment === 'all'
    ? evaluationQueue
    : evaluationQueue.filter(e => e.department?.toLowerCase().replace(/\s/g, '-') === filterDepartment);

  // Stats derived from real queue
  const pendingCount = evaluationQueue.filter(e => e.status === 'pending').length;
  const inProgressCount = evaluationQueue.filter(e => e.status === 'in-progress').length;
  const completedCount = assessmentHistory.length;
  const avgScore = assessmentHistory.length
    ? Math.round(assessmentHistory.reduce((s, a) => s + (a.score || 0), 0) / assessmentHistory.length * 10) / 10
    : 0;

  const statsData = [
    { title: 'Pending Evaluations', value: String(pendingCount || (isDemo ? 12 : pendingCount)), change: `+${pendingCount} new`, changeType: 'positive', icon: 'Clock', iconColor: 'bg-warning/10 text-warning' },
    { title: 'In Progress', value: String(inProgressCount || (isDemo ? 5 : inProgressCount)), change: 'active reviews', changeType: 'neutral', icon: 'FileEdit', iconColor: 'bg-accent/10 text-accent' },
    { title: 'Completed This Month', value: String(completedCount || (isDemo ? 28 : completedCount)), change: '+12%', changeType: 'positive', icon: 'CheckCircle2', iconColor: 'bg-success/10 text-success' },
    { title: 'Average Score', value: String(avgScore || (isDemo ? '82.5' : avgScore)), change: isDemo ? '+4.2%' : 'based on history', changeType: 'positive', icon: 'TrendingUp', iconColor: 'bg-primary/10 text-primary' },
  ];

  const tabs = [
    { id: 'queue', label: 'Evaluation Queue', icon: 'Inbox', count: filteredQueue.length },
    { id: 'history', label: 'Assessment History', icon: 'History', count: assessmentHistory.length },
    { id: 'rubrics', label: 'Scoring Rubrics', icon: 'ClipboardList', count: 1 },
    { id: 'analytics', label: 'Comparative Analysis', icon: 'BarChart3', count: null },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Icon name="Loader2" size={40} color="var(--color-primary)" className="animate-spin" />
          <p className="text-muted-foreground">Loading evaluations…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar isCollapsed={isSidebarCollapsed} onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
      <Header />
      <main className={`pt-16 transition-all duration-academic ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">

          {isDemo && (
            <div className="mb-4 p-3 bg-accent/10 border border-accent/30 rounded-lg text-sm text-accent flex items-center gap-2">
              <Icon name="Info" size={16} color="var(--color-accent)" />
              Demo session — showing sample evaluation data.
            </div>
          )}

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6 md:mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-foreground mb-2">
                Reviewer Dashboard
              </h1>
              <p className="text-sm md:text-base text-muted-foreground">
                Manage evaluations, track assessment history, and analyze project performance
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Select options={departmentOptions} value={filterDepartment} onChange={setFilterDepartment} className="w-full sm:w-56" />
              <Button variant="default" iconName="Plus" iconPosition="left" className="w-full sm:w-auto">
                New Evaluation
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
            {statsData?.map((stat, index) => <StatCard key={index} {...stat} />)}
          </div>

          <div className="mb-6 md:mb-8">
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="flex items-center overflow-x-auto">
                {tabs?.map((tab) => (
                  <button
                    key={tab?.id}
                    onClick={() => setActiveTab(tab?.id)}
                    className={`flex items-center gap-2 px-4 md:px-6 py-3 md:py-4 border-b-2 transition-all duration-academic whitespace-nowrap ${
                      activeTab === tab?.id
                        ? 'border-primary text-primary bg-primary/5'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    <Icon name={tab?.icon} size={18} />
                    <span className="text-sm font-medium">{tab?.label}</span>
                    {tab?.count !== null && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${activeTab === tab?.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                        {tab?.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {activeTab === 'queue' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  {filteredQueue.length > 0 ? (
                    filteredQueue.map((evaluation) => (
                      <EvaluationCard key={evaluation?.id} evaluation={evaluation} />
                    ))
                  ) : (
                    <div className="bg-card border border-border rounded-lg p-12 text-center">
                      <Icon name="Inbox" size={48} color="var(--color-muted-foreground)" className="mx-auto mb-4" />
                      <h3 className="text-lg font-heading font-semibold text-foreground mb-2">No Evaluations in Queue</h3>
                      <p className="text-sm text-muted-foreground">Projects submitted for review will appear here.</p>
                    </div>
                  )}
                </div>
                <div className="space-y-6">
                  <QuickActionsPanel />
                  <div className="bg-card border border-border rounded-lg p-4 md:p-6">
                    <h3 className="text-lg font-heading font-semibold text-foreground mb-4">Upcoming Deadlines</h3>
                    <div className="space-y-3">
                      {filteredQueue.slice(0, 3).map((item) => (
                        <div key={item?.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                          <Icon name="Calendar" size={16} className="text-muted-foreground flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground line-clamp-1">{item?.projectTitle}</p>
                            <p className="text-xs text-muted-foreground">Due: {item?.dueDate}</p>
                          </div>
                        </div>
                      ))}
                      {filteredQueue.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-2">No upcoming deadlines.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && <AssessmentHistoryTable assessments={assessmentHistory} />}

          {activeTab === 'rubrics' && (
            <div className="space-y-6">
              <ScoringRubricCard rubric={DEMO_RUBRIC} />
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <ComparativeAnalysisChart data={DEMO_COMPARATIVE} type="bar" />
              <ComparativeAnalysisChart data={DEMO_COMPARATIVE} type="radar" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-heading font-semibold text-foreground">Evaluation Trends</h3>
                    <Icon name="TrendingUp" size={20} className="text-success" />
                  </div>
                  <div className="space-y-4">
                    {[
                      { label: 'Average Score', value: avgScore || 82.5, color: 'bg-success' },
                      { label: 'Completion Rate', value: 94, color: 'bg-primary' },
                      { label: 'On-Time Delivery', value: 88, color: 'bg-accent' },
                    ].map(({ label, value, color }) => (
                      <div key={label}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">{label}</span>
                          <span className="text-sm font-semibold text-foreground">{value}%</span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full ${color}`} style={{ width: `${value}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-heading font-semibold text-foreground">Department Rankings</h3>
                    <Icon name="Award" size={20} className="text-warning" />
                  </div>
                  <div className="space-y-3">
                    {[
                      { dept: 'Computer Science', score: 85.2, rank: 1 },
                      { dept: 'Electrical Eng.', score: 82.8, rank: 2 },
                      { dept: 'Mechanical Eng.', score: 79.5, rank: 3 },
                      { dept: 'Civil Engineering', score: 76.3, rank: 4 },
                    ].map((item) => (
                      <div key={item?.dept} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold">{item?.rank}</span>
                          <span className="text-sm text-foreground">{item?.dept}</span>
                        </div>
                        <span className="text-sm font-semibold text-muted-foreground">{item?.score}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-heading font-semibold text-foreground">Quality Metrics</h3>
                    <Icon name="Target" size={20} className="text-accent" />
                  </div>
                  <div className="space-y-4">
                    <div className="text-center p-4 rounded-lg bg-success/10 border border-success/20">
                      <p className="text-xs text-success mb-1">Excellence Rate</p>
                      <p className="text-2xl font-heading font-bold text-success">
                        {assessmentHistory.filter(a => a.score >= 85).length > 0
                          ? `${Math.round((assessmentHistory.filter(a => a.score >= 85).length / Math.max(assessmentHistory.length, 1)) * 100)}%`
                          : '32%'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Scores &gt; 85</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-warning/10 border border-warning/20">
                      <p className="text-xs text-warning mb-1">Improvement Needed</p>
                      <p className="text-2xl font-heading font-bold text-warning">
                        {assessmentHistory.filter(a => a.score < 60).length > 0
                          ? `${Math.round((assessmentHistory.filter(a => a.score < 60).length / Math.max(assessmentHistory.length, 1)) * 100)}%`
                          : '8%'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Scores &lt; 60</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ReviewerDashboard;