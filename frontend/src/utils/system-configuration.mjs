import { toAdminCsv } from './admin-csv.mjs';
import { formatAuditEvent } from './audit-event-presentation.mjs';

export const filterConfigurationCategories = (categories = [], query = '') => {
  const normalizedQuery = String(query).trim().toLowerCase();
  if (!normalizedQuery) return categories;
  return categories.filter(category =>
    `${category.title || ''} ${category.description || ''}`.toLowerCase().includes(normalizedQuery)
  );
};

export const createConfigurationAuditCsv = (events = []) => {
  const rows = [
    ['Event', 'Summary', 'Actor', 'Category', 'Timestamp'],
    ...events.map(event => {
      const formatted = formatAuditEvent(event);
      return [formatted.title, formatted.message, formatted.actor, formatted.category, formatted.timestamp];
    }),
  ];
  return toAdminCsv(rows);
};
