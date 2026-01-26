import React, { useState } from 'react';
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

const HODAnalyticsDashboard = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const metricsData = [
  {
    title: "Total Projects",
    value: "248",
    change: "+12.5%",
    changeType: "positive",
    icon: "FolderOpen",
    iconColor: "var(--color-primary)",
    description: "vs last semester",
    trend: [12, 18, 15, 22, 28, 24, 30]
  },
  {
    title: "Active Students",
    value: "1,847",
    change: "+8.3%",
    changeType: "positive",
    icon: "Users",
    iconColor: "var(--color-accent)",
    description: "enrolled this term",
    trend: [15, 20, 18, 25, 30, 28, 35]
  },
  {
    title: "Faculty Members",
    value: "42",
    change: "+2",
    changeType: "positive",
    icon: "UserCheck",
    iconColor: "var(--color-success)",
    description: "new this year",
    trend: [10, 12, 11, 14, 16, 15, 18]
  },
  {
    title: "Completion Rate",
    value: "94.2%",
    change: "+3.1%",
    changeType: "positive",
    icon: "TrendingUp",
    iconColor: "var(--color-brand-purple)",
    description: "above target",
    trend: [20, 22, 24, 26, 28, 30, 32]
  }];


  const departmentOverviewData = [
  {
    label: "Research Projects",
    value: "156",
    icon: "Microscope",
    color: "var(--color-primary)",
    status: "excellent",
    statusLabel: "Excellent",
    subtitle: "63% of total"
  },
  {
    label: "Industry Collaborations",
    value: "34",
    icon: "Briefcase",
    color: "var(--color-accent)",
    status: "good",
    statusLabel: "Good",
    subtitle: "14% of total"
  },
  {
    label: "Publications",
    value: "89",
    icon: "BookOpen",
    color: "var(--color-success)",
    status: "excellent",
    statusLabel: "Excellent",
    subtitle: "This academic year"
  },
  {
    label: "Budget Utilization",
    value: "87%",
    icon: "DollarSign",
    color: "var(--color-warning)",
    status: "good",
    statusLabel: "On Track",
    subtitle: "$2.4M allocated"
  }];


  const performanceChartData = [
  { name: "Jan", completed: 42, inProgress: 28, pending: 12 },
  { name: "Feb", completed: 38, inProgress: 32, pending: 15 },
  { name: "Mar", completed: 45, inProgress: 30, pending: 10 },
  { name: "Apr", completed: 52, inProgress: 25, pending: 8 },
  { name: "May", completed: 48, inProgress: 28, pending: 12 },
  { name: "Jun", completed: 55, inProgress: 22, pending: 7 }];


  const facultyData = [
  {
    id: 1,
    name: "Dr. Sarah Mitchell",
    avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1b43e8b7f-1763295504724.png",
    avatarAlt: "Professional headshot of Caucasian woman with shoulder-length brown hair wearing navy blazer and white blouse",
    role: "Professor, Computer Science",
    projects: 18,
    rating: 4.8,
    workload: 85,
    status: "active"
  },
  {
    id: 2,
    name: "Dr. James Chen",
    avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_183233d26-1763293485515.png",
    avatarAlt: "Professional headshot of Asian man with short black hair wearing dark suit and blue tie",
    role: "Associate Professor, AI Research",
    projects: 15,
    rating: 4.9,
    workload: 78,
    status: "active"
  },
  {
    id: 3,
    name: "Dr. Emily Rodriguez",
    avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_16534c52e-1763295643551.png",
    avatarAlt: "Professional headshot of Hispanic woman with long dark hair wearing burgundy blazer",
    role: "Assistant Professor, Data Science",
    projects: 12,
    rating: 4.7,
    workload: 65,
    status: "active"
  },
  {
    id: 4,
    name: "Dr. Michael Thompson",
    avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1d584c1ed-1763293494645.png",
    avatarAlt: "Professional headshot of African American man with short hair and beard wearing gray suit",
    role: "Professor, Software Engineering",
    projects: 20,
    rating: 4.9,
    workload: 92,
    status: "active"
  }];


  const resourceAllocationData = [
  { name: "Research", value: 35 },
  { name: "Infrastructure", value: 25 },
  { name: "Faculty Development", value: 20 },
  { name: "Student Programs", value: 15 },
  { name: "Administration", value: 5 }];


  const budgetBreakdownData = [
  {
    category: "Research & Development",
    amount: 840000,
    percentage: 35,
    status: "on-track",
    statusLabel: "On Track"
  },
  {
    category: "Infrastructure & Equipment",
    amount: 600000,
    percentage: 25,
    status: "on-track",
    statusLabel: "On Track"
  },
  {
    category: "Faculty Development",
    amount: 480000,
    percentage: 20,
    status: "warning",
    statusLabel: "Review Needed"
  },
  {
    category: "Student Programs",
    amount: 360000,
    percentage: 15,
    status: "on-track",
    statusLabel: "On Track"
  },
  {
    category: "Administration",
    amount: 120000,
    percentage: 5,
    status: "on-track",
    statusLabel: "On Track"
  }];


  const studentAnalyticsData = [
  {
    label: "Total Enrolled",
    value: "1,847",
    icon: "Users",
    color: "var(--color-primary)",
    change: "+8.3%",
    changeType: "positive"
  },
  {
    label: "Active Projects",
    value: "892",
    icon: "FolderOpen",
    color: "var(--color-accent)",
    change: "+12.1%",
    changeType: "positive"
  },
  {
    label: "Avg. GPA",
    value: "3.68",
    icon: "Award",
    color: "var(--color-success)",
    change: "+0.15",
    changeType: "positive"
  },
  {
    label: "Placement Rate",
    value: "91%",
    icon: "Briefcase",
    color: "var(--color-brand-purple)",
    change: "+5%",
    changeType: "positive"
  }];


  const enrollmentTrendData = [
  { month: "Aug", enrolled: 320, graduated: 0, dropped: 5 },
  { month: "Sep", enrolled: 315, graduated: 0, dropped: 8 },
  { month: "Oct", enrolled: 310, graduated: 0, dropped: 3 },
  { month: "Nov", enrolled: 308, graduated: 0, dropped: 4 },
  { month: "Dec", enrolled: 305, graduated: 0, dropped: 2 },
  { month: "Jan", enrolled: 303, graduated: 285, dropped: 6 }];


  const recentActivitiesData = [
  {
    id: 1,
    type: "approval",
    description: "New research proposal approved for Machine Learning department",
    user: "Dr. Sarah Mitchell",
    timestamp: new Date(Date.now() - 300000),
    badge: "new"
  },
  {
    id: 2,
    type: "review",
    description: "Quarterly performance review completed for 15 faculty members",
    user: "Admin Team",
    timestamp: new Date(Date.now() - 1800000),
    badge: null
  },
  {
    id: 3,
    type: "alert",
    description: "Budget threshold reached for Infrastructure allocation",
    user: "Finance Department",
    timestamp: new Date(Date.now() - 3600000),
    badge: "urgent"
  },
  {
    id: 4,
    type: "submission",
    description: "42 final project submissions received from senior students",
    user: "Student Portal",
    timestamp: new Date(Date.now() - 7200000),
    badge: null
  },
  {
    id: 5,
    type: "project",
    description: "New industry collaboration project initiated with TechCorp Inc.",
    user: "Dr. James Chen",
    timestamp: new Date(Date.now() - 10800000),
    badge: "new"
  }];


  const quickActionsData = [
  {
    label: "Generate Report",
    description: "Create departmental analytics report",
    icon: "FileText",
    color: "var(--color-primary)"
  },
  {
    label: "Review Budgets",
    description: "Analyze resource allocation",
    icon: "DollarSign",
    color: "var(--color-success)"
  },
  {
    label: "Faculty Meeting",
    description: "Schedule department meeting",
    icon: "Calendar",
    color: "var(--color-accent)"
  },
  {
    label: "Approve Projects",
    description: "Review pending proposals",
    icon: "CheckCircle",
    color: "var(--color-brand-purple)"
  }];


  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />

      <div className={`transition-all duration-academic ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <Header />
        
        <main className="pt-16 px-4 md:px-6 lg:px-8 pb-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6 md:mb-8">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-foreground mb-2">
                HOD Analytics Dashboard
              </h1>
              <p className="text-sm md:text-base text-muted-foreground">
                Comprehensive departmental insights and strategic planning tools for academic excellence
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
              {metricsData?.map((metric, index) =>
              <MetricCard key={index} {...metric} />
              )}
            </div>

            <div className="grid grid-cols-1 gap-6 md:gap-8 mb-6 md:mb-8">
              <DepartmentOverview data={departmentOverviewData} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-6 md:mb-8">
              <PerformanceChart
                data={performanceChartData}
                title="Project Performance Trends" />

              <StudentAnalytics
                data={studentAnalyticsData}
                enrollmentTrend={enrollmentTrendData} />

            </div>

            <div className="grid grid-cols-1 gap-6 md:gap-8 mb-6 md:mb-8">
              <FacultyPerformance faculty={facultyData} />
            </div>

            <div className="grid grid-cols-1 gap-6 md:gap-8 mb-6 md:mb-8">
              <ResourceAllocation
                data={resourceAllocationData}
                budgetData={budgetBreakdownData} />

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
              <div className="lg:col-span-2">
                <RecentActivities activities={recentActivitiesData} />
              </div>
              <div>
                <QuickActions actions={quickActionsData} />
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>);

};

export default HODAnalyticsDashboard;