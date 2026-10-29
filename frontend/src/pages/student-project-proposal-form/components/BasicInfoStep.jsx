import React from 'react';
import Select from '../../../components/ui/Select';

const BasicInfoStep = ({ formData, onChange, errors, mentors = [] }) => <div className="space-y-6">
  <div><label className="mb-2 block text-sm font-medium">Department</label><div className="rounded-lg border bg-muted/30 px-3 py-2" aria-readonly="true">{formData.departmentName || 'Not assigned'}</div></div>
  <div><label className="mb-2 block text-sm font-medium">Project title <span className="text-error">*</span></label><input className="w-full rounded-lg border bg-input px-3 py-2" maxLength={200} value={formData.projectTitle || ''} onChange={event => onChange('projectTitle', event.target.value)} aria-invalid={Boolean(errors.projectTitle)} />{errors.projectTitle && <p className="mt-1 text-sm text-error">{errors.projectTitle}</p>}</div>
  <Select label="Faculty guide" options={mentors} value={formData.guide || ''} onChange={value => onChange('guide', value)} placeholder="Select a faculty guide" required error={errors.guide} />
  <div><label className="mb-2 block text-sm font-medium">Abstract <span className="text-error">*</span></label><textarea className="w-full rounded-lg border bg-input px-3 py-2" rows={6} maxLength={1000} value={formData.abstract || ''} onChange={event => onChange('abstract', event.target.value)} aria-invalid={Boolean(errors.abstract)} />{errors.abstract && <p className="mt-1 text-sm text-error">{errors.abstract}</p>}</div>
</div>;

export default BasicInfoStep;
