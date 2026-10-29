import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, fetchStudentProject } from '../../utils/api';
import Header from '../../components/ui/Header';
import Breadcrumbs from '../../components/ui/Breadcrumbs';
import Button from '../../components/ui/Button';
import ProgressIndicator from './components/ProgressIndicator';
import SectionNavigation from './components/SectionNavigation';
import BasicInfoStep from './components/BasicInfoStep';
import ObjectivesStep from './components/ObjectivesStep';
import MethodologyStep from './components/MethodologyStep';
import TimelineStep from './components/TimelineStep';
import ResourcesStep from './components/ResourcesStep';
import ReviewStep from './components/ReviewStep';

const steps = [
  { id: 'basic', label: 'Basic Info', validation: 'Required fields' },
  { id: 'objectives', label: 'Objectives', validation: 'Optional' },
  { id: 'methodology', label: 'Methodology', validation: 'Optional' },
  { id: 'timeline', label: 'Timeline', validation: 'Optional' },
  { id: 'resources', label: 'Resources', validation: 'Optional' },
  { id: 'review', label: 'Review', validation: 'Final check' },
];
const blankForm = { projectTitle: '', guide: '', abstract: '', objectives: [], milestones: [], budgetItems: [] };

const StudentProjectProposalForm = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState(blankForm);
  const [mentors, setMentors] = useState([]);
  const [department, setDepartment] = useState(null);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [errors, setErrors] = useState({});
  const [bannerError, setBannerError] = useState('');
  const [success, setSuccess] = useState('');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const editable = !project || ['DRAFT', 'REJECTED'].includes(project.status);

  const load = useCallback(async () => {
    setLoading(true); setLoadError('');
    try {
      const [existingProject, mentorResponse] = await Promise.all([
        fetchStudentProject(), apiFetch('/student/mentors/'),
      ]);
      setProject(existingProject || null);
      setDepartment(mentorResponse?.department || null);
      setMentors((mentorResponse?.mentors || []).map(item => ({ value: String(item.id), label: item.name })));
      if (existingProject) setFormData({ ...blankForm, projectTitle: existingProject.title || '', abstract: existingProject.abstract || '', guide: existingProject.mentor_faculty == null ? '' : String(existingProject.mentor_faculty) });
    } catch (error) { setLoadError(error.message || 'Could not load your project details.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const handleChange = (field, value) => {
    setFormData(previous => ({ ...previous, [field]: value }));
    setErrors(previous => ({ ...previous, [field]: undefined }));
    setBannerError(''); setSuccess('');
  };
  const validate = () => {
    const next = {};
    if (!formData.projectTitle.trim()) next.projectTitle = 'Project title is required.';
    if (!formData.abstract.trim()) next.abstract = 'Abstract is required.';
    if (!formData.guide) next.guide = 'Select a faculty guide.';
    setErrors(next); return Object.keys(next).length === 0;
  };
  const save = async (status) => {
    setSuccess(''); setBannerError('');
    if (!department) { setBannerError('An administrator must assign your department before you can submit a project.'); return; }
    if (!validate()) { setCurrentStep(0); return; }
    setRequesting(true);
    const payload = { title: formData.projectTitle.trim(), abstract: formData.abstract.trim(), mentor_faculty: Number(formData.guide) };
    if (status) payload.status = status;
    try {
      const saved = await apiFetch(project ? `/student/project/${project.id}/` : '/student/project/', {
        method: project ? 'PATCH' : 'POST', body: JSON.stringify(payload),
      });
      setProject(saved || { ...project, ...payload, status: status || project?.status || 'DRAFT' });
      if (status === 'SUBMITTED') { setShowSubmitModal(false); navigate('/student-dashboard'); }
      else setSuccess('Draft saved successfully.');
    } catch (error) {
      const data = error.data || {};
      const fieldErrors = {};
      if (data.title) fieldErrors.projectTitle = Array.isArray(data.title) ? data.title.join(' ') : data.title;
      if (data.abstract) fieldErrors.abstract = Array.isArray(data.abstract) ? data.abstract.join(' ') : data.abstract;
      if (data.mentor_faculty) fieldErrors.guide = Array.isArray(data.mentor_faculty) ? data.mentor_faculty.join(' ') : data.mentor_faculty;
      setErrors(fieldErrors);
      const rest = Object.keys(data).filter(key => !['title', 'abstract', 'mentor_faculty'].includes(key));
      setBannerError(rest.length ? rest.map(key => `${key}: ${Array.isArray(data[key]) ? data[key].join(' ') : data[key]}`).join(' ') : (Object.keys(fieldErrors).length ? '' : error.message));
    } finally { setRequesting(false); }
  };
  const validationStatus = Object.fromEntries(steps.map(step => [step.id, { isValid: step.id !== 'basic' || Boolean(formData.projectTitle && formData.abstract && formData.guide), completedFields: 0, totalFields: 1 }]));
  const renderStep = () => {
    const id = steps[currentStep].id;
    if (id === 'basic') return <BasicInfoStep formData={{ ...formData, departmentName: department?.name || '' }} onChange={handleChange} errors={errors} mentors={mentors} />;
    if (id === 'objectives') return <ObjectivesStep formData={formData} onChange={handleChange} errors={{}} />;
    if (id === 'methodology') return <MethodologyStep formData={formData} onChange={handleChange} errors={{}} />;
    if (id === 'timeline') return <TimelineStep formData={formData} onChange={handleChange} errors={{}} />;
    if (id === 'resources') return <ResourcesStep formData={formData} onChange={handleChange} errors={{}} />;
    return <ReviewStep formData={{ ...formData, department: department?.name }} onEdit={section => setCurrentStep(Math.max(0, steps.findIndex(step => step.id === section)))} />;
  };
  const locked = project && !editable;

  return <div className="min-h-screen bg-background"><Header /><div className="pt-16">
    <ProgressIndicator currentStep={currentStep} steps={steps} onStepClick={setCurrentStep} />
    <div className="max-w-6xl mx-auto p-4 md:p-8"><Breadcrumbs />
      {loading ? <p className="p-8 text-center">Loading your project and department…</p> : loadError ? <div role="alert" className="p-4 border rounded-lg">{loadError} <Button onClick={load}>Retry</Button></div> : <>
        {!department && <div role="alert" className="mb-4 p-4 border border-warning rounded-lg">An administrator must assign your department before you can submit a project.</div>}
        {locked ? <section className="my-6 rounded-lg border p-6"><h1 className="text-xl font-semibold">This project can no longer be edited</h1><p className="mt-2">Status: {project.status}</p><h2 className="mt-4 font-medium">{project.title}</h2><p className="mt-2 whitespace-pre-wrap">{project.abstract}</p></section> : <>
          {bannerError && <div role="alert" className="mb-4 p-3 border border-error rounded-lg text-error">{bannerError}</div>}
          {success && <div role="status" className="mb-4 p-3 border border-success rounded-lg">{success}</div>}
          {['objectives', 'methodology', 'timeline', 'resources'].includes(steps[currentStep].id) && <p className="mb-4 rounded-lg bg-primary/5 border border-primary/20 p-3 text-sm">These sections are for your own planning; only the title, abstract and guide are saved with your submission.</p>}
          <div className="grid lg:grid-cols-[16rem_1fr] gap-6"><SectionNavigation steps={steps} currentStep={currentStep} onStepClick={setCurrentStep} validationStatus={validationStatus} /><section className="min-w-0 rounded-lg border bg-card p-5">{renderStep()}
            <div className="mt-6 flex flex-wrap justify-between gap-3"><Button variant="outline" disabled={currentStep === 0 || requesting} onClick={() => setCurrentStep(currentStep - 1)}>Previous</Button><div className="flex gap-3"><Button variant="outline" disabled={requesting || !department} onClick={() => save(project ? undefined : 'DRAFT')}>{requesting ? 'Saving…' : 'Save draft'}</Button>{currentStep < steps.length - 1 ? <Button disabled={requesting} onClick={() => setCurrentStep(currentStep + 1)}>Next</Button> : <Button disabled={requesting || !department} onClick={() => { if (validate()) setShowSubmitModal(true); }}>Submit</Button>}</div></div>
          </section></div>
        </>}
      </>}
    </div>
  </div>{showSubmitModal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><div className="max-w-md rounded-lg bg-card p-6"><h2 className="text-lg font-semibold">Submit project?</h2><p className="my-4">Your project will be sent for review.</p><div className="flex justify-end gap-3"><Button variant="outline" disabled={requesting} onClick={() => setShowSubmitModal(false)}>Cancel</Button><Button disabled={requesting} onClick={() => save('SUBMITTED')}>{requesting ? 'Submitting…' : 'Confirm Submit'}</Button></div></div></div>}</div>;
};

export default StudentProjectProposalForm;
