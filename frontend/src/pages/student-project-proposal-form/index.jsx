import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserEmail, apiFetch } from '../../utils/api';
import Header from '../../components/ui/Header';
import Breadcrumbs from '../../components/ui/Breadcrumbs';
import QuickActions from '../../components/ui/QuickActions';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';
import ProgressIndicator from './components/ProgressIndicator';
import SectionNavigation from './components/SectionNavigation';
import DraftPanel from './components/DraftPanel';
import BasicInfoStep from './components/BasicInfoStep';
import ObjectivesStep from './components/ObjectivesStep';
import MethodologyStep from './components/MethodologyStep';
import TimelineStep from './components/TimelineStep';
import ResourcesStep from './components/ResourcesStep';
import ReviewStep from './components/ReviewStep';

const StudentProjectProposalForm = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const _email = getUserEmail() || '';
  const _name = _email
    ? _email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : '';

  const [formData, setFormData] = useState({
    studentName: _name,
    studentId: _email ? _email.split('@')[0].toUpperCase() : '',
    email: _email,
    phone: '',
    department: '',
    academicYear: '',
    projectType: '',
    projectTitle: '',
    guide: '',
    abstract: '',
    objectives: [],
    problemStatement: '',
    expectedOutcomes: [],
    scopeLimitations: '',
    researchMethod: '',
    methodologyDescription: '',
    dataCollectionMethods: [],
    sampleDescription: '',
    analysisTools: [],
    analysisDescription: '',
    ethicalConsiderations: '',
    projectStartDate: '',
    projectEndDate: '',
    milestones: [],
    equipmentRequirements: '',
    softwareRequirements: '',
    budgetItems: [],
    additionalNotes: ''
  });
  const [errors, setErrors] = useState({});
  const [lastSaved, setLastSaved] = useState(null);
  const [autoSaveEnabled] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDraftPanelOpen, setIsDraftPanelOpen] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const steps = [
    { id: 'basic', label: 'Basic Info', validation: 'Required fields' },
    { id: 'objectives', label: 'Objectives', validation: 'Min 3 objectives' },
    { id: 'methodology', label: 'Methodology', validation: 'Research approach' },
    { id: 'timeline', label: 'Timeline', validation: 'Milestones required' },
    { id: 'resources', label: 'Resources', validation: 'Budget details' },
    { id: 'review', label: 'Review', validation: 'Final check' }
  ];

  const submissionChecklist = [
    { id: 1, label: 'All required fields completed', completed: false },
    { id: 2, label: 'Faculty guide selected', completed: !!formData?.guide },
    { id: 3, label: 'At least 3 objectives defined', completed: (formData?.objectives?.length || 0) >= 3 },
    { id: 4, label: 'Methodology described', completed: !!formData?.methodologyDescription },
    { id: 5, label: 'Timeline with milestones', completed: (formData?.milestones?.length || 0) > 0 },
    { id: 6, label: 'Budget breakdown provided', completed: (formData?.budgetItems?.length || 0) > 0 },
    { id: 7, label: 'Abstract minimum 100 words', completed: (formData?.abstract?.split(' ')?.length || 0) >= 100 }
  ];

  const validationStatus = {
    basic: {
      isValid: !!(formData?.projectTitle && formData?.guide && formData?.abstract),
      completedFields: [formData?.projectTitle, formData?.guide, formData?.abstract]?.filter(Boolean)?.length,
      totalFields: 3
    },
    objectives: {
      isValid: (formData?.objectives?.length || 0) >= 3 && !!formData?.problemStatement,
      completedFields: [(formData?.objectives?.length || 0) >= 3, formData?.problemStatement]?.filter(Boolean)?.length,
      totalFields: 2
    },
    methodology: {
      isValid: !!(formData?.researchMethod && formData?.methodologyDescription),
      completedFields: [formData?.researchMethod, formData?.methodologyDescription]?.filter(Boolean)?.length,
      totalFields: 2
    },
    timeline: {
      isValid: !!(formData?.projectStartDate && formData?.projectEndDate && (formData?.milestones?.length || 0) > 0),
      completedFields: [formData?.projectStartDate, formData?.projectEndDate, (formData?.milestones?.length || 0) > 0]?.filter(Boolean)?.length,
      totalFields: 3
    },
    resources: {
      isValid: (formData?.budgetItems?.length || 0) > 0,
      completedFields: [(formData?.budgetItems?.length || 0) > 0]?.filter(Boolean)?.length,
      totalFields: 1
    },
    review: {
      isValid: true,
      completedFields: 1,
      totalFields: 1
    }
  };

  useEffect(() => {
    if (autoSaveEnabled) {
      const timer = setTimeout(() => {
        handleAutoSave();
      }, 30000);
      return () => clearTimeout(timer);
    }
  }, [formData, autoSaveEnabled]);

  const handleAutoSave = () => {
    setLastSaved(new Date());
    console.log('Auto-saved draft:', formData);
  };

  const handleManualSave = () => {
    setLastSaved(new Date());
    console.log('Manually saved draft:', formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors?.[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateStep = (stepIndex) => {
    const newErrors = {};
    const step = steps?.[stepIndex];

    if (step?.id === 'basic') {
      if (!formData?.projectTitle) newErrors.projectTitle = 'Project title is required';
      if (!formData?.guide) newErrors.guide = 'Faculty guide selection is required';
      if (!formData?.abstract) newErrors.abstract = 'Abstract is required';
      if (!formData?.department) newErrors.department = 'Department is required';
      if (!formData?.academicYear) newErrors.academicYear = 'Academic year is required';
      if (!formData?.projectType) newErrors.projectType = 'Project type is required';
    }

    if (step?.id === 'objectives') {
      if (!formData?.objectives || formData?.objectives?.length < 3) {
        newErrors.objectives = 'At least 3 objectives are required';
      }
      if (!formData?.problemStatement) newErrors.problemStatement = 'Problem statement is required';
      if (!formData?.expectedOutcomes || formData?.expectedOutcomes?.length === 0) {
        newErrors.expectedOutcomes = 'At least one expected outcome is required';
      }
    }

    if (step?.id === 'methodology') {
      if (!formData?.researchMethod) newErrors.researchMethod = 'Research method is required';
      if (!formData?.methodologyDescription) newErrors.methodologyDescription = 'Methodology description is required';
      if (!formData?.analysisDescription) newErrors.analysisDescription = 'Data analysis plan is required';
    }

    if (step?.id === 'timeline') {
      if (!formData?.projectStartDate) newErrors.projectStartDate = 'Start date is required';
      if (!formData?.projectEndDate) newErrors.projectEndDate = 'End date is required';
      if (!formData?.milestones || formData?.milestones?.length === 0) {
        newErrors.milestones = 'At least one milestone is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < steps?.length - 1) {
        setCurrentStep(currentStep + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleStepClick = (stepIndex) => {
    setCurrentStep(stepIndex);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditFromReview = (sectionId) => {
    const stepIndex = steps?.findIndex(s => s?.id === sectionId);
    if (stepIndex !== -1) {
      setCurrentStep(stepIndex);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError('');
    try {
      await apiFetch('/student/project/', {
        method: 'POST',
        body: JSON.stringify({
          title:          formData.projectTitle,
          abstract:       formData.abstract,
          department:     formData.department,
          mentor_faculty: formData.guide,
          status:         'SUBMITTED',
        }),
      });
      setShowSubmitModal(false);
      navigate('/student-dashboard');
    } catch (e) {
      setSubmitError(e?.message || 'Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (steps?.[currentStep]?.id) {
      case 'basic':
        return <BasicInfoStep formData={formData} onChange={handleChange} errors={errors} />;
      case 'objectives':
        return <ObjectivesStep formData={formData} onChange={handleChange} errors={errors} />;
      case 'methodology':
        return <MethodologyStep formData={formData} onChange={handleChange} errors={errors} />;
      case 'timeline':
        return <TimelineStep formData={formData} onChange={handleChange} errors={errors} />;
      case 'resources':
        return <ResourcesStep formData={formData} onChange={handleChange} errors={errors} />;
      case 'review':
        return <ReviewStep formData={formData} onEdit={handleEditFromReview} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-16">
        <ProgressIndicator
          currentStep={currentStep}
          steps={steps}
          onStepClick={handleStepClick}
        />

        <div className="flex h-[calc(100vh-128px)]">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden fixed left-4 top-20 z-50 w-12 h-12 bg-primary text-primary-foreground rounded-full shadow-elevation-lg flex items-center justify-center"
          >
            <Icon name={isSidebarOpen ? 'X' : 'Menu'} size={20} />
          </button>

          <div
            className={`fixed lg:static inset-y-0 left-0 z-40 w-64 lg:w-1/5 transform transition-transform lg:transform-none ${
              isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
            }`}
          >
            <SectionNavigation
              steps={steps}
              currentStep={currentStep}
              onStepClick={handleStepClick}
              validationStatus={validationStatus}
            />
          </div>

          {isSidebarOpen && (
            <div
              className="lg:hidden fixed inset-0 bg-background/80 z-30"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          <div className="flex-1 overflow-y-auto px-4 md:px-6 lg:px-8 py-6">
            <div className="max-w-4xl mx-auto">
              <Breadcrumbs />
              <QuickActions />

              <div className="bg-card border border-border rounded-lg p-4 md:p-6 lg:p-8 mb-6">
                {renderStepContent()}
              </div>

              <div className="flex items-center justify-between gap-4 pb-6">
                <Button
                  variant="outline"
                  iconName="ChevronLeft"
                  iconPosition="left"
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                >
                  Previous
                </Button>

                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    iconName="Save"
                    iconPosition="left"
                    onClick={handleManualSave}
                  >
                    Save Draft
                  </Button>

                  {currentStep === steps?.length - 1 ? (
                    <Button
                      variant="default"
                      iconName="Send"
                      iconPosition="right"
                      onClick={() => setShowSubmitModal(true)}
                    >
                      Submit Proposal
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      iconName="ChevronRight"
                      iconPosition="right"
                      onClick={handleNext}
                    >
                      Next
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsDraftPanelOpen(!isDraftPanelOpen)}
            className="lg:hidden fixed right-4 top-20 z-50 w-12 h-12 bg-primary text-primary-foreground rounded-full shadow-elevation-lg flex items-center justify-center"
          >
            <Icon name={isDraftPanelOpen ? 'X' : 'Info'} size={20} />
          </button>

          <div
            className={`fixed lg:static inset-y-0 right-0 z-40 w-80 lg:w-1/5 transform transition-transform lg:transform-none ${
              isDraftPanelOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
            }`}
          >
            <DraftPanel
              lastSaved={lastSaved}
              autoSaveEnabled={autoSaveEnabled}
              submissionChecklist={submissionChecklist}
              onManualSave={handleManualSave}
            />
          </div>

          {isDraftPanelOpen && (
            <div
              className="lg:hidden fixed inset-0 bg-background/80 z-30"
              onClick={() => setIsDraftPanelOpen(false)}
            />
          )}
        </div>
      </div>
      {showSubmitModal && (
        <>
          <div className="fixed inset-0 bg-background/80 z-[100]" onClick={() => setShowSubmitModal(false)} />
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-lg shadow-elevation-2xl max-w-md w-full p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Icon name="Send" size={24} color="var(--color-primary)" />
                </div>
                <div>
                  <h3 className="text-lg font-heading font-semibold text-foreground mb-2">
                    Submit Project Proposal?
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Once submitted, your proposal will be sent to your selected faculty guide for review. You will not be able to edit it until feedback is provided.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-warning/5 border border-warning/20 rounded-lg mb-6">
                <p className="text-xs text-muted-foreground">
                  <strong>Note:</strong> Make sure you have reviewed all sections carefully. The review process typically takes 5-7 business days.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  fullWidth
                  disabled={isSubmitting}
                  onClick={() => { setShowSubmitModal(false); setSubmitError(''); }}
                >
                  Cancel
                </Button>
                <Button
                  variant="default"
                  fullWidth
                  iconName={isSubmitting ? 'Loader2' : 'Send'}
                  iconPosition="right"
                  disabled={isSubmitting}
                  onClick={handleSubmit}
                >
                  {isSubmitting ? 'Submitting…' : 'Confirm Submit'}
                </Button>
              </div>
              {submitError && (
                <p className="mt-3 text-xs text-error flex items-center gap-1.5">
                  <Icon name="AlertCircle" size={14} color="currentColor" />
                  {submitError}
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default StudentProjectProposalForm;