export const NOTIFICATION_TRIGGER_EVENTS = ['submission', 'review', 'deadline', 'approval'];

export const createDefaultNotificationTemplate = () => ({
  templateName: '',
  triggerEvent: 'submission',
  emailEnabled: false,
  inAppEnabled: true,
});

export const validateNotificationTemplate = (config = {}) => {
  const errors = {};
  if (typeof config.templateName !== 'string' || !config.templateName.trim()) {
    errors.templateName = 'Notification template name is required.';
  }
  if (!NOTIFICATION_TRIGGER_EVENTS.includes(config.triggerEvent)) {
    errors.triggerEvent = 'Select a supported trigger event.';
  }
  if (typeof config.emailEnabled !== 'boolean' || typeof config.inAppEnabled !== 'boolean') {
    errors.form = 'Notification delivery options must be enabled or disabled.';
  }
  return errors;
};

export const toNotificationTemplateForm = template => ({
  id: template.id,
  templateName: template.template_name,
  triggerEvent: template.trigger_event,
  emailEnabled: template.email_enabled,
  inAppEnabled: template.in_app_enabled,
});

export const toNotificationTemplatePayload = config => ({
  template_name: config.templateName.trim(),
  trigger_event: config.triggerEvent,
  email_enabled: config.emailEnabled,
  in_app_enabled: config.inAppEnabled,
});

export const fetchNotificationTemplates = async apiFetch => {
  const templates = await apiFetch('/admin/notification-templates/');
  if (!Array.isArray(templates)) throw new Error('The notification templates response was invalid.');
  return templates.map(toNotificationTemplateForm);
};

export const saveNotificationTemplate = async (apiFetch, config) => {
  const path = config.id ? `/admin/notification-templates/${config.id}/` : '/admin/notification-templates/';
  const response = await apiFetch(path, {
    method: config.id ? 'PATCH' : 'POST',
    body: JSON.stringify(toNotificationTemplatePayload(config)),
  });
  if (!response?.id) throw new Error('The server did not confirm the notification template save.');
  return toNotificationTemplateForm(response);
};
