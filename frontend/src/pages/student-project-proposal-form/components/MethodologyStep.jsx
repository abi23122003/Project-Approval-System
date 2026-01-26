import React from 'react';
import Select from '../../../components/ui/Select';
import Icon from '../../../components/AppIcon';

const MethodologyStep = ({ formData, onChange, errors }) => {
  const researchMethods = [
    { value: 'experimental', label: 'Experimental Research' },
    { value: 'survey', label: 'Survey-based Research' },
    { value: 'case-study', label: 'Case Study' },
    { value: 'literature-review', label: 'Literature Review' },
    { value: 'mixed-methods', label: 'Mixed Methods' },
    { value: 'action-research', label: 'Action Research' }
  ];

  const dataCollectionMethods = [
    { value: 'interviews', label: 'Interviews' },
    { value: 'questionnaires', label: 'Questionnaires' },
    { value: 'observations', label: 'Observations' },
    { value: 'experiments', label: 'Experiments' },
    { value: 'secondary-data', label: 'Secondary Data Analysis' },
    { value: 'focus-groups', label: 'Focus Groups' }
  ];

  const analysisTools = [
    { value: 'spss', label: 'SPSS' },
    { value: 'python', label: 'Python (NumPy, Pandas, SciPy)' },
    { value: 'r', label: 'R Programming' },
    { value: 'matlab', label: 'MATLAB' },
    { value: 'excel', label: 'Microsoft Excel' },
    { value: 'nvivo', label: 'NVivo' },
    { value: 'tableau', label: 'Tableau' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-lg">
        <Icon name="FlaskConical" size={20} color="var(--color-primary)" className="flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-foreground">Research Methodology</p>
          <p className="text-xs text-muted-foreground mt-1">
            Describe your research approach, data collection methods, and analysis techniques. Be specific about tools and procedures.
          </p>
        </div>
      </div>
      <Select
        label="Research Method"
        options={researchMethods}
        value={formData?.researchMethod || ''}
        onChange={(value) => onChange('researchMethod', value)}
        placeholder="Select primary research method"
        description="Choose the main approach for your research"
        required
        error={errors?.researchMethod}
      />
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Methodology Description <span className="text-error">*</span>
        </label>
        <textarea
          value={formData?.methodologyDescription || ''}
          onChange={(e) => onChange('methodologyDescription', e?.target?.value)}
          placeholder="Provide a detailed description of your research methodology, including procedures, techniques, and justification for your approach"
          rows={8}
          maxLength={3000}
          className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-muted-foreground">
            Include step-by-step procedures and theoretical framework
          </p>
          <p className="text-xs text-muted-foreground">
            {(formData?.methodologyDescription || '')?.length}/3000 characters
          </p>
        </div>
        {errors?.methodologyDescription && (
          <p className="text-xs text-error mt-1">{errors?.methodologyDescription}</p>
        )}
      </div>
      <Select
        label="Data Collection Methods"
        options={dataCollectionMethods}
        value={formData?.dataCollectionMethods || []}
        onChange={(value) => onChange('dataCollectionMethods', value)}
        placeholder="Select data collection methods"
        description="You can select multiple methods"
        multiple
        searchable
        required
        error={errors?.dataCollectionMethods}
      />
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Sample Size and Selection
        </label>
        <textarea
          value={formData?.sampleDescription || ''}
          onChange={(e) => onChange('sampleDescription', e?.target?.value)}
          placeholder="Describe your sample size, selection criteria, and sampling technique"
          rows={4}
          maxLength={1000}
          className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
        <p className="text-xs text-muted-foreground mt-2">
          {(formData?.sampleDescription || '')?.length}/1000 characters
        </p>
      </div>
      <Select
        label="Analysis Tools and Software"
        options={analysisTools}
        value={formData?.analysisTools || []}
        onChange={(value) => onChange('analysisTools', value)}
        placeholder="Select analysis tools"
        description="Select all tools you plan to use"
        multiple
        searchable
        error={errors?.analysisTools}
      />
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Data Analysis Plan <span className="text-error">*</span>
        </label>
        <textarea
          value={formData?.analysisDescription || ''}
          onChange={(e) => onChange('analysisDescription', e?.target?.value)}
          placeholder="Explain how you will analyze the collected data, including statistical methods, qualitative analysis techniques, and validation procedures"
          rows={6}
          maxLength={2000}
          className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
        <p className="text-xs text-muted-foreground mt-2">
          {(formData?.analysisDescription || '')?.length}/2000 characters
        </p>
        {errors?.analysisDescription && (
          <p className="text-xs text-error mt-1">{errors?.analysisDescription}</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Ethical Considerations
        </label>
        <textarea
          value={formData?.ethicalConsiderations || ''}
          onChange={(e) => onChange('ethicalConsiderations', e?.target?.value)}
          placeholder="Describe any ethical considerations, informed consent procedures, data privacy measures, and IRB approval status"
          rows={5}
          maxLength={1500}
          className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
        <p className="text-xs text-muted-foreground mt-2">
          {(formData?.ethicalConsiderations || '')?.length}/1500 characters
        </p>
      </div>
      <div className="flex items-start gap-3 p-4 bg-warning/5 border border-warning/20 rounded-lg">
        <Icon name="AlertTriangle" size={20} color="var(--color-warning)" className="flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-foreground">Citation Management</p>
          <p className="text-xs text-muted-foreground mt-1">
            Remember to cite all sources and references in your methodology. Use institutional citation format (APA, MLA, IEEE, etc.).
          </p>
        </div>
      </div>
    </div>
  );
};

export default MethodologyStep;