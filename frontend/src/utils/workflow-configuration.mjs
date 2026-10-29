export const SUPPORTED_REVIEW_STAGES = [1, 2, 3, 4];

export const createDefaultWorkflowConfiguration = () => ({
  workflowName: 'Standard Project Review',
  reviewStages: '2',
  requireHodApproval: true,
  parallelReviews: false,
});

export const validateWorkflowConfiguration = (config = {}) => {
  const errors = {};
  if (typeof config.workflowName !== 'string' || !config.workflowName.trim()) {
    errors.workflowName = 'Workflow name is required.';
  }
  const stages = Number(config.reviewStages);
  if (!SUPPORTED_REVIEW_STAGES.includes(stages)) {
    errors.reviewStages = 'Select between 1 and 4 review stages.';
  }
  if (typeof config.requireHodApproval !== 'boolean' || typeof config.parallelReviews !== 'boolean') {
    errors.form = 'Workflow approval options must be enabled or disabled.';
  } else if (config.parallelReviews && !config.requireHodApproval) {
    errors.parallelReviews = 'Parallel review requires HOD approval.';
  }
  return errors;
};

export const toWorkflowConfigurationForm = configuration => configuration ? ({
  id: configuration.id,
  workflowName: configuration.workflow_name,
  reviewStages: String(configuration.review_stages),
  requireHodApproval: configuration.require_hod_approval,
  parallelReviews: configuration.parallel_reviews,
}) : null;

export const toWorkflowConfigurationPayload = config => ({
  workflow_name: config.workflowName.trim(),
  review_stages: Number(config.reviewStages),
  require_hod_approval: config.requireHodApproval,
  parallel_reviews: config.parallelReviews,
});

export const fetchWorkflowConfiguration = async apiFetch => {
  const configuration = await apiFetch('/admin/workflow-configuration/');
  if (configuration == null) return null;
  if (!configuration.id) throw new Error('The workflow configuration response was invalid.');
  return toWorkflowConfigurationForm(configuration);
};

export const saveWorkflowConfiguration = async (apiFetch, config) => {
  const path = config.id ? `/admin/workflow-configuration/${config.id}/` : '/admin/workflow-configuration/';
  const response = await apiFetch(path, {
    method: config.id ? 'PATCH' : 'POST',
    body: JSON.stringify(toWorkflowConfigurationPayload(config)),
  });
  if (!response?.id) throw new Error('The server did not confirm the workflow configuration save.');
  return toWorkflowConfigurationForm(response);
};
