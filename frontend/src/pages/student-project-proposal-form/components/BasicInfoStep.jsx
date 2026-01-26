import React from 'react';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Icon from '../../../components/AppIcon';

const BasicInfoStep = ({ formData, onChange, errors }) => {
  const projectTypes = [
    { value: 'thesis', label: 'Master\'s Thesis' },
    { value: 'capstone', label: 'Capstone Project' },
    { value: 'research', label: 'Research Project' },
    { value: 'dissertation', label: 'PhD Dissertation' }
  ];

  const departments = [
    { value: 'cs', label: 'Computer Science' },
    { value: 'ee', label: 'Electrical Engineering' },
    { value: 'me', label: 'Mechanical Engineering' },
    { value: 'ce', label: 'Civil Engineering' },
    { value: 'bio', label: 'Biotechnology' }
  ];

  const academicYears = [
    { value: '2025-26', label: '2025-2026' },
    { value: '2024-25', label: '2024-2025' },
    { value: '2023-24', label: '2023-2024' }
  ];

  const guides = [
    { value: 'dr-smith', label: 'Dr. Sarah Smith - Computer Science' },
    { value: 'dr-johnson', label: 'Dr. Michael Johnson - Software Engineering' },
    { value: 'dr-williams', label: 'Dr. Emily Williams - Data Science' },
    { value: 'dr-brown', label: 'Dr. Robert Brown - Artificial Intelligence' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-lg">
        <Icon name="Info" size={20} color="var(--color-primary)" className="flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-foreground">Student Information Pre-populated</p>
          <p className="text-xs text-muted-foreground mt-1">
            Your basic details have been automatically filled from the institutional database. Please verify and complete the remaining fields.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <Input
          label="Student Name"
          type="text"
          value={formData?.studentName || ''}
          disabled
          description="Pre-populated from student records"
        />
        <Input
          label="Student ID"
          type="text"
          value={formData?.studentId || ''}
          disabled
          description="Pre-populated from student records"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <Input
          label="Email Address"
          type="email"
          value={formData?.email || ''}
          disabled
          description="Pre-populated from student records"
        />
        <Input
          label="Phone Number"
          type="tel"
          value={formData?.phone || ''}
          onChange={(e) => onChange('phone', e?.target?.value)}
          placeholder="+1 (555) 000-0000"
          error={errors?.phone}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <Select
          label="Department"
          options={departments}
          value={formData?.department || ''}
          onChange={(value) => onChange('department', value)}
          placeholder="Select your department"
          required
          error={errors?.department}
        />
        <Select
          label="Academic Year"
          options={academicYears}
          value={formData?.academicYear || ''}
          onChange={(value) => onChange('academicYear', value)}
          placeholder="Select academic year"
          required
          error={errors?.academicYear}
        />
      </div>
      <Select
        label="Project Type"
        options={projectTypes}
        value={formData?.projectType || ''}
        onChange={(value) => onChange('projectType', value)}
        placeholder="Select project type"
        description="This determines the approval workflow and requirements"
        required
        error={errors?.projectType}
      />
      <Input
        label="Project Title"
        type="text"
        value={formData?.projectTitle || ''}
        onChange={(e) => onChange('projectTitle', e?.target?.value)}
        placeholder="Enter a descriptive project title"
        description={`${(formData?.projectTitle || '')?.length}/200 characters`}
        required
        error={errors?.projectTitle}
        maxLength={200}
      />
      <Select
        label="Preferred Faculty Guide"
        options={guides}
        value={formData?.guide || ''}
        onChange={(value) => onChange('guide', value)}
        placeholder="Select a faculty guide"
        description="Guide assignment is subject to availability and approval"
        searchable
        required
        error={errors?.guide}
      />
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Project Abstract <span className="text-error">*</span>
        </label>
        <textarea
          value={formData?.abstract || ''}
          onChange={(e) => onChange('abstract', e?.target?.value)}
          placeholder="Provide a brief overview of your project (minimum 100 words)"
          rows={6}
          maxLength={1000}
          className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-muted-foreground">
            Minimum 100 words required for submission
          </p>
          <p className="text-xs text-muted-foreground">
            {(formData?.abstract || '')?.length}/1000 characters
          </p>
        </div>
        {errors?.abstract && (
          <p className="text-xs text-error mt-1">{errors?.abstract}</p>
        )}
      </div>
    </div>
  );
};

export default BasicInfoStep;