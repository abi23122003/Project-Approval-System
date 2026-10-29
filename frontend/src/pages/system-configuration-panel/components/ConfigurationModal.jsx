import React, { useEffect, useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';
import { isConfigurationEditable, submitConfiguration, validateAcademicTerm } from '../../../utils/configuration-submission.mjs';
import { createDefaultGradingScale, defaultGradingCriteria, validateGradingScale } from '../../../utils/grading-scales.mjs';
import { createDefaultNotificationTemplate, validateNotificationTemplate } from '../../../utils/notification-templates.mjs';
import { createDefaultWorkflowConfiguration, validateWorkflowConfiguration } from '../../../utils/workflow-configuration.mjs';

const ConfigurationModal = ({ 
  isOpen, 
  onClose, 
  title, 
  description,
  configType,
  currentConfig,
  onSave,
  savedTerms = [],
  termsLoading = false,
  termsError = '',
  onRefreshTerms,
  savedGradingScales = [],
  gradingScalesLoading = false,
  gradingScalesError = '',
  onRefreshGradingScales,
  savedNotificationTemplates = [],
  notificationTemplatesLoading = false,
  notificationTemplatesError = '',
  onRefreshNotificationTemplates,
  savedWorkflowConfiguration = null,
  workflowConfigurationLoading = false,
  workflowConfigurationError = '',
  onRefreshWorkflowConfiguration,
}) => {
  const makeDefaultConfig = () => configType === 'grading-scale'
    ? createDefaultGradingScale()
    : configType === 'notification' ? createDefaultNotificationTemplate()
      : configType === 'workflow' ? createDefaultWorkflowConfiguration() : {};
  const [config, setConfig] = useState(currentConfig || makeDefaultConfig());
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setConfig(currentConfig || makeDefaultConfig());
    setErrors({});
    setSuccessMessage('');
  }, [isOpen, currentConfig]);

  if (!isOpen) return null;

  const handleSave = async (event) => {
    event.preventDefault();
    if (isSaving) return;
    const validationErrors = configType === 'academic-term'
      ? validateAcademicTerm(config)
      : configType === 'grading-scale' ? validateGradingScale(config)
        : configType === 'notification' ? validateNotificationTemplate(config)
          : configType === 'workflow' ? validateWorkflowConfiguration(config) : {};
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length) return;

    setIsSaving(true);
    const result = await submitConfiguration(configType, config, onSave, savedConfig => {
      if (savedConfig?.id) setConfig(savedConfig);
      setSuccessMessage(configType === 'grading-scale'
        ? 'Grading scale saved successfully.'
        : configType === 'notification' ? 'Notification template saved successfully.'
          : configType === 'workflow' ? 'Workflow configuration saved successfully.' : 'Academic term saved successfully.');
    });
    setErrors(result.errors);
    setIsSaving(false);
  };

  const handleTermFieldChange = (field, value) => {
    const nextConfig = { ...config, [field]: value };
    setConfig(nextConfig);
    setErrors(validateAcademicTerm(nextConfig));
  };

  const handleGradingScaleChange = (nextConfig) => {
    setConfig(nextConfig);
    setErrors(validateGradingScale(nextConfig));
  };

  const handleNotificationTemplateChange = (nextConfig) => {
    setConfig(nextConfig);
    setErrors(validateNotificationTemplate(nextConfig));
  };

  const handleWorkflowConfigurationChange = (nextConfig) => {
    setConfig(nextConfig);
    setErrors(validateWorkflowConfiguration(nextConfig));
  };

  const renderConfigFields = () => {
    switch (configType) {
      case 'academic-term':
        return (
          <>
            <div className="mb-5 rounded-md border border-border p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <h3 className="text-sm font-medium">Saved academic terms</h3>
                <Button type="button" variant="outline" size="sm" disabled={termsLoading} onClick={onRefreshTerms}>Refresh</Button>
              </div>
              {termsLoading && <p role="status" className="text-sm text-muted-foreground">Loading saved terms…</p>}
              {termsError && <p role="alert" className="text-sm text-destructive">{termsError}</p>}
              {!termsLoading && !termsError && savedTerms.length === 0 && <p className="text-sm text-muted-foreground">No academic terms have been saved.</p>}
              {savedTerms.length > 0 && <ul className="space-y-2">
                {savedTerms.map(term => <li key={term.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="min-w-0 break-words">{term.termName} · {term.startDate} to {term.endDate}{term.isActive ? ' · Active' : ''}</span>
                  <Button type="button" size="sm" variant="outline" onClick={() => { setConfig({ ...term }); setErrors({}); setSuccessMessage(''); }}>Edit</Button>
                </li>)}
              </ul>}
              <Button type="button" size="sm" variant="outline" className="mt-3" onClick={() => { setConfig({}); setErrors({}); setSuccessMessage(''); }}>New term</Button>
            </div>
            <div className="mb-4">
              <Input
                id="academic-term-name"
                label="Term Name"
                type="text"
                value={config?.termName || ''}
                onChange={(e) => handleTermFieldChange('termName', e?.target?.value)}
                placeholder="e.g., Spring 2026"
                required
                aria-invalid={Boolean(errors.termName)}
                aria-describedby={errors.termName ? 'academic-term-name-error' : undefined}
              />
              {errors.termName && <p id="academic-term-name-error" role="alert" className="mt-1 text-sm text-destructive">{errors.termName}</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <Input
                  id="academic-term-start-date"
                  label="Start Date"
                  type="date"
                  value={config?.startDate || ''}
                  onChange={(e) => handleTermFieldChange('startDate', e?.target?.value)}
                  required
                  aria-invalid={Boolean(errors.startDate)}
                  aria-describedby={errors.startDate ? 'academic-term-start-date-error' : undefined}
                />
                {errors.startDate && <p id="academic-term-start-date-error" role="alert" className="mt-1 text-sm text-destructive">{errors.startDate}</p>}
              </div>
              <div>
                <Input
                  id="academic-term-end-date"
                  label="End Date"
                  type="date"
                  value={config?.endDate || ''}
                  onChange={(e) => handleTermFieldChange('endDate', e?.target?.value)}
                  required
                  aria-invalid={Boolean(errors.endDate)}
                  aria-describedby={errors.endDate ? 'academic-term-end-date-error' : undefined}
                />
                {errors.endDate && <p id="academic-term-end-date-error" role="alert" className="mt-1 text-sm text-destructive">{errors.endDate}</p>}
              </div>
            </div>
            <Checkbox
              label="Set as Active Term"
              checked={config?.isActive || false}
              onChange={(e) => setConfig({ ...config, isActive: e?.target?.checked })}
              className="mb-4"
            />
          </>
        );
      case 'grading-scale':
        return (
          <>
            <div className="mb-5 rounded-md border border-border p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <h3 className="text-sm font-medium">Saved grading scales</h3>
                <Button type="button" variant="outline" size="sm" disabled={gradingScalesLoading} onClick={onRefreshGradingScales}>Refresh</Button>
              </div>
              {gradingScalesLoading && <p role="status" className="text-sm text-muted-foreground">Loading saved grading scales…</p>}
              {gradingScalesError && <p role="alert" className="text-sm text-destructive">{gradingScalesError}</p>}
              {!gradingScalesLoading && !gradingScalesError && savedGradingScales.length === 0 && <p className="text-sm text-muted-foreground">No grading scales have been saved.</p>}
              {savedGradingScales.length > 0 && <ul className="space-y-2">
                {savedGradingScales.map(scale => <li key={scale.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="min-w-0 break-words">{scale.scaleName} · {scale.gradeType} · Max {scale.maxPoints}</span>
                  <Button type="button" size="sm" variant="outline" onClick={() => { handleGradingScaleChange({ ...scale, criteria: scale.criteria.map(item => ({ ...item })) }); setSuccessMessage(''); }}>Edit</Button>
                </li>)}
              </ul>}
              <Button type="button" size="sm" variant="outline" className="mt-3" onClick={() => { setConfig(createDefaultGradingScale()); setErrors({}); setSuccessMessage(''); }}>New scale</Button>
            </div>
            <Input
              id="grading-scale-name"
              label="Scale Name"
              type="text"
              value={config?.scaleName || ''}
              onChange={(e) => handleGradingScaleChange({ ...config, scaleName: e?.target?.value })}
              placeholder="e.g., Standard 4.0 Scale"
              required
              error={errors.scaleName}
              className="mb-4"
            />
            <Input
              id="grading-scale-max-points"
              label="Maximum Points"
              type="number"
              min="0.01"
              step="0.01"
              value={config?.maxPoints ?? ''}
              onChange={(e) => {
                const oldMaximum = Number(config.maxPoints);
                const newMaximum = Number(e?.target?.value);
                const criteria = config.gradeType === 'points' && Number.isFinite(newMaximum) && newMaximum > 0
                  ? Number.isFinite(oldMaximum) && oldMaximum > 0
                    ? config.criteria.map(item => ({ ...item, min_value: String(Number((Number(item.min_value) * newMaximum / oldMaximum).toFixed(2))), max_value: String(Number((Number(item.max_value) * newMaximum / oldMaximum).toFixed(2))) }))
                    : defaultGradingCriteria('points', newMaximum)
                  : config.criteria;
                handleGradingScaleChange({ ...config, maxPoints: e?.target?.value, criteria });
              }}
              placeholder="100"
              required
              error={errors.maxPoints}
              className="mb-4"
            />
            <Select
              id="grading-scale-type"
              label="Grade Type"
              options={[
                { value: 'percentage', label: 'Percentage Based' },
                { value: 'points', label: 'Points Based' },
                { value: 'letter', label: 'Letter Grade' }
              ]}
              value={config?.gradeType || 'percentage'}
              onChange={(value) => handleGradingScaleChange({ ...config, gradeType: value, criteria: defaultGradingCriteria(value, config.maxPoints) })}
              error={errors.gradeType}
              className="mb-4"
            />
            <div className="mb-2 flex items-center justify-between gap-3">
              <h3 className="text-sm font-medium">Grade ranges and grades</h3>
              <span className="text-xs text-muted-foreground">{config.gradeType === 'points' ? `0 to ${config.maxPoints} points` : '0 to 100'}</span>
            </div>
            <p className="mb-3 text-xs text-muted-foreground">Minimum values are included, maximum values begin the next range; the final range includes the maximum.</p>
            <div className="space-y-3" aria-label="Grading criteria" aria-invalid={Boolean(errors.criteria)} aria-describedby={errors.criteria ? 'grading-criteria-error' : undefined}>
              {(config.criteria || []).map((criterion, index) => (
                <div key={index} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] items-end gap-3 rounded-md border border-border p-3">
                  <Input id={`grading-min-${index}`} label="Minimum" type="number" min="0" step="0.01" value={criterion.min_value} onChange={e => handleGradingScaleChange({ ...config, criteria: config.criteria.map((item, itemIndex) => itemIndex === index ? { ...item, min_value: e.target.value } : item) })} />
                  <Input id={`grading-max-${index}`} label="Maximum" type="number" min="0" step="0.01" value={criterion.max_value} onChange={e => handleGradingScaleChange({ ...config, criteria: config.criteria.map((item, itemIndex) => itemIndex === index ? { ...item, max_value: e.target.value } : item) })} />
                  <Input id={`grading-label-${index}`} label={config.gradeType === 'letter' ? 'Letter Grade' : 'Grade'} type="text" value={criterion.grade} onChange={e => handleGradingScaleChange({ ...config, criteria: config.criteria.map((item, itemIndex) => itemIndex === index ? { ...item, grade: e.target.value } : item) })} />
                  <Button type="button" variant="outline" size="sm" disabled={config.criteria.length <= 1} aria-label={`Remove criterion ${index + 1}`} onClick={() => handleGradingScaleChange({ ...config, criteria: config.criteria.filter((_, itemIndex) => itemIndex !== index) })}>Remove</Button>
                </div>
              ))}
            </div>
            {errors.criteria && <p id="grading-criteria-error" role="alert" className="mt-2 text-sm text-destructive">{errors.criteria}</p>}
            <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => {
              const last = config.criteria[config.criteria.length - 1];
              const end = config.gradeType === 'points' ? Number(config.maxPoints) : 100;
              const midpoint = Number((((Number(last.min_value) + Number(last.max_value)) / 2)).toFixed(2));
              handleGradingScaleChange({ ...config, criteria: [...config.criteria.slice(0, -1), { ...last, max_value: String(midpoint) }, { min_value: String(midpoint), max_value: String(end), grade: '' }] });
            }}>Add criterion</Button>
          </>
        );
      case 'notification':
        return (
          <>
            <div className="mb-5 rounded-md border border-border p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <h3 className="text-sm font-medium">Saved notification templates</h3>
                <Button type="button" variant="outline" size="sm" disabled={notificationTemplatesLoading} onClick={onRefreshNotificationTemplates}>Refresh</Button>
              </div>
              {notificationTemplatesLoading && <p role="status" className="text-sm text-muted-foreground">Loading saved notification templates…</p>}
              {notificationTemplatesError && <p role="alert" className="text-sm text-destructive">{notificationTemplatesError}</p>}
              {!notificationTemplatesLoading && !notificationTemplatesError && savedNotificationTemplates.length === 0 && <p className="text-sm text-muted-foreground">No notification templates have been saved.</p>}
              {savedNotificationTemplates.length > 0 && <ul className="space-y-2">
                {savedNotificationTemplates.map(template => <li key={template.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="min-w-0 break-words">{template.templateName} · {template.triggerEvent}</span>
                  <Button type="button" size="sm" variant="outline" onClick={() => { handleNotificationTemplateChange({ ...template }); setSuccessMessage(''); }}>Edit</Button>
                </li>)}
              </ul>}
              <Button type="button" size="sm" variant="outline" className="mt-3" onClick={() => { setConfig(createDefaultNotificationTemplate()); setErrors({}); setSuccessMessage(''); }}>New template</Button>
            </div>
            <Input
              id="notification-template-name"
              label="Notification Template Name"
              type="text"
              value={config?.templateName || ''}
              onChange={(e) => handleNotificationTemplateChange({ ...config, templateName: e?.target?.value })}
              placeholder="e.g., Project Submission Reminder"
              required
              error={errors.templateName}
              className="mb-4"
            />
            <Select
              id="notification-template-trigger"
              label="Trigger Event"
              options={[
                { value: 'submission', label: 'Project Submission' },
                { value: 'review', label: 'Review Completed' },
                { value: 'deadline', label: 'Deadline Approaching' },
                { value: 'approval', label: 'Approval Required' }
              ]}
              value={config?.triggerEvent || 'submission'}
              onChange={(value) => handleNotificationTemplateChange({ ...config, triggerEvent: value })}
              error={errors.triggerEvent}
              className="mb-4"
            />
            <Checkbox
              label="Enable Email Notifications"
              checked={config?.emailEnabled ?? false}
              onChange={(e) => handleNotificationTemplateChange({ ...config, emailEnabled: e?.target?.checked })}
              className="mb-2"
            />
            <Checkbox
              label="Enable In-App Notifications"
              checked={config?.inAppEnabled ?? true}
              onChange={(e) => handleNotificationTemplateChange({ ...config, inAppEnabled: e?.target?.checked })}
              className="mb-4"
            />
            <p className="text-xs leading-5 text-muted-foreground">These settings are stored for configuration only. No email or external notification is sent by saving this template.</p>
          </>
        );
      case 'workflow':
        return (
          <>
            <div className="mb-5 rounded-md border border-border p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <h3 className="text-sm font-medium">Active workflow configuration</h3>
                <Button type="button" variant="outline" size="sm" disabled={workflowConfigurationLoading} onClick={onRefreshWorkflowConfiguration}>Refresh</Button>
              </div>
              {workflowConfigurationLoading && <p role="status" className="text-sm text-muted-foreground">Loading saved workflow configuration…</p>}
              {workflowConfigurationError && <p role="alert" className="text-sm text-destructive">{workflowConfigurationError}</p>}
              {!workflowConfigurationLoading && !workflowConfigurationError && savedWorkflowConfiguration && <p className="text-sm text-muted-foreground break-words">{savedWorkflowConfiguration.workflowName} · {savedWorkflowConfiguration.reviewStages} mentor review stage(s) · HOD approval {savedWorkflowConfiguration.requireHodApproval ? 'required' : 'not required'} · {savedWorkflowConfiguration.parallelReviews ? 'parallel' : 'sequential'} review</p>}
              {!workflowConfigurationLoading && !workflowConfigurationError && !savedWorkflowConfiguration && <p className="text-sm text-muted-foreground">No saved configuration. The current approval behavior remains in effect until this form is saved.</p>}
            </div>
            <Input
              id="workflow-name"
              label="Workflow Name"
              type="text"
              value={config?.workflowName || ''}
              onChange={(e) => handleWorkflowConfigurationChange({ ...config, workflowName: e?.target?.value })}
              placeholder="e.g., Standard Project Review"
              required
              error={errors.workflowName}
              className="mb-4"
            />
            <Select
              id="workflow-review-stages"
              label="Number of Review Stages"
              options={[
                { value: '1', label: '1 Stage' },
                { value: '2', label: '2 Stages' },
                { value: '3', label: '3 Stages' },
                { value: '4', label: '4 Stages' }
              ]}
              value={config?.reviewStages || '2'}
              onChange={(value) => handleWorkflowConfigurationChange({ ...config, reviewStages: value })}
              error={errors.reviewStages}
              className="mb-4"
            />
            <Checkbox
              label="Require HOD Approval"
              checked={config?.requireHodApproval ?? true}
              onChange={(e) => handleWorkflowConfigurationChange({ ...config, requireHodApproval: e?.target?.checked, parallelReviews: e?.target?.checked ? config.parallelReviews : false })}
              className="mb-2"
            />
            <Checkbox
              label="Enable Parallel Reviews"
              checked={config?.parallelReviews ?? false}
              disabled={!config?.requireHodApproval}
              onChange={(e) => handleWorkflowConfigurationChange({ ...config, parallelReviews: e?.target?.checked })}
              className="mb-4"
            />
            {errors.parallelReviews && <p role="alert" className="mb-3 text-sm text-destructive">{errors.parallelReviews}</p>}
            <p className="text-xs leading-5 text-muted-foreground">The assigned project mentor completes each review stage. With sequential review, HOD approval follows the mentor stages. Parallel review allows the HOD to review at the same time, but approval is final only after both sides approve. A rejection by either reviewer rejects the project.</p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">Changes apply to projects submitted after the configuration is saved. In-progress projects keep their workflow snapshot; older projects without a snapshot retain the legacy HOD decision flow.</p>
          </>
        );
      default:
        return (
          <div className="rounded-md border border-warning/30 bg-warning/10 p-4" role="status">
            <h3 className="font-medium text-sm text-foreground">Configuration unavailable</h3>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">
              This setting has no supported backend configuration API. No value is loaded or saved here.
            </p>
            <p className="mt-2 text-sm leading-5 text-muted-foreground">
              Separate server setting: JWT access tokens expire after 60 minutes. This is configured in
              <code className="mx-1 rounded bg-muted px-1">backend/server/settings.py</code>
              and is not controlled by this form; a code change and backend restart are required to change it.
            </p>
          </div>
        );
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
        onClick={() => { if (!isSaving) onClose(); }}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-card border border-border rounded-lg shadow-elevated w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-4 md:p-6 border-b border-border">
            <div className="min-w-0 flex-1 mr-4">
              <h2 className="font-heading font-semibold text-lg md:text-xl text-foreground mb-1">
                {title}
              </h2>
              {description && (
                <p className="text-xs md:text-sm text-muted-foreground">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => { if (!isSaving) onClose(); }}
              disabled={isSaving}
              className="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors duration-academic flex-shrink-0"
              aria-label="Close modal"
            >
              <Icon name="X" size={20} />
            </button>
          </div>

          <form onSubmit={handleSave} noValidate className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            {errors.form && <p role="alert" className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{errors.form}</p>}
            {successMessage && <p role="status" className="mb-4 rounded-md border border-success/30 bg-success/10 p-3 text-sm text-success">{successMessage}</p>}
            {renderConfigFields()}
          </div>

          <div className="flex items-center justify-end space-x-3 p-4 md:p-6 border-t border-border">
            <Button
              variant="outline"
              type="button"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              type="submit"
              loading={isSaving}
              iconName="Save"
              iconPosition="left"
              disabled={!isConfigurationEditable(configType)}
            >
              {isConfigurationEditable(configType) ? 'Save Configuration' : 'Unavailable'}
            </Button>
          </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default ConfigurationModal;
