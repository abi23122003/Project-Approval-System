const humanize = (value) => String(value || '')
  .replace(/([a-z])([A-Z])/g, '$1 $2')
  .replace(/[_-]+/g, ' ')
  .trim()
  .toLowerCase()
  .replace(/\b\w+/g, (word) => ['hod', 'id', 'api'].includes(word) ? word.toUpperCase() : `${word[0].toUpperCase()}${word.slice(1)}`);

const EVENT_GROUPS = {
  DEPARTMENT_CREATED: 'Departments',
  DEPARTMENT_UPDATED: 'Departments',
  USER_CREATED: 'Users',
  USER_DEPARTMENT_ASSIGNED: 'Users',
  PROJECT_CREATED: 'Projects',
  PROJECT_UPDATED: 'Projects',
  HOD_DECISION: 'Projects',
  JOIN_REQUEST_CREATED: 'Join Requests',
  JOIN_REQUEST_REVIEWED: 'Join Requests',
  JOIN_REQUEST_CANCELLED: 'Join Requests',
  PROGRESS_UPDATE_CREATED: 'Progress',
  PROGRESS_DOCUMENT_ADDED: 'Progress',
};

const ENTITY_CATEGORIES = {
  Department: 'Departments',
  AppUser: 'Users',
  Project: 'Projects',
  ProjectHodDecision: 'Projects',
  ProjectJoinRequest: 'Join Requests',
  ProjectProgressUpdate: 'Progress',
  ProgressDocument: 'Progress',
};

const actorText = (event) => event.actor ? `User #${event.actor}` : 'the system';

export const formatAuditEvent = (event = {}) => {
  const eventType = String(event.event_type || '');
  const details = event.details_json && typeof event.details_json === 'object' ? event.details_json : {};
  const before = details.before && typeof details.before === 'object' ? details.before : {};
  const after = details.after && typeof details.after === 'object' ? details.after : {};
  const eventGroup = EVENT_GROUPS[eventType] || 'Other Activity';
  const category = ENTITY_CATEGORIES[event.entity_type] || humanize(event.entity_type) || 'System';
  const actor = actorText(event);
  let title = humanize(eventType) || 'System Activity';
  let message;

  if (eventType === 'DEPARTMENT_CREATED') {
    const name = details.name || details.code;
    title = 'Department created';
    message = name
      ? `Department ${name}${details.code && details.name ? ` (${details.code})` : ''} was created by an administrator.`
      : 'A department was created by an administrator.';
  } else if (eventType === 'DEPARTMENT_UPDATED') {
    const name = after.name || before.name || after.code || before.code;
    const subject = name ? `Department ${name}` : 'A department';
    title = 'Department updated';
    if (before.is_active === true && after.is_active === false) {
      title = 'Department deactivated';
      message = `${subject} was deactivated by an administrator.`;
    } else if (before.is_active === false && after.is_active === true) {
      title = 'Department activated';
      message = `${subject} was activated by an administrator.`;
    } else {
      message = `${subject} details were updated by an administrator.`;
    }
  } else if (eventType === 'USER_CREATED') {
    const role = humanize(details.role_code);
    title = 'User account created';
    message = details.username
      ? `User account ${details.username}${role ? ` (${role})` : ''} was created by an administrator.`
      : 'A user account was created by an administrator.';
  } else if (eventType === 'USER_DEPARTMENT_ASSIGNED') {
    title = 'Department assigned';
    message = details.user_id
      ? `A department was assigned to user account #${details.user_id} by an administrator.`
      : 'A department was assigned to a user account by an administrator.';
  } else if (eventType === 'PROJECT_CREATED') {
    title = 'Project created';
    message = event.entity_id ? `Project #${event.entity_id} was created.` : 'A project was created.';
  } else if (eventType === 'PROJECT_UPDATED') {
    title = 'Project updated';
    message = event.entity_id ? `Project #${event.entity_id} was updated.` : 'A project was updated.';
  } else if (eventType === 'HOD_DECISION') {
    const decision = String(details.decision || '').toUpperCase();
    const verb = decision === 'APPROVE' ? 'approved' : decision === 'REJECT' ? 'rejected' : null;
    title = verb ? `Project ${verb}` : 'Project decision recorded';
    message = details.project_id && verb
      ? `Project #${details.project_id} was ${verb} by a department head.`
      : 'A project decision was recorded by a department head.';
  } else if (eventType === 'JOIN_REQUEST_CREATED') {
    title = 'Join request submitted';
    message = details.project_id
      ? `A join request was submitted for project #${details.project_id}.`
      : 'A project join request was submitted.';
  } else if (eventType === 'JOIN_REQUEST_REVIEWED') {
    title = 'Join request reviewed';
    const status = humanize(details.status).toLowerCase();
    message = status ? `A project join request was marked ${status}.` : 'A project join request was reviewed.';
  } else if (eventType === 'JOIN_REQUEST_CANCELLED') {
    title = 'Join request cancelled';
    message = 'A project join request was cancelled.';
  } else if (eventType === 'PROGRESS_UPDATE_CREATED') {
    title = 'Project progress updated';
    message = details.project_id
      ? `A progress update was added to project #${details.project_id}.`
      : 'A project progress update was added.';
  } else if (eventType === 'PROGRESS_DOCUMENT_ADDED') {
    title = 'Progress document added';
    message = details.progress_update_id
      ? `A document was added to progress update #${details.progress_update_id}.`
      : 'A document was added to a project progress update.';
  } else {
    const record = category === 'Other Activity' ? 'system' : category.toLowerCase();
    message = `An activity involving ${record} was recorded by ${actor}.`;
  }

  return {
    id: event.id,
    title,
    message,
    actor,
    category,
    type: eventGroup,
    timestamp: event.event_time,
  };
};

export const filterAuditEvents = (events = [], { search = '', type = 'all', category = 'all', timeRange = 'all' } = {}, now = new Date()) => {
  const query = search.trim().toLowerCase();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (timeRange === 'week') start.setTime(now.getTime() - 7 * 86400000);
  if (timeRange === 'month') start.setTime(now.getTime() - 30 * 86400000);

  return events
    .map(formatAuditEvent)
    .filter((event) => {
      if (query && ![event.title, event.message, event.actor, event.category].some((value) => value.toLowerCase().includes(query))) return false;
      if (type !== 'all' && event.type !== type) return false;
      if (category !== 'all' && event.category !== category) return false;
      if (timeRange !== 'all') {
        const timestamp = new Date(event.timestamp).getTime();
        if (!Number.isFinite(timestamp) || timestamp < start.getTime() || timestamp > now.getTime()) return false;
      }
      return true;
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const paginateEvents = (events, page, pageSize = 10) => {
  const pageCount = Math.ceil(events.length / pageSize);
  const currentPage = Math.min(Math.max(page, 0), Math.max(pageCount - 1, 0));
  const firstItem = events.length ? currentPage * pageSize + 1 : 0;
  return {
    currentPage,
    pageCount,
    firstItem,
    lastItem: Math.min(firstItem + pageSize - 1, events.length),
    items: events.slice(firstItem - 1, firstItem - 1 + pageSize),
  };
};
