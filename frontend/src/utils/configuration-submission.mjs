import { validateGradingScale } from './grading-scales.mjs';
import { validateNotificationTemplate } from './notification-templates.mjs';
import { validateWorkflowConfiguration } from './workflow-configuration.mjs';

const PERSISTED_CONFIGURATION_TYPES = new Set([
  'academic-term',
  'grading-scale',
  'notification',
  'workflow',
]);

export const isConfigurationEditable = configType => PERSISTED_CONFIGURATION_TYPES.has(configType);

export const validateAcademicTerm = (config = {}) => {
  const errors = {};
  const termName = typeof config.termName === 'string' ? config.termName.trim() : '';
  const startDate = typeof config.startDate === 'string' ? config.startDate : '';
  const endDate = typeof config.endDate === 'string' ? config.endDate : '';

  if (!termName) errors.termName = 'Term name is required.';
  if (!startDate) errors.startDate = 'Start date is required.';
  if (!endDate) errors.endDate = 'End date is required.';
  if (startDate && endDate && endDate < startDate) {
    errors.endDate = 'End date must be on or after the start date.';
  }
  return errors;
};

export const submitConfiguration = async (configType, config, onSave, onSuccess) => {
  if (!isConfigurationEditable(configType)) {
    return {
      saved: false,
      errors: { form: 'This configuration is unavailable because no supported configuration API exists.' },
    };
  }

  const errors = configType === 'academic-term'
    ? validateAcademicTerm(config)
    : configType === 'grading-scale' ? validateGradingScale(config)
      : configType === 'notification' ? validateNotificationTemplate(config)
        : configType === 'workflow' ? validateWorkflowConfiguration(config) : {};
  if (Object.keys(errors).length) return { saved: false, errors };

  let savedResult;
  try {
    savedResult = await onSave(config);
  } catch (error) {
    const fieldNames = {
      term_name: 'termName', start_date: 'startDate', end_date: 'endDate', is_active: 'isActive',
      scale_name: 'scaleName', maximum_points: 'maxPoints', grade_type: 'gradeType',
      template_name: 'templateName', trigger_event: 'triggerEvent', email_enabled: 'emailEnabled', in_app_enabled: 'inAppEnabled',
      workflow_name: 'workflowName', review_stages: 'reviewStages', require_hod_approval: 'requireHodApproval', parallel_reviews: 'parallelReviews',
    };
    const fieldErrors = Object.fromEntries(Object.entries(error?.data || {}).filter(([field]) => field !== 'detail' && field !== 'message').map(([field, value]) => [
      fieldNames[field] || field,
      Array.isArray(value) ? value.join(' ') : String(value),
    ]));
    if (!Object.keys(fieldErrors).length && (error?.data?.detail || error?.data?.message)) {
      fieldErrors.form = error.data.detail || error.data.message;
    }
    return {
      saved: false,
      errors: Object.keys(fieldErrors).length ? fieldErrors : { form: error?.message || 'Could not save configuration. Please try again.' },
    };
  }
  onSuccess?.(savedResult);
  return { saved: true, errors: {} };
};

