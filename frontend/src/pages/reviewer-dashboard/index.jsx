import React, { useState } from 'react';
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

const ReviewerDashboard = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('queue');
  const [filterDepartment, setFilterDepartment] = useState('all');

  const departmentOptions = [
  { value: 'all', label: 'All Departments' },
  { value: 'computer-science', label: 'Computer Science' },
  { value: 'electrical', label: 'Electrical Engineering' },
  { value: 'mechanical', label: 'Mechanical Engineering' },
  { value: 'civil', label: 'Civil Engineering' }];


  const statsData = [
  {
    title: "Pending Evaluations",
    value: "12",
    change: "+3 new",
    changeType: "positive",
    icon: "Clock",
    iconColor: "bg-warning/10 text-warning"
  },
  {
    title: "In Progress",
    value: "5",
    change: "2 due today",
    changeType: "neutral",
    icon: "FileEdit",
    iconColor: "bg-accent/10 text-accent"
  },
  {
    title: "Completed This Month",
    value: "28",
    change: "+12%",
    changeType: "positive",
    icon: "CheckCircle2",
    iconColor: "bg-success/10 text-success"
  },
  {
    title: "Average Score",
    value: "82.5",
    change: "+4.2%",
    changeType: "positive",
    icon: "TrendingUp",
    iconColor: "bg-primary/10 text-primary"
  }];


  const evaluationQueue = [
  {
    id: 1,
    projectTitle: "AI-Powered Healthcare Diagnosis System",
    projectDescription: "Development of machine learning model for early disease detection using medical imaging and patient data analysis with deep learning algorithms.",
    studentName: "Sarah Johnson",
    studentAvatar: "https://img.rocket.new/generatedImages/rocket_gen_img_103b528db-1763293982935.png",
    studentAvatarAlt: "Professional headshot of young woman with brown hair in white blouse smiling at camera",
    department: "Computer Science",
    status: "pending",
    priority: "high",
    dueDate: "Jan 28, 2026",
    submittedDate: "Jan 24, 2026",
    documentsCount: 8,
    progress: 0
  },
  {
    id: 2,
    projectTitle: "Sustainable Energy Grid Optimization",
    projectDescription: "Smart grid management system using IoT sensors and predictive analytics to optimize renewable energy distribution and reduce carbon footprint.",
    studentName: "Michael Chen",
    studentAvatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1cb933d20-1763293416126.png",
    studentAvatarAlt: "Professional headshot of Asian man with black hair in navy suit and glasses",
    department: "Electrical Engineering",
    status: "in-progress",
    priority: "medium",
    dueDate: "Jan 30, 2026",
    submittedDate: "Jan 23, 2026",
    documentsCount: 12,
    progress: 45
  },
  {
    id: 3,
    projectTitle: "Autonomous Vehicle Navigation System",
    projectDescription: "Advanced computer vision and sensor fusion system for real-time obstacle detection and path planning in urban environments.",
    studentName: "Emily Rodriguez",
    studentAvatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1420e84f9-1763293742638.png",
    studentAvatarAlt: "Professional headshot of Hispanic woman with long dark hair in professional attire",
    department: "Mechanical Engineering",
    status: "pending",
    priority: "high",
    dueDate: "Jan 27, 2026",
    submittedDate: "Jan 25, 2026",
    documentsCount: 15,
    progress: 0
  },
  {
    id: 4,
    projectTitle: "Smart Building Management Platform",
    projectDescription: "IoT-based system for monitoring and controlling building systems including HVAC, lighting, and security with energy efficiency optimization.",
    studentName: "David Kim",
    studentAvatar: "https://img.rocket.new/generatedImages/rocket_gen_img_13a48293d-1763296098326.png",
    studentAvatarAlt: "Professional headshot of young Asian man with short black hair in gray suit",
    department: "Civil Engineering",
    status: "in-progress",
    priority: "low",
    dueDate: "Feb 02, 2026",
    submittedDate: "Jan 22, 2026",
    documentsCount: 10,
    progress: 65
  },
  {
    id: 5,
    projectTitle: "Blockchain-Based Supply Chain Tracker",
    projectDescription: "Decentralized platform for transparent supply chain management with real-time tracking and automated smart contract execution.",
    studentName: "Jessica Martinez",
    studentAvatar: "https://img.rocket.new/generatedImages/rocket_gen_img_17695bf26-1763296074694.png",
    studentAvatarAlt: "Professional headshot of woman with blonde hair in blue business suit",
    department: "Computer Science",
    status: "overdue",
    priority: "high",
    dueDate: "Jan 25, 2026",
    submittedDate: "Jan 20, 2026",
    documentsCount: 9,
    progress: 20
  }];


  const assessmentHistory = [
  {
    id: 1,
    projectTitle: "Machine Learning Model for Predictive Maintenance",
    projectImage: "https://img.rocket.new/generatedImages/rocket_gen_img_113617219-1764737686388.png",
    projectImageAlt: "Computer screen displaying colorful data visualization charts and machine learning model graphs",
    studentName: "Alex Thompson",
    studentAvatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1eb27b9bd-1763296842514.png",
    studentAvatarAlt: "Professional headshot of man with brown hair and beard in casual business attire",
    department: "Computer Science",
    score: 88,
    status: "completed",
    evaluationDate: "Jan 20, 2026"
  },
  {
    id: 2,
    projectTitle: "Renewable Energy Storage System Design",
    projectImage: "https://images.unsplash.com/photo-1685905735715-6e16669143fd",
    projectImageAlt: "Solar panels and wind turbines in green field under blue sky with white clouds",
    studentName: "Maria Garcia",
    studentAvatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1123f2aed-1763293403622.png",
    studentAvatarAlt: "Professional headshot of Hispanic woman with dark hair in professional blazer",
    department: "Electrical Engineering",
    score: 92,
    status: "completed",
    evaluationDate: "Jan 18, 2026"
  },
  {
    id: 3,
    projectTitle: "Advanced Robotics Control System",
    projectImage: "https://img.rocket.new/generatedImages/rocket_gen_img_11d8d2592-1768245051030.png",
    projectImageAlt: "Industrial robotic arm with multiple joints in modern manufacturing facility",
    studentName: "James Wilson",
    studentAvatar: "https://img.rocket.new/generatedImages/rocket_gen_img_182183743-1763294553218.png",
    studentAvatarAlt: "Professional headshot of African American man with short hair in dark suit",
    department: "Mechanical Engineering",
    score: 85,
    status: "completed",
    evaluationDate: "Jan 15, 2026"
  },
  {
    id: 4,
    projectTitle: "Structural Health Monitoring System",
    projectImage: "https://img.rocket.new/generatedImages/rocket_gen_img_1611ce9da-1766711492853.png",
    projectImageAlt: "Modern bridge structure with sensors and monitoring equipment at sunset",
    studentName: "Sophie Anderson",
    studentAvatar: "https://img.rocket.new/generatedImages/rocket_gen_img_103b528db-1763293982935.png",
    studentAvatarAlt: "Professional headshot of woman with red hair in white blouse smiling",
    department: "Civil Engineering",
    score: 78,
    status: "completed",
    evaluationDate: "Jan 12, 2026"
  },
  {
    id: 5,
    projectTitle: "Natural Language Processing Chatbot",
    projectImage: "https://img.rocket.new/generatedImages/rocket_gen_img_1b71551de-1766565517422.png",
    projectImageAlt: "Smartphone screen showing AI chatbot interface with conversation bubbles",
    studentName: "Ryan Lee",
    studentAvatar: "https://img.rocket.new/generatedImages/rocket_gen_img_11a2a08ae-1763295050712.png",
    studentAvatarAlt: "Professional headshot of Asian man with glasses in blue shirt",
    department: "Computer Science",
    score: 90,
    status: "completed",
    evaluationDate: "Jan 10, 2026"
  },
  {
    id: 6,
    projectTitle: "Smart Grid Load Balancing Algorithm",
    projectImage: "https://img.rocket.new/generatedImages/rocket_gen_img_12fe45133-1767848546090.png",
    projectImageAlt: "Electrical power grid infrastructure with transmission towers at dusk",
    studentName: "Emma Brown",
    studentAvatar: "https://img.rocket.new/generatedImages/rocket_gen_img_10b6fa508-1763298267422.png",
    studentAvatarAlt: "Professional headshot of woman with short blonde hair in gray blazer",
    department: "Electrical Engineering",
    score: 86,
    status: "completed",
    evaluationDate: "Jan 08, 2026"
  },
  {
    id: 7,
    projectTitle: "Automated Manufacturing Process Optimization",
    projectImage: "https://img.rocket.new/generatedImages/rocket_gen_img_137603532-1767822152591.png",
    projectImageAlt: "Modern automated factory floor with robotic assembly line and machinery",
    studentName: "Daniel Martinez",
    studentAvatar: "https://img.rocket.new/generatedImages/rocket_gen_img_11b5525b0-1763293503742.png",
    studentAvatarAlt: "Professional headshot of young Hispanic man with black hair in white shirt",
    department: "Mechanical Engineering",
    score: 83,
    status: "completed",
    evaluationDate: "Jan 05, 2026"
  },
  {
    id: 8,
    projectTitle: "Earthquake-Resistant Building Design",
    projectImage: "https://images.unsplash.com/photo-1719503988994-21cdd004b981",
    projectImageAlt: "Modern skyscraper with innovative structural design against blue sky",
    studentName: "Olivia Taylor",
    studentAvatar: "https://img.rocket.new/generatedImages/rocket_gen_img_141e51895-1763296519617.png",
    studentAvatarAlt: "Professional headshot of woman with brown hair in professional attire",
    department: "Civil Engineering",
    score: 94,
    status: "completed",
    evaluationDate: "Jan 03, 2026"
  },
  {
    id: 9,
    projectTitle: "Computer Vision Object Detection System",
    projectImage: "https://img.rocket.new/generatedImages/rocket_gen_img_187abd59f-1764641542942.png",
    projectImageAlt: "Computer screen showing object detection software with bounding boxes on images",
    studentName: "William Davis",
    studentAvatar: "https://img.rocket.new/generatedImages/rocket_gen_img_16ef853bd-1763291882113.png",
    studentAvatarAlt: "Professional headshot of man with gray hair and beard in dark suit",
    department: "Computer Science",
    score: 87,
    status: "completed",
    evaluationDate: "Dec 30, 2025"
  },
  {
    id: 10,
    projectTitle: "Wireless Power Transfer System",
    projectImage: "https://images.unsplash.com/photo-1587749091230-fb8a034d695c",
    projectImageAlt: "Wireless charging pad with smartphone and electronic components",
    studentName: "Isabella Moore",
    studentAvatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1020527b4-1763300977478.png",
    studentAvatarAlt: "Professional headshot of young woman with long dark hair in blue dress",
    department: "Electrical Engineering",
    score: 91,
    status: "completed",
    evaluationDate: "Dec 28, 2025"
  }];


  const rubricData = {
    title: "AI-Powered Healthcare Diagnosis System",
    description: "Comprehensive evaluation rubric for machine learning project assessment",
    totalScore: 82,
    maxScore: 100,
    reviewerName: "Dr. Robert Anderson",
    evaluationDate: "Jan 20, 2026",
    criteria: [
    {
      id: 1,
      name: "Technical Implementation",
      description: "Quality of code, architecture, and technical execution",
      score: 85,
      maxScore: 100,
      feedback: "Excellent implementation of machine learning algorithms with well-structured code. Minor improvements needed in error handling and edge case management.",
      subCriteria: [
      { id: 1, name: "Code Quality", score: 88, maxScore: 100 },
      { id: 2, name: "Architecture Design", score: 82, maxScore: 100 },
      { id: 3, name: "Algorithm Efficiency", score: 90, maxScore: 100 },
      { id: 4, name: "Error Handling", score: 75, maxScore: 100 }]

    },
    {
      id: 2,
      name: "Innovation & Creativity",
      description: "Originality of approach and creative problem-solving",
      score: 78,
      maxScore: 100,
      feedback: "Good application of existing techniques with some novel approaches to data preprocessing. Could benefit from more innovative feature engineering.",
      subCriteria: [
      { id: 1, name: "Novel Approach", score: 75, maxScore: 100 },
      { id: 2, name: "Problem Solving", score: 82, maxScore: 100 },
      { id: 3, name: "Feature Engineering", score: 70, maxScore: 100 },
      { id: 4, name: "Methodology", score: 85, maxScore: 100 }]

    },
    {
      id: 3,
      name: "Documentation & Presentation",
      description: "Quality of documentation, reports, and presentation materials",
      score: 80,
      maxScore: 100,
      feedback: "Well-documented code and comprehensive technical report. Presentation could include more visual aids and real-world application examples.",
      subCriteria: [
      { id: 1, name: "Code Documentation", score: 85, maxScore: 100 },
      { id: 2, name: "Technical Report", score: 82, maxScore: 100 },
      { id: 3, name: "Visual Presentation", score: 75, maxScore: 100 },
      { id: 4, name: "User Manual", score: 78, maxScore: 100 }]

    },
    {
      id: 4,
      name: "Testing & Validation",
      description: "Thoroughness of testing and validation procedures",
      score: 86,
      maxScore: 100,
      feedback: "Comprehensive testing strategy with good coverage of edge cases. Validation methodology is robust with appropriate metrics.",
      subCriteria: [
      { id: 1, name: "Unit Testing", score: 88, maxScore: 100 },
      { id: 2, name: "Integration Testing", score: 85, maxScore: 100 },
      { id: 3, name: "Performance Testing", score: 90, maxScore: 100 },
      { id: 4, name: "Validation Metrics", score: 82, maxScore: 100 }]

    }]

  };

  const comparativeData = [
  {
    name: "Technical",
    currentProject: 85,
    departmentAverage: 78,
    universityAverage: 75
  },
  {
    name: "Innovation",
    currentProject: 78,
    departmentAverage: 80,
    universityAverage: 76
  },
  {
    name: "Documentation",
    currentProject: 80,
    departmentAverage: 75,
    universityAverage: 73
  },
  {
    name: "Testing",
    currentProject: 86,
    departmentAverage: 82,
    universityAverage: 79
  },
  {
    name: "Presentation",
    currentProject: 82,
    departmentAverage: 77,
    universityAverage: 74
  }];


  const tabs = [
  { id: 'queue', label: 'Evaluation Queue', icon: 'Inbox', count: evaluationQueue?.length },
  { id: 'history', label: 'Assessment History', icon: 'History', count: assessmentHistory?.length },
  { id: 'rubrics', label: 'Scoring Rubrics', icon: 'ClipboardList', count: 1 },
  { id: 'analytics', label: 'Comparative Analysis', icon: 'BarChart3', count: null }];


  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />

      <Header />
      <main className={`pt-16 transition-all duration-academic ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
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
              <Select
                options={departmentOptions}
                value={filterDepartment}
                onChange={setFilterDepartment}
                className="w-full sm:w-56" />

              <Button
                variant="default"
                iconName="Plus"
                iconPosition="left"
                className="w-full sm:w-auto">

                New Evaluation
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
            {statsData?.map((stat, index) =>
            <StatCard key={index} {...stat} />
            )}
          </div>

          <div className="mb-6 md:mb-8">
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="flex items-center overflow-x-auto">
                {tabs?.map((tab) =>
                <button
                  key={tab?.id}
                  onClick={() => setActiveTab(tab?.id)}
                  className={`flex items-center gap-2 px-4 md:px-6 py-3 md:py-4 border-b-2 transition-all duration-academic whitespace-nowrap ${
                  activeTab === tab?.id ?
                  'border-primary text-primary bg-primary/5' : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'}`
                  }>

                    <Icon name={tab?.icon} size={18} />
                    <span className="text-sm font-medium">{tab?.label}</span>
                    {tab?.count !== null &&
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  activeTab === tab?.id ?
                  'bg-primary text-primary-foreground' :
                  'bg-muted text-muted-foreground'}`
                  }>
                        {tab?.count}
                      </span>
                  }
                  </button>
                )}
              </div>
            </div>
          </div>

          {activeTab === 'queue' &&
          <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  {evaluationQueue?.map((evaluation) =>
                <EvaluationCard key={evaluation?.id} evaluation={evaluation} />
                )}
                </div>
                <div className="space-y-6">
                  <QuickActionsPanel />
                  <div className="bg-card border border-border rounded-lg p-4 md:p-6">
                    <h3 className="text-lg font-heading font-semibold text-foreground mb-4">
                      Upcoming Deadlines
                    </h3>
                    <div className="space-y-3">
                      {evaluationQueue?.slice(0, 3)?.map((item) =>
                    <div key={item?.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                          <Icon name="Calendar" size={16} className="text-muted-foreground flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground line-clamp-1">
                              {item?.projectTitle}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Due: {item?.dueDate}
                            </p>
                          </div>
                        </div>
                    )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          }

          {activeTab === 'history' &&
          <AssessmentHistoryTable assessments={assessmentHistory} />
          }

          {activeTab === 'rubrics' &&
          <div className="space-y-6">
              <ScoringRubricCard rubric={rubricData} />
            </div>
          }

          {activeTab === 'analytics' &&
          <div className="space-y-6">
              <ComparativeAnalysisChart data={comparativeData} type="bar" />
              <ComparativeAnalysisChart data={comparativeData} type="radar" />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-heading font-semibold text-foreground">
                      Evaluation Trends
                    </h3>
                    <Icon name="TrendingUp" size={20} className="text-success" />
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Average Score</span>
                        <span className="text-sm font-semibold text-foreground">82.5</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-success" style={{ width: '82.5%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Completion Rate</span>
                        <span className="text-sm font-semibold text-foreground">94%</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: '94%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">On-Time Delivery</span>
                        <span className="text-sm font-semibold text-foreground">88%</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-accent" style={{ width: '88%' }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-heading font-semibold text-foreground">
                      Department Rankings
                    </h3>
                    <Icon name="Award" size={20} className="text-warning" />
                  </div>
                  <div className="space-y-3">
                    {[
                  { dept: 'Computer Science', score: 85.2, rank: 1 },
                  { dept: 'Electrical Eng.', score: 82.8, rank: 2 },
                  { dept: 'Mechanical Eng.', score: 79.5, rank: 3 },
                  { dept: 'Civil Engineering', score: 76.3, rank: 4 }]?.
                  map((item) =>
                  <div key={item?.dept} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                            {item?.rank}
                          </span>
                          <span className="text-sm text-foreground">{item?.dept}</span>
                        </div>
                        <span className="text-sm font-semibold text-muted-foreground">
                          {item?.score}
                        </span>
                      </div>
                  )}
                  </div>
                </div>

                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-heading font-semibold text-foreground">
                      Quality Metrics
                    </h3>
                    <Icon name="Target" size={20} className="text-accent" />
                  </div>
                  <div className="space-y-4">
                    <div className="text-center p-4 rounded-lg bg-success/10 border border-success/20">
                      <p className="text-xs text-success mb-1">Excellence Rate</p>
                      <p className="text-2xl font-heading font-bold text-success">32%</p>
                      <p className="text-xs text-muted-foreground mt-1">Scores &gt; 85</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-warning/10 border border-warning/20">
                      <p className="text-xs text-warning mb-1">Improvement Needed</p>
                      <p className="text-2xl font-heading font-bold text-warning">8%</p>
                      <p className="text-xs text-muted-foreground mt-1">Scores &lt; 60</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          }
        </div>
      </main>
      <Footer />
    </div>);

};

export default ReviewerDashboard;