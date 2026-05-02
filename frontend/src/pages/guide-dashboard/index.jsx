import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import Header from '../../components/ui/Header';
import Breadcrumbs from '../../components/ui/Breadcrumbs';
import QuickActions from '../../components/ui/QuickActions';
import StudentRosterCard from './components/StudentRosterCard';
import ProjectTimelinePanel from './components/ProjectTimelinePanel';
import QuickActionsPanel from './components/QuickActionsPanel';
import FilterBar from './components/FilterBar';
import WorkloadMetrics from './components/WorkloadMetrics';
import Select from '../../components/ui/Select';
import Icon from '../../components/AppIcon';
import {
  fetchMentoredProjects,
  isDemoSession,
  getUserEmail,
} from '../../utils/api';

// ─── Demo fallback data ───────────────────────────────────────────────────────

const DEMO_STUDENTS = [
  {
    id: 1,
    name: 'Student 1 (Demo)',
    email: 'student1@demo.edu',
    rollNumber: 'DEMO001',
    department: 'Computer Science',
    avatar: null,
    avatarAlt: 'Student profile',
    projectTitle: 'Machine Learning Sentiment Analysis',
    projectDescription: 'Development of an advanced sentiment analysis system.',
    status: 'In Progress',
    currentPhase: 2,
    lastActivity: '2 hours ago',
    nextDeadline: '',
    progressScore: 75,
    priority: 'high',
    pendingActions: 2,
    timeline: [
      { title: 'Project Proposal', description: 'Approved', date: '2025-12-15', status: 'completed', submissions: [] },
      { title: 'Literature Review', description: 'Comprehensive review', date: '2026-01-10', status: 'current', submissions: [] },
    ],
    analytics: { totalDocuments: 0, totalComments: 0, totalMeetings: 0, averageScore: 0 },
  },
  {
    id: 2,
    name: 'Student 2 (Demo)',
    email: 'student2@demo.edu',
    rollNumber: 'DEMO002',
    department: 'Computer Science',
    avatar: null,
    avatarAlt: 'Student profile',
    projectTitle: 'Blockchain Supply Chain System',
    projectDescription: 'A decentralized supply chain tracking system.',
    status: 'Pending Review',
    currentPhase: 3,
    lastActivity: '5 hours ago',
    nextDeadline: '',
    progressScore: 82,
    priority: 'medium',
    pendingActions: 1,
    timeline: [
      { title: 'Project Proposal', description: 'Approved', date: '2025-12-10', status: 'completed', submissions: [] },
    ],
    analytics: { totalDocuments: 0, totalComments: 0, totalMeetings: 0, averageScore: 0 },
  },
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

const mapProjectToStudent = (project, index) => ({
  id: project.id,
  name: `Student #${project.team_leader_student}`,
  email: `student${project.team_leader_student}@university.edu`,
  rollNumber: `STU${String(project.team_leader_student).padStart(7, '0')}`,
  department: `Dept #${project.department}`,
  avatar: DEMO_STUDENTS[index % DEMO_STUDENTS.length]?.avatar,
  avatarAlt: 'Student profile photo',
  projectTitle: project.title,
  projectDescription: project.title,
  status: statusLabel(project.status),
  currentPhase: 1,
  lastActivity: new Date(project.updated_at).toLocaleDateString(),
  nextDeadline: project.submitted_at || '',
  progressScore: project.status === 'APPROVED' ? 100 : project.status === 'UNDER_REVIEW' ? 70 : project.status === 'SUBMITTED' ? 50 : 30,
  priority: 'medium',
  pendingActions: project.status === 'SUBMITTED' || project.status === 'UNDER_REVIEW' ? 1 : 0,
  timeline: [
    { title: 'Project Created', description: 'Project registered in system', date: new Date(project.created_at).toLocaleDateString(), status: 'completed', submissions: [] },
    { title: 'Submission', description: 'Project submitted for review', date: project.submitted_at ? new Date(project.submitted_at).toLocaleDateString() : '--', status: project.submitted_at ? 'completed' : 'pending', submissions: [] },
    { title: 'Review', description: 'Under HOD review', date: '--', status: project.status === 'UNDER_REVIEW' ? 'current' : project.status === 'APPROVED' || project.status === 'REJECTED' ? 'completed' : 'pending', submissions: [] },
    { title: 'Final Decision', description: 'Approval or rejection', date: project.approved_at ? new Date(project.approved_at).toLocaleDateString() : '--', status: project.approved_at ? 'completed' : 'pending', submissions: [] },
  ],
  analytics: { totalDocuments: 0, totalComments: 0, totalMeetings: 0, averageScore: 0 },
});

// ─── Component ────────────────────────────────────────────────────────────────

const GuideDashboard = () => {
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState(0);
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allStudents, setAllStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);

  const isDemo = isDemoSession();

  const academicYearOptions = [
    { value: '2025-2026', label: 'Academic Year 2025-2026' },
    { value: '2024-2025', label: 'Academic Year 2024-2025' },
    { value: '2023-2024', label: 'Academic Year 2023-2024' },
  ];

  useEffect(() => {
    if (isDemo) {
      setAllStudents(DEMO_STUDENTS);
      setFilteredStudents(DEMO_STUDENTS);
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const projects = await fetchMentoredProjects();
        const mapped = projects.map((p, i) => mapProjectToStudent(p, i));
        setAllStudents(mapped);
        setFilteredStudents(mapped);
      } catch (e) {
        console.error('Guide dashboard load error:', e);
        setError('Could not load projects. Showing demo data.');
        setAllStudents(DEMO_STUDENTS);
        setFilteredStudents(DEMO_STUDENTS);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isDemo]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e?.key === 'j' && filteredStudents?.length > 0) {
        const currentIndex = filteredStudents?.findIndex((s) => s?.id === selectedStudentId);
        const nextIndex = (currentIndex + 1) % filteredStudents?.length;
        setSelectedStudentId(filteredStudents?.[nextIndex]?.id);
      } else if (e?.key === 'k' && filteredStudents?.length > 0) {
        const currentIndex = filteredStudents?.findIndex((s) => s?.id === selectedStudentId);
        const prevIndex = currentIndex <= 0 ? filteredStudents?.length - 1 : currentIndex - 1;
        setSelectedStudentId(filteredStudents?.[prevIndex]?.id);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedStudentId, filteredStudents]);

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query?.trim() === '') {
      setFilteredStudents(allStudents);
    } else {
      setFilteredStudents(
        allStudents?.filter(
          (s) =>
            s?.name?.toLowerCase()?.includes(query?.toLowerCase()) ||
            s?.projectTitle?.toLowerCase()?.includes(query?.toLowerCase())
        )
      );
    }
  };

  const handleFilterChange = (filters) => {
    let filtered = [...allStudents];
    if (filters?.status && filters?.status !== 'all') {
      filtered = filtered?.filter((s) => s?.status?.toLowerCase()?.replace(' ', '-') === filters?.status);
    }
    if (filters?.priority && filters?.priority !== 'all') {
      filtered = filtered?.filter((s) => s?.priority === filters?.priority);
    }
    if (filters?.phase && filters?.phase !== 'all') {
      filtered = filtered?.filter((s) => s?.currentPhase?.toString() === filters?.phase);
    }
    setFilteredStudents(filtered);
    let count = 0;
    if (filters?.status && filters?.status !== 'all') count++;
    if (filters?.priority && filters?.priority !== 'all') count++;
    if (filters?.phase && filters?.phase !== 'all') count++;
    setActiveFilters(count);
  };

  const selectedStudent = filteredStudents?.find((s) => s?.id === selectedStudentId);

  const workloadMetrics = {
    totalAdvisees: allStudents.length,
    pendingReviews: allStudents.filter((s) => s.pendingActions > 0).length,
    approvedProjects: allStudents.filter((s) => s.status === 'Approved').length,
    averageProgress: allStudents.length
      ? Math.round(allStudents.reduce((sum, s) => sum + s.progressScore, 0) / allStudents.length)
      : 0,
    approvalRate: allStudents.length
      ? Math.round((allStudents.filter((s) => s.status === 'Approved').length / allStudents.length) * 100)
      : 0,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Icon name="Loader2" size={40} color="var(--color-primary)" className="animate-spin" />
          <p className="text-muted-foreground">Loading student projects…</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Guide Dashboard - AcademicProjectHub</title>
        <meta name="description" content="Faculty supervision center for comprehensive student oversight and academic mentoring workflows" />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Header />

        <main className="pt-16">
          <div className="max-w-[1920px] mx-auto px-4 md:px-6 lg:px-8 py-6">
            <Breadcrumbs />

            {error && (
              <div className="mb-4 p-3 bg-warning/10 border border-warning/30 rounded-lg text-sm text-warning flex items-center gap-2">
                <Icon name="AlertTriangle" size={16} color="var(--color-warning)" />
                {error}
              </div>
            )}

            {isDemo && (
              <div className="mb-4 p-3 bg-accent/10 border border-accent/30 rounded-lg text-sm text-accent flex items-center gap-2">
                <Icon name="Info" size={16} color="var(--color-accent)" />
                Demo session — showing sample student data.
              </div>
            )}

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-foreground mb-2">
                  Faculty Dashboard
                </h1>
                <p className="text-sm md:text-base text-muted-foreground">
                  Manage and monitor your advisee projects
                </p>
              </div>

              <div className="w-full lg:w-64">
                <Select options={academicYearOptions} value={academicYear} onChange={setAcademicYear} />
              </div>
            </div>

            <QuickActions />

            <WorkloadMetrics metrics={workloadMetrics} />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-3">
                <div className="bg-card border border-border rounded-lg shadow-elevation-md overflow-hidden">
                  <FilterBar
                    onFilterChange={handleFilterChange}
                    onSearch={handleSearch}
                    totalStudents={filteredStudents?.length}
                    activeFilters={activeFilters}
                  />

                  <div className="h-[calc(100vh-28rem)] overflow-y-auto p-4 space-y-3">
                    {filteredStudents?.length > 0 ? (
                      filteredStudents?.map((student) => (
                        <StudentRosterCard
                          key={student?.id}
                          student={student}
                          isSelected={selectedStudentId === student?.id}
                          onClick={() => setSelectedStudentId(student?.id)}
                        />
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Icon name="Search" size={48} color="var(--color-muted-foreground)" className="mb-4" />
                        <h3 className="text-lg font-heading font-semibold text-foreground mb-2">
                          No Students Found
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Try adjusting your search or filters
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6">
                <div className="bg-card border border-border rounded-lg shadow-elevation-md h-[calc(100vh-28rem)] overflow-hidden">
                  <ProjectTimelinePanel student={selectedStudent} />
                </div>
              </div>

              <div className="lg:col-span-3">
                <div className="bg-card border border-border rounded-lg shadow-elevation-md h-[calc(100vh-28rem)] overflow-hidden">
                  <QuickActionsPanel selectedStudent={selectedStudent} />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default GuideDashboard;