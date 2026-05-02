import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/ui/Header';
import Breadcrumbs from '../../components/ui/Breadcrumbs';
import QuickActions from '../../components/ui/QuickActions';
import DocumentViewer from './components/DocumentViewer';
import EvaluationForm from './components/EvaluationForm';
import StudentContextHeader from './components/StudentContextHeader';
import CollaborationIndicator from './components/CollaborationIndicator';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import {
  fetchMentoredProjects,
  fetchFacultyProjectProgress,
  isDemoSession,
  getUserName,
  getUserEmail,
} from '../../utils/api';

// Demo fallbacks
const DEMO_STUDENT = {
  name: 'Select a Project',
  rollNumber: '—',
  department: '—',
  year: '—',
  email: '—',
  phone: '—',
  avatar: null,
  avatarAlt: '',
};
const DEMO_PROJECT = {
  title: 'No project selected',
  phase: 'Pending',
  submissionDate: '—',
  reviewDeadline: '—',
};
const DEMO_DOC = {
  name: 'No document',
  size: '—',
  submittedDate: '—',
  version: '1.0',
};

const GuideProjectReviewInterface = () => {
  const navigate = useNavigate();
  const [isMobileView, setIsMobileView] = useState(false);
  const [activePanel, setActivePanel] = useState('document');
  const [showExportModal, setShowExportModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const [studentData, setStudentData] = useState(DEMO_STUDENT);
  const [projectData, setProjectData] = useState(DEMO_PROJECT);
  const [documentData, setDocumentData] = useState(DEMO_DOC);
  const [activeReviewers, setActiveReviewers] = useState([]);

  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth < 1024);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const isDemo = isDemoSession();
    if (isDemo) {
      // Demo: show placeholder with the logged-in reviewer's name
      const reviewerName = getUserName('Reviewer');
      setActiveReviewers([{ id: 1, name: reviewerName, avatar: null, avatarAlt: '' }]);
      setLoading(false);
      return;
    }

    fetchMentoredProjects()
      .then(projects => {
        // Load data from the first (most recent) mentored project
        const project = projects?.[0];
        if (!project) {
          setLoading(false);
          return;
        }

        setProjectData({
          title: project.title || 'Untitled Project',
          phase: project.status?.replace(/_/g, ' ') || 'In Progress',
          submissionDate: project.submitted_at
            ? new Date(project.submitted_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
            : '—',
          reviewDeadline: project.deadline
            ? new Date(project.deadline).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
            : '—',
        });

        // Build student context from project data
        setStudentData({
          name: `Student #${project.team_leader_student}`,
          rollNumber: `ID-${project.team_leader_student}`,
          department: `Dept #${project.department}`,
          year: 'Current Student',
          email: '—',
          phone: '—',
          avatar: null,
          avatarAlt: '',
        });

        setDocumentData({
          name: `${project.title?.slice(0, 30)}_Report.pdf`,
          size: '—',
          submittedDate: project.submitted_at
            ? new Date(project.submitted_at).toLocaleString()
            : '—',
          version: '1.0',
        });

        // Active reviewer = logged-in user
        const reviewerName = getUserName('Reviewer');
        const reviewerEmail = getUserEmail() || '';
        setActiveReviewers([
          { id: 1, name: reviewerName, avatar: null, avatarAlt: reviewerEmail },
        ]);
      })
      .catch(() => {
        // Keep demo fallback but show logged-in reviewer
        const reviewerName = getUserName('Reviewer');
        setActiveReviewers([{ id: 1, name: reviewerName, avatar: null, avatarAlt: '' }]);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSubmitReview = (reviewData) => {
    console.log('Review submitted:', reviewData);
    alert('Review submitted successfully! The student will be notified.');
    navigate('/guide-dashboard');
  };

  const handleSaveDraft = () => {
    alert('Review draft saved successfully!');
  };

  const handleExportReport = () => {
    setShowExportModal(false);
    alert('Evaluation report exported successfully!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Icon name="Loader2" size={40} color="var(--color-primary)" className="animate-spin" />
          <p className="text-muted-foreground">Loading project data…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-16">
        <div className="max-w-[1920px] mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-6">
          <Breadcrumbs />

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4 md:mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-foreground mb-2">
                Project Review Interface
              </h1>
              <p className="text-sm md:text-base text-muted-foreground">
                Comprehensive evaluation workspace for faculty project reviews
              </p>
            </div>
            <Button
              variant="outline"
              iconName="FileDown"
              iconPosition="left"
              onClick={() => setShowExportModal(true)}>
              Export Report
            </Button>
          </div>

          <QuickActions />

          <div className="space-y-4 md:space-y-6">
            <StudentContextHeader student={studentData} project={projectData} />

            <CollaborationIndicator activeReviewers={activeReviewers} />

            {isMobileView ?
            <div className="space-y-4">
                <div className="flex gap-2 p-1 bg-muted rounded-lg">
                  <button
                  onClick={() => setActivePanel('document')}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-smooth ${
                  activePanel === 'document' ?
                  'bg-background text-foreground shadow-elevation-sm' : 'text-muted-foreground hover:text-foreground'}`
                  }>
                    <Icon name="FileText" size={16} className="inline mr-2" />
                    Document
                  </button>
                  <button
                  onClick={() => setActivePanel('evaluation')}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-smooth ${
                  activePanel === 'evaluation' ? 'bg-background text-foreground shadow-elevation-sm' : 'text-muted-foreground hover:text-foreground'}`
                  }>
                    <Icon name="ClipboardCheck" size={16} className="inline mr-2" />
                    Evaluation
                  </button>
                </div>

                <div className="h-[600px]">
                  {activePanel === 'document' ?
                <DocumentViewer document={documentData} onAnnotate={() => {}} /> :
                <EvaluationForm onSubmit={handleSubmitReview} onSaveDraft={handleSaveDraft} />
                }
                </div>
              </div> :

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6">
                <div className="lg:col-span-2 h-[calc(100vh-400px)] min-h-[600px]">
                  <DocumentViewer document={documentData} onAnnotate={() => {}} />
                </div>

                <div className="lg:col-span-3 h-[calc(100vh-400px)] min-h-[600px]">
                  <EvaluationForm onSubmit={handleSubmitReview} onSaveDraft={handleSaveDraft} />
                </div>
              </div>
            }

            <div className="bg-muted/30 border border-border rounded-lg p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon name="Info" size={20} color="var(--color-primary)" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-1">Review Guidelines</h4>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      Please ensure all evaluation criteria are scored before submitting. Use keyboard shortcuts for faster navigation: Ctrl+← / Ctrl+→ for pages, number keys for quick scoring.
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" iconName="HelpCircle" iconPosition="left">
                  Help
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {showExportModal &&
      <>
          <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[1030]"
          onClick={() => setShowExportModal(false)} />

          <div className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-md bg-card border border-border rounded-lg shadow-elevation-2xl z-[1040] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4 border-b border-border">
              <h3 className="text-base md:text-lg font-heading font-semibold text-foreground">Export Evaluation Report</h3>
              <button
              onClick={() => setShowExportModal(false)}
              className="p-2 hover:bg-muted rounded-lg transition-smooth">
                <Icon name="X" size={20} color="var(--color-foreground)" />
              </button>
            </div>

            <div className="p-4 md:p-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                Generate a comprehensive evaluation report including all scores, comments, and review history.
              </p>

              <div className="space-y-2">
                <label className="flex items-center gap-2 p-3 border border-border rounded-lg hover:bg-muted/50 transition-smooth cursor-pointer">
                  <input type="radio" name="format" value="pdf" defaultChecked className="w-4 h-4" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-foreground">PDF Format</div>
                    <div className="text-xs text-muted-foreground">Detailed report with formatting</div>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-3 border border-border rounded-lg hover:bg-muted/50 transition-smooth cursor-pointer">
                  <input type="radio" name="format" value="excel" className="w-4 h-4" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-foreground">Excel Format</div>
                    <div className="text-xs text-muted-foreground">Structured data for analysis</div>
                  </div>
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" fullWidth onClick={() => setShowExportModal(false)}>
                  Cancel
                </Button>
                <Button variant="default" fullWidth iconName="Download" iconPosition="left" onClick={handleExportReport}>
                  Export
                </Button>
              </div>
            </div>
          </div>
        </>
      }
    </div>);

};

export default GuideProjectReviewInterface;