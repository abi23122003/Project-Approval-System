import React from 'react';
import Icon from '../../../components/AppIcon';

const TYPE_ICONS = {
  Departments: 'Building2',
  Users: 'Users',
  Projects: 'FolderOpen',
  'Join Requests': 'UserPlus',
  Progress: 'TrendingUp',
  'Other Activity': 'Activity',
};

const formatTimestamp = (value) => {
  const timestamp = new Date(value);
  if (!Number.isFinite(timestamp.getTime())) return 'Time unavailable';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(timestamp);
};

const NotificationCard = ({ event }) => (
  <article className="min-w-0 overflow-hidden rounded-lg border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-subtle md:p-5">
    <div className="flex min-w-0 items-start gap-3 md:gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 md:h-12 md:w-12" aria-hidden="true">
        <Icon name={TYPE_ICONS[event.type] || 'Activity'} size={20} color="var(--color-primary)" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <h2 className="min-w-0 break-words text-sm font-semibold text-foreground md:text-base [overflow-wrap:anywhere]">{event.title}</h2>
          <span className="w-fit shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">{event.category}</span>
        </div>
        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-foreground [overflow-wrap:anywhere]">{event.message}</p>
        <div className="mt-4 flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
          <span className="inline-flex min-w-0 items-center gap-1.5 break-words [overflow-wrap:anywhere]"><Icon name="User" size={14} aria-hidden="true" />{event.actor}</span>
          <time className="inline-flex items-center gap-1.5" dateTime={event.timestamp}><Icon name="Clock" size={14} aria-hidden="true" />{formatTimestamp(event.timestamp)}</time>
          <span className="inline-flex items-center gap-1.5"><Icon name="Tag" size={14} aria-hidden="true" />{event.type}</span>
        </div>
      </div>
    </div>
  </article>
);

export default NotificationCard;
