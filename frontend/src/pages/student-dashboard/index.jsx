import React, { useState } from 'react';
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

const StudentDashboard = () => {
  const [selectedView, setSelectedView] = useState('overview');

  const studentInfo = {
    name: "Sarah Johnson",
    studentId: "CS2024-1847",
    department: "Computer Science",
    academicYear: "2024-2025",
    semester: "Fall 2024",
    gpa: "3.85",
    email: "sarah.johnson@university.edu"
  };

  const currentProject = {
    id: "PRJ-2024-CS-047",
    title: "Machine Learning Based Predictive Analytics for Student Performance Assessment",
    status: "In Progress",
    guide: "Dr. Michael Chen",
    deadline: "03/15/2025",
    progress: 65
  };

  const guideInfo = {
    name: "Dr. Michael Chen",
    designation: "Associate Professor",
    department: "Department of Computer Science",
    email: "michael.chen@university.edu",
    phone: "+1 (555) 123-4567",
    office: "Engineering Building, Room 304",
    availability: "Mon-Fri, 2:00 PM - 4:00 PM",
    avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_19b434d4a-1763294497098.png",
    avatarAlt: "Professional headshot of Asian male professor with short black hair wearing navy blazer and white shirt"
  };

  const stats = [
  { title: "Project Progress", value: "65%", icon: "TrendingUp", trend: "up", trendValue: "12%", color: "primary" },
  { title: "Documents Submitted", value: "8", icon: "FileText", trend: "up", trendValue: "3", color: "success" },
  { title: "Pending Tasks", value: "4", icon: "AlertCircle", color: "warning" },
  { title: "Days to Deadline", value: "48", icon: "Calendar", color: "accent" }];


  const pendingTasks = [
  {
    title: "Submit Literature Review Chapter",
    description: "Complete and submit the literature review section with at least 25 peer-reviewed references",
    priority: "High",
    dueDate: "02/05/2025"
  },
  {
    title: "Upload Dataset Documentation",
    description: "Provide detailed documentation of the dataset used including sources and preprocessing steps",
    priority: "Medium",
    dueDate: "02/10/2025"
  },
  {
    title: "Schedule Mid-term Review Meeting",
    description: "Coordinate with guide and committee members for mid-term project review presentation",
    priority: "High",
    dueDate: "02/08/2025"
  },
  {
    title: "Update Project Timeline",
    description: "Revise project timeline based on current progress and submit updated Gantt chart",
    priority: "Low",
    dueDate: "02/15/2025"
  }];


  const timelinePhases = [
  {
    title: "Project Proposal Submission",
    description: "Initial project proposal submitted and approved by faculty guide",
    status: "completed",
    date: "09/15/2024",
    tasks: [
    { name: "Problem statement defined", completed: true },
    { name: "Objectives outlined", completed: true },
    { name: "Methodology proposed", completed: true }],

    documents: ["Proposal.pdf", "Abstract.docx"]
  },
  {
    title: "Literature Review",
    description: "Comprehensive review of existing research and methodologies in the domain",
    status: "completed",
    date: "10/20/2024",
    tasks: [
    { name: "25+ papers reviewed", completed: true },
    { name: "Gap analysis completed", completed: true },
    { name: "References compiled", completed: true }],

    documents: ["LiteratureReview.pdf"]
  },
  {
    title: "System Design & Architecture",
    description: "Detailed system design with architecture diagrams and component specifications",
    status: "current",
    date: "01/15/2025",
    tasks: [
    { name: "Architecture diagram created", completed: true },
    { name: "Database schema designed", completed: true },
    { name: "API specifications drafted", completed: false },
    { name: "Security considerations documented", completed: false }],

    documents: ["SystemDesign.pdf"]
  },
  {
    title: "Implementation Phase",
    description: "Core system development and feature implementation",
    status: "pending",
    date: "02/28/2025",
    tasks: [
    { name: "Backend development", completed: false },
    { name: "Frontend implementation", completed: false },
    { name: "Integration testing", completed: false }]

  },
  {
    title: "Testing & Validation",
    description: "Comprehensive testing and validation of implemented system",
    status: "pending",
    date: "03/20/2025",
    tasks: [
    { name: "Unit testing", completed: false },
    { name: "Integration testing", completed: false },
    { name: "User acceptance testing", completed: false }]

  },
  {
    title: "Final Documentation & Presentation",
    description: "Complete project documentation and final presentation preparation",
    status: "pending",
    date: "04/10/2025",
    tasks: [
    { name: "Final report compilation", completed: false },
    { name: "Presentation slides prepared", completed: false },
    { name: "Demo video created", completed: false }]

  }];


  const recentActivities = [
  {
    type: "approval",
    message: "Dr. Michael Chen approved your System Design document",
    timestamp: new Date(Date.now() - 7200000)
  },
  {
    type: "comment",
    message: "New feedback received on Literature Review chapter",
    timestamp: new Date(Date.now() - 14400000)
  },
  {
    type: "submission",
    message: "You submitted Database Schema Design document",
    timestamp: new Date(Date.now() - 86400000)
  },
  {
    type: "meeting",
    message: "Upcoming meeting scheduled for 02/03/2025 at 3:00 PM",
    timestamp: new Date(Date.now() - 172800000)
  },
  {
    type: "revision",
    message: "Revision requested for API Specifications section",
    timestamp: new Date(Date.now() - 259200000)
  },
  {
    type: "document",
    message: "New reference material shared by guide",
    timestamp: new Date(Date.now() - 345600000)
  }];


  const upcomingDeadlines = [
  {
    title: "Literature Review Submission",
    category: "Documentation",
    date: "02/05/2025"
  },
  {
    title: "Mid-term Review Presentation",
    category: "Milestone",
    date: "02/08/2025"
  },
  {
    title: "Dataset Documentation Upload",
    category: "Documentation",
    date: "02/10/2025"
  },
  {
    title: "Progress Report Submission",
    category: "Report",
    date: "02/15/2025"
  }];


  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-16">
        <div className="max-w-[1920px] mx-auto px-4 md:px-6 lg:px-8">
          <div className="py-4 md:py-6">
            <Breadcrumbs />
            
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
                  <p className="text-xs text-muted-foreground">Student ID</p>
                  <p className="text-sm font-medium text-foreground">{studentInfo?.studentId}</p>
                </div>
                <div className="h-8 w-px bg-border hidden md:block" />
                <div>
                  <p className="text-xs text-muted-foreground">GPA</p>
                  <p className="text-sm font-medium text-foreground">{studentInfo?.gpa}</p>
                </div>
                <div className="h-8 w-px bg-border" />
                <div>
                  <p className="text-xs text-muted-foreground">Semester</p>
                  <p className="text-sm font-medium text-foreground">{studentInfo?.semester}</p>
                </div>
              </div>
            </div>

            <QuickActions />

            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {['overview', 'timeline', 'tasks', 'documents']?.map((view) =>
              <button
                key={view}
                onClick={() => setSelectedView(view)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-smooth ${
                selectedView === view ?
                'bg-primary text-primary-foreground' :
                'bg-card text-foreground hover:bg-muted border border-border'}`
                }>

                  {view?.charAt(0)?.toUpperCase() + view?.slice(1)}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
              <div className="lg:col-span-8 space-y-4 md:space-y-6">
                {selectedView === 'overview' &&
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {stats?.map((stat, index) =>
                    <StatCard key={index} {...stat} />
                    )}
                    </div>

                    <ProjectStatusCard project={currentProject} />

                    <div className="bg-card border border-border rounded-lg p-4 md:p-6 shadow-elevation-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg md:text-xl font-heading font-semibold text-foreground">
                          Pending Tasks
                        </h2>
                        <span className="text-sm text-muted-foreground">
                          {pendingTasks?.length} tasks
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {pendingTasks?.map((task, index) =>
                      <PendingTaskCard key={index} task={task} />
                      )}
                      </div>
                    </div>
                  </>
                }

                {selectedView === 'timeline' &&
                <div className="bg-card border border-border rounded-lg p-4 md:p-6 shadow-elevation-sm">
                    <h2 className="text-lg md:text-xl font-heading font-semibold text-foreground mb-6">
                      Project Timeline
                    </h2>
                    <div className="space-y-2">
                      {timelinePhases?.map((phase, index) =>
                    <TimelinePhase
                      key={index}
                      phase={phase}
                      isLast={index === timelinePhases?.length - 1} />

                    )}
                    </div>
                  </div>
                }

                {selectedView === 'tasks' &&
                <div className="bg-card border border-border rounded-lg p-4 md:p-6 shadow-elevation-sm">
                    <h2 className="text-lg md:text-xl font-heading font-semibold text-foreground mb-6">
                      All Tasks
                    </h2>
                    <div className="space-y-4">
                      {pendingTasks?.map((task, index) =>
                    <PendingTaskCard key={index} task={task} />
                    )}
                    </div>
                  </div>
                }

                {selectedView === 'documents' &&
                <DocumentQuickUpload />
                }
              </div>

              <div className="lg:col-span-4 space-y-4 md:space-y-6">
                <GuideInfoCard guide={guideInfo} />

                <div className="bg-card border border-border rounded-lg p-4 md:p-6 shadow-elevation-sm">
                  <h3 className="text-base md:text-lg font-heading font-semibold text-foreground mb-4">
                    Upcoming Deadlines
                  </h3>
                  <div className="space-y-3">
                    {upcomingDeadlines?.map((deadline, index) =>
                    <UpcomingDeadlineCard key={index} deadline={deadline} />
                    )}
                  </div>
                </div>

                <div className="bg-card border border-border rounded-lg p-4 md:p-6 shadow-elevation-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base md:text-lg font-heading font-semibold text-foreground">
                      Recent Activity
                    </h3>
                    <button className="text-sm text-primary hover:underline">
                      View All
                    </button>
                  </div>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {recentActivities?.map((activity, index) =>
                    <ActivityFeedItem key={index} activity={activity} />
                    )}
                  </div>
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
                    { label: 'Contact Support', icon: 'HelpCircle', path: '#' }]?.
                    map((link, index) =>
                    <button
                      key={index}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-smooth text-left">

                        <Icon name={link?.icon} size={18} color="var(--color-foreground)" />
                        <span className="text-sm font-medium text-foreground">{link?.label}</span>
                        <Icon name="ChevronRight" size={16} color="var(--color-muted-foreground)" className="ml-auto" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>);

};

export default StudentDashboard;