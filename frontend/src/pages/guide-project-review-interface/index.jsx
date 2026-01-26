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

const GuideProjectReviewInterface = () => {
  const navigate = useNavigate();
  const [isMobileView, setIsMobileView] = useState(false);
  const [activePanel, setActivePanel] = useState('document');
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 1024);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const studentData = {
    name: 'Emily Rodriguez',
    rollNumber: 'CS2021045',
    department: 'Computer Science & Engineering',
    year: 'Final Year (2025-26)',
    email: 'emily.rodriguez@university.edu',
    phone: '+1 (555) 123-4567',
    avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_103c16fd1-1763300797899.png",
    avatarAlt: 'Professional headshot of young Hispanic woman with long dark hair wearing navy blazer and white blouse'
  };

  const projectData = {
    title: 'Machine Learning Applications in Healthcare: Predictive Diagnostics and Patient Outcome Optimization',
    phase: 'Final Review',
    submissionDate: 'January 20, 2026',
    reviewDeadline: 'January 30, 2026'
  };

  const documentData = {
    name: 'Final_Project_Report.pdf',
    size: '4.2 MB',
    submittedDate: 'January 20, 2026 at 3:45 PM',
    version: '3.0'
  };

  const activeReviewers = [
  {
    id: 1,
    name: 'Dr. Michael Chen',
    avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_11cb265c2-1763299648576.png",
    avatarAlt: 'Professional headshot of Asian male professor with short black hair wearing gray suit and glasses'
  },
  {
    id: 2,
    name: 'Dr. Sarah Johnson',
    avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_130d9780d-1763301569013.png",
    avatarAlt: 'Professional headshot of Caucasian female professor with blonde hair in bun wearing blue blazer'
  }];


  const handleSubmitReview = (reviewData) => {
    console.log('Review submitted:', reviewData);
    alert('Review submitted successfully! The student will be notified.');
    navigate('/guide-dashboard');
  };

  const handleSaveDraft = () => {
    console.log('Draft saved');
    alert('Review draft saved successfully!');
  };

  const handleExportReport = () => {
    console.log('Exporting evaluation report...');
    setShowExportModal(false);
    alert('Evaluation report exported successfully!');
  };

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