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

const GuideDashboard = () => {
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState(0);
  const [academicYear, setAcademicYear] = useState('2025-2026');

  const academicYearOptions = [
  { value: '2025-2026', label: 'Academic Year 2025-2026' },
  { value: '2024-2025', label: 'Academic Year 2024-2025' },
  { value: '2023-2024', label: 'Academic Year 2023-2024' }];


  const workloadMetrics = {
    totalAdvisees: 24,
    pendingReviews: 8,
    approvedProjects: 16,
    averageProgress: 67,
    approvalRate: 85
  };

  const studentsData = [
  {
    id: 1,
    name: "Sarah Johnson",
    email: "sarah.johnson@university.edu",
    rollNumber: "CS2021001",
    department: "Computer Science",
    avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_177b8b667-1763293947539.png",
    avatarAlt: "Professional headshot of young woman with brown hair in business casual attire smiling at camera",
    projectTitle: "Machine Learning Based Sentiment Analysis for Social Media",
    projectDescription: "Development of an advanced sentiment analysis system using deep learning techniques to analyze social media posts and comments. The system will classify emotions and sentiments with high accuracy using transformer-based models.",
    status: "In Progress",
    currentPhase: 2,
    lastActivity: "2 hours ago",
    nextDeadline: "2026-01-28",
    progressScore: 75,
    priority: "high",
    pendingActions: 2,
    timeline: [
    {
      title: "Project Proposal",
      description: "Initial project proposal submitted and approved by guide",
      date: "2025-12-15",
      status: "completed",
      submissions: [
      {
        title: "Proposal Document v1.0",
        submittedDate: "2025-12-15",
        status: "Approved"
      }]

    },
    {
      title: "Literature Review",
      description: "Comprehensive review of existing research and methodologies",
      date: "2026-01-10",
      status: "completed",
      submissions: [
      {
        title: "Literature Review Report",
        submittedDate: "2026-01-10",
        status: "Approved"
      }]

    },
    {
      title: "System Design",
      description: "Architecture design and technology stack selection",
      date: "2026-01-25",
      status: "current",
      submissions: [
      {
        title: "System Architecture Document",
        submittedDate: "2026-01-24",
        status: "Pending"
      }]

    },
    {
      title: "Implementation Phase",
      description: "Core system development and testing",
      date: "2026-02-28",
      status: "pending",
      submissions: []
    }],

    analytics: {
      totalDocuments: 12,
      totalComments: 28,
      totalMeetings: 6,
      averageScore: 8.5
    }
  },
  {
    id: 2,
    name: "Michael Chen",
    email: "michael.chen@university.edu",
    rollNumber: "CS2021002",
    department: "Computer Science",
    avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1cb933d20-1763293416126.png",
    avatarAlt: "Professional headshot of Asian man with short black hair wearing navy blue suit and glasses",
    projectTitle: "Blockchain-Based Supply Chain Management System",
    projectDescription: "A decentralized supply chain tracking system using blockchain technology to ensure transparency and traceability of products from manufacturer to end consumer.",
    status: "Pending Review",
    currentPhase: 3,
    lastActivity: "5 hours ago",
    nextDeadline: "2026-01-29",
    progressScore: 82,
    priority: "medium",
    pendingActions: 1,
    timeline: [
    {
      title: "Project Proposal",
      description: "Initial project proposal submitted and approved",
      date: "2025-12-10",
      status: "completed",
      submissions: [
      {
        title: "Proposal Document",
        submittedDate: "2025-12-10",
        status: "Approved"
      }]

    },
    {
      title: "Requirements Analysis",
      description: "Detailed requirements gathering and analysis",
      date: "2025-12-28",
      status: "completed",
      submissions: [
      {
        title: "Requirements Specification",
        submittedDate: "2025-12-28",
        status: "Approved"
      }]

    },
    {
      title: "Prototype Development",
      description: "Working prototype with core blockchain features",
      date: "2026-01-20",
      status: "completed",
      submissions: [
      {
        title: "Prototype Demo",
        submittedDate: "2026-01-20",
        status: "Approved"
      }]

    },
    {
      title: "Testing & Documentation",
      description: "Comprehensive testing and technical documentation",
      date: "2026-02-15",
      status: "current",
      submissions: []
    }],

    analytics: {
      totalDocuments: 18,
      totalComments: 34,
      totalMeetings: 8,
      averageScore: 9.0
    }
  },
  {
    id: 3,
    name: "Emily Rodriguez",
    email: "emily.rodriguez@university.edu",
    rollNumber: "CS2021003",
    department: "Computer Science",
    avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1975607e9-1763295500639.png",
    avatarAlt: "Professional headshot of Hispanic woman with long dark hair in white blouse smiling warmly",
    projectTitle: "AI-Powered Healthcare Diagnosis Assistant",
    projectDescription: "An intelligent healthcare system that assists doctors in diagnosing diseases using machine learning algorithms trained on medical imaging data and patient records.",
    status: "Approved",
    currentPhase: 4,
    lastActivity: "1 day ago",
    nextDeadline: "2026-01-30",
    progressScore: 95,
    priority: "low",
    pendingActions: 0,
    timeline: [
    {
      title: "Project Proposal",
      description: "Comprehensive project proposal with research objectives",
      date: "2025-12-05",
      status: "completed",
      submissions: [
      {
        title: "Proposal Document",
        submittedDate: "2025-12-05",
        status: "Approved"
      }]

    },
    {
      title: "Data Collection",
      description: "Medical dataset acquisition and preprocessing",
      date: "2025-12-20",
      status: "completed",
      submissions: [
      {
        title: "Dataset Report",
        submittedDate: "2025-12-20",
        status: "Approved"
      }]

    },
    {
      title: "Model Development",
      description: "AI model training and optimization",
      date: "2026-01-15",
      status: "completed",
      submissions: [
      {
        title: "Model Performance Report",
        submittedDate: "2026-01-15",
        status: "Approved"
      }]

    },
    {
      title: "Final Presentation",
      description: "Project demonstration and final report submission",
      date: "2026-02-05",
      status: "current",
      submissions: []
    }],

    analytics: {
      totalDocuments: 22,
      totalComments: 41,
      totalMeetings: 10,
      averageScore: 9.5
    }
  },
  {
    id: 4,
    name: "Alex Kumar",
    email: "alex.kumar@university.edu",
    rollNumber: "CS2021004",
    department: "Computer Science",
    avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1866265bd-1763293085876.png",
    avatarAlt: "Professional headshot of Indian man with short black hair wearing gray suit and tie",
    projectTitle: "Real-Time Traffic Management System Using IoT",
    projectDescription: "An IoT-based intelligent traffic management system that uses sensors and cameras to monitor traffic flow and optimize signal timing in real-time to reduce congestion.",
    status: "Needs Revision",
    currentPhase: 2,
    lastActivity: "3 hours ago",
    nextDeadline: "2026-01-27",
    progressScore: 58,
    priority: "high",
    pendingActions: 3,
    timeline: [
    {
      title: "Project Proposal",
      description: "Initial proposal with system overview",
      date: "2025-12-18",
      status: "completed",
      submissions: [
      {
        title: "Proposal Document",
        submittedDate: "2025-12-18",
        status: "Approved"
      }]

    },
    {
      title: "Hardware Setup",
      description: "IoT sensor deployment and network configuration",
      date: "2026-01-08",
      status: "completed",
      submissions: [
      {
        title: "Hardware Configuration Report",
        submittedDate: "2026-01-08",
        status: "Needs Revision"
      }]

    },
    {
      title: "Software Development",
      description: "Backend system and data processing algorithms",
      date: "2026-01-28",
      status: "current",
      submissions: []
    },
    {
      title: "Integration Testing",
      description: "End-to-end system testing and optimization",
      date: "2026-02-20",
      status: "pending",
      submissions: []
    }],

    analytics: {
      totalDocuments: 9,
      totalComments: 22,
      totalMeetings: 5,
      averageScore: 7.5
    }
  },
  {
    id: 5,
    name: "Jessica Lee",
    email: "jessica.lee@university.edu",
    rollNumber: "CS2021005",
    department: "Computer Science",
    avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1dc908441-1763296904445.png",
    avatarAlt: "Professional headshot of Asian woman with shoulder-length black hair in blue blazer smiling confidently",
    projectTitle: "Augmented Reality Educational Platform",
    projectDescription: "An AR-based learning platform that creates immersive educational experiences for students, allowing them to interact with 3D models and simulations in real-time.",
    status: "Submitted",
    currentPhase: 1,
    lastActivity: "6 hours ago",
    nextDeadline: "2026-02-01",
    progressScore: 45,
    priority: "medium",
    pendingActions: 1,
    timeline: [
    {
      title: "Project Proposal",
      description: "Detailed proposal with AR technology research",
      date: "2026-01-05",
      status: "completed",
      submissions: [
      {
        title: "Proposal Document",
        submittedDate: "2026-01-05",
        status: "Pending"
      }]

    },
    {
      title: "Technology Research",
      description: "AR frameworks and development tools evaluation",
      date: "2026-01-25",
      status: "current",
      submissions: []
    },
    {
      title: "Prototype Development",
      description: "Basic AR application prototype",
      date: "2026-02-15",
      status: "pending",
      submissions: []
    },
    {
      title: "User Testing",
      description: "Educational effectiveness evaluation",
      date: "2026-03-05",
      status: "pending",
      submissions: []
    }],

    analytics: {
      totalDocuments: 6,
      totalComments: 15,
      totalMeetings: 3,
      averageScore: 8.0
    }
  },
  {
    id: 6,
    name: "David Park",
    email: "david.park@university.edu",
    rollNumber: "CS2021006",
    department: "Computer Science",
    avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1ac2aa6fd-1763292105333.png",
    avatarAlt: "Professional headshot of Korean man with short styled hair wearing charcoal suit and white shirt",
    projectTitle: "Cybersecurity Threat Detection System",
    projectDescription: "An advanced intrusion detection system using machine learning to identify and prevent cyber threats in real-time by analyzing network traffic patterns and anomalies.",
    status: "In Progress",
    currentPhase: 3,
    lastActivity: "4 hours ago",
    nextDeadline: "2026-02-02",
    progressScore: 70,
    priority: "high",
    pendingActions: 2,
    timeline: [
    {
      title: "Project Proposal",
      description: "Security system proposal with threat analysis",
      date: "2025-12-12",
      status: "completed",
      submissions: [
      {
        title: "Proposal Document",
        submittedDate: "2025-12-12",
        status: "Approved"
      }]

    },
    {
      title: "Threat Modeling",
      description: "Comprehensive threat landscape analysis",
      date: "2026-01-02",
      status: "completed",
      submissions: [
      {
        title: "Threat Model Report",
        submittedDate: "2026-01-02",
        status: "Approved"
      }]

    },
    {
      title: "Detection Algorithm",
      description: "ML-based threat detection implementation",
      date: "2026-01-22",
      status: "completed",
      submissions: [
      {
        title: "Algorithm Documentation",
        submittedDate: "2026-01-22",
        status: "Approved"
      }]

    },
    {
      title: "System Integration",
      description: "Full system deployment and testing",
      date: "2026-02-18",
      status: "current",
      submissions: []
    }],

    analytics: {
      totalDocuments: 15,
      totalComments: 30,
      totalMeetings: 7,
      averageScore: 8.8
    }
  }];


  const [filteredStudents, setFilteredStudents] = useState(studentsData);
  const selectedStudent = filteredStudents?.find((s) => s?.id === selectedStudentId);

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
      setFilteredStudents(studentsData);
    } else {
      let filtered = studentsData?.filter((student) =>
      student?.name?.toLowerCase()?.includes(query?.toLowerCase()) ||
      student?.projectTitle?.toLowerCase()?.includes(query?.toLowerCase())
      );
      setFilteredStudents(filtered);
    }
  };

  const handleFilterChange = (filters) => {
    let filtered = [...studentsData];

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
                <Select
                  options={academicYearOptions}
                  value={academicYear}
                  onChange={setAcademicYear} />

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
                    activeFilters={activeFilters} />


                  <div className="h-[calc(100vh-28rem)] overflow-y-auto p-4 space-y-3">
                    {filteredStudents?.length > 0 ?
                    filteredStudents?.map((student) =>
                    <StudentRosterCard
                      key={student?.id}
                      student={student}
                      isSelected={selectedStudentId === student?.id}
                      onClick={() => setSelectedStudentId(student?.id)} />

                    ) :

                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Icon name="Search" size={48} color="var(--color-muted-foreground)" className="mb-4" />
                        <h3 className="text-lg font-heading font-semibold text-foreground mb-2">
                          No Students Found
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Try adjusting your search or filters
                        </p>
                      </div>
                    }
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
    </>);

};

export default GuideDashboard;