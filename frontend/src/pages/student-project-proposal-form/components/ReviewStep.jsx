import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ReviewStep = ({ formData, onEdit }) => {
  const sections = [
    {
      id: 'basic',
      title: 'Basic Information',
      icon: 'User',
      fields: [
        { label: 'Student Name', value: formData?.studentName },
        { label: 'Student ID', value: formData?.studentId },
        { label: 'Email', value: formData?.email },
        { label: 'Phone', value: formData?.phone },
        { label: 'Department', value: formData?.department },
        { label: 'Academic Year', value: formData?.academicYear },
        { label: 'Project Type', value: formData?.projectType },
        { label: 'Project Title', value: formData?.projectTitle },
        { label: 'Faculty Guide', value: formData?.guide },
        { label: 'Abstract', value: formData?.abstract, multiline: true }
      ]
    },
    {
      id: 'objectives',
      title: 'Objectives & Outcomes',
      icon: 'Target',
      fields: [
        {
          label: 'Project Objectives',
          value: formData?.objectives?.map((obj, i) => `${i + 1}. ${obj?.text}`)?.join('\n'),
          multiline: true
        },
        { label: 'Problem Statement', value: formData?.problemStatement, multiline: true },
        {
          label: 'Expected Outcomes',
          value: formData?.expectedOutcomes?.map((out, i) => `${i + 1}. ${out?.text}`)?.join('\n'),
          multiline: true
        },
        { label: 'Scope and Limitations', value: formData?.scopeLimitations, multiline: true }
      ]
    },
    {
      id: 'methodology',
      title: 'Methodology',
      icon: 'FlaskConical',
      fields: [
        { label: 'Research Method', value: formData?.researchMethod },
        { label: 'Methodology Description', value: formData?.methodologyDescription, multiline: true },
        {
          label: 'Data Collection Methods',
          value: Array.isArray(formData?.dataCollectionMethods)
            ? formData?.dataCollectionMethods?.join(', ')
            : formData?.dataCollectionMethods
        },
        { label: 'Sample Description', value: formData?.sampleDescription, multiline: true },
        {
          label: 'Analysis Tools',
          value: Array.isArray(formData?.analysisTools)
            ? formData?.analysisTools?.join(', ')
            : formData?.analysisTools
        },
        { label: 'Data Analysis Plan', value: formData?.analysisDescription, multiline: true },
        { label: 'Ethical Considerations', value: formData?.ethicalConsiderations, multiline: true }
      ]
    },
    {
      id: 'timeline',
      title: 'Timeline',
      icon: 'Calendar',
      fields: [
        { label: 'Project Start Date', value: formData?.projectStartDate },
        { label: 'Expected Completion Date', value: formData?.projectEndDate },
        {
          label: 'Milestones',
          value: formData?.milestones
            ?.map(
              (m, i) =>
                `${i + 1}. ${m?.title}\n   ${m?.startDate} to ${m?.endDate}\n   Deliverables: ${m?.deliverables}`
            )?.join('\n\n'),
          multiline: true
        }
      ]
    },
    {
      id: 'resources',
      title: 'Resources',
      icon: 'Package',
      fields: [
        { label: 'Equipment Requirements', value: formData?.equipmentRequirements, multiline: true },
        { label: 'Software Requirements', value: formData?.softwareRequirements, multiline: true },
        {
          label: 'Budget Items',
          value: formData?.budgetItems
            ?.map((item, i) => `${i + 1}. ${item?.description} - $${item?.totalCost}`)?.join('\n'),
          multiline: true
        },
        { label: 'Additional Notes', value: formData?.additionalNotes, multiline: true }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 bg-success/5 border border-success/20 rounded-lg">
        <Icon name="CheckCircle" size={20} color="var(--color-success)" className="flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-foreground">Review Your Submission</p>
          <p className="text-xs text-muted-foreground mt-1">
            Please review all information carefully before submitting. You can edit any section by clicking the edit button.
          </p>
        </div>
      </div>
      {sections?.map((section) => (
        <div key={section?.id} className="border border-border rounded-lg overflow-hidden">
          <div className="flex items-center justify-between p-4 bg-muted">
            <div className="flex items-center gap-3">
              <Icon name={section?.icon} size={20} color="var(--color-foreground)" />
              <h3 className="font-heading font-semibold text-foreground">{section?.title}</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              iconName="Edit"
              iconPosition="left"
              onClick={() => onEdit(section?.id)}
            >
              Edit
            </Button>
          </div>
          <div className="p-4 space-y-4">
            {section?.fields?.map((field, index) => (
              <div key={index}>
                {field?.value && (
                  <>
                    <p className="text-sm font-medium text-foreground mb-1">{field?.label}</p>
                    <p
                      className={`text-sm text-muted-foreground ${
                        field?.multiline ? 'whitespace-pre-wrap' : ''
                      }`}
                    >
                      {field?.value || 'Not provided'}
                    </p>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
      <div className="flex items-start gap-3 p-4 bg-warning/5 border border-warning/20 rounded-lg">
        <Icon name="AlertTriangle" size={20} color="var(--color-warning)" className="flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-foreground">Before Submitting</p>
          <ul className="text-xs text-muted-foreground mt-2 space-y-1 list-disc list-inside">
            <li>Ensure all required fields are completed</li>
            <li>Verify contact information is accurate</li>
            <li>Check that all dates are realistic and sequential</li>
            <li>Review budget calculations for accuracy</li>
            <li>Confirm faculty guide selection</li>
            <li>Proofread all text for clarity and grammar</li>
          </ul>
        </div>
      </div>
      <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
        <div className="flex items-start gap-3">
          <Icon name="Info" size={20} color="var(--color-primary)" className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">What Happens Next?</p>
            <ol className="text-xs text-muted-foreground mt-2 space-y-1 list-decimal list-inside">
              <li>Your proposal will be submitted to your selected faculty guide</li>
              <li>The guide will review and provide initial feedback within 5-7 business days</li>
              <li>If approved by guide, it moves to the review committee</li>
              <li>Committee review typically takes 10-14 business days</li>
              <li>Final approval from HOD is required before project commencement</li>
              <li>You will receive email notifications at each stage</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewStep;