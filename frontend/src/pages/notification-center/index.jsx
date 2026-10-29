import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import Icon from '../../components/AppIcon';
import Input from '../../components/ui/Input';
import Sidebar from '../../components/ui/Sidebar';
import NotificationCard from './components/NotificationCard';
import FilterPanel from './components/FilterPanel';
import QuickActions from './components/QuickActions';
import { fetchAuditEvents, getRole } from '../../utils/api';
import { filterAuditEvents, formatAuditEvent, paginateEvents } from '../../utils/audit-event-presentation.mjs';
import { toAdminCsv } from '../../utils/admin-csv.mjs';

const PAGE_SIZE = 10;
const INITIAL_FILTERS = { type: 'all', category: 'all', timeRange: 'all' };

const NotificationCenter = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [auditEvents, setAuditEvents] = useState([]);
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [page, setPage] = useState(0);
  const isAdmin = getRole() === 'admin';

  useEffect(() => {
    let active = true;
    if (!isAdmin) {
      setLoading(false);
      return () => { active = false; };
    }

    setLoading(true);
    setLoadError('');
    fetchAuditEvents()
      .then(events => { if (active) setAuditEvents(Array.isArray(events) ? events : []); })
      .catch(error => { if (active) setLoadError(error?.message || 'Could not load audit activity.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [isAdmin, reloadKey]);

  const formattedEvents = useMemo(() => auditEvents.map(formatAuditEvent), [auditEvents]);
  const categories = useMemo(() => [...new Set(formattedEvents.map(event => event.category))].sort(), [formattedEvents]);
  const filteredEvents = useMemo(
    () => filterAuditEvents(auditEvents, { ...filters, search: searchQuery }),
    [auditEvents, filters, searchQuery],
  );
  const pagination = useMemo(() => paginateEvents(filteredEvents, page, PAGE_SIZE), [filteredEvents, page]);
  const stats = { total: auditEvents.length, filtered: filteredEvents.length };

  const updateFilter = (key, value) => {
    if (key === 'reset') {
      setFilters(INITIAL_FILTERS);
      setSearchQuery('');
    } else {
      setFilters(current => ({ ...current, [key]: value }));
    }
    setPage(0);
  };

  const handleExport = () => {
    if (!filteredEvents.length) return;
    const rows = [
      ['Event', 'Message', 'Actor', 'Record category', 'Activity type', 'Timestamp'],
      ...filteredEvents.map(event => [event.title, event.message, event.actor, event.category, event.type, event.timestamp]),
    ];
    const url = URL.createObjectURL(new Blob([`\uFEFF${toAdminCsv(rows)}`], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'audit-activity.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  return (
    <>
      <Helmet>
        <title>Audit Activity - AcademicProjectHub</title>
        <meta name="description" content="Readable administrative audit activity for Project Approval System administrators." />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Sidebar isCollapsed={isSidebarCollapsed} onToggleCollapse={() => setIsSidebarCollapsed(collapsed => !collapsed)} />
        <main className={`min-w-0 transition-all duration-academic ease-academic ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
          <div className="min-w-0 p-4 md:p-6 lg:p-8">
            <div className="mx-auto min-w-0 max-w-7xl">
              <header className="mb-6 md:mb-8">
                <h1 className="mb-2 break-words font-heading text-2xl font-bold text-foreground md:text-3xl lg:text-4xl">Notification Center</h1>
                <p className="max-w-3xl text-sm leading-6 text-muted-foreground md:text-base">
                  This page currently shows immutable administrative audit events, not personal notifications. Read status and priority are not part of the audit event data.
                </p>
                {isAdmin && (
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                    <span className="rounded-lg bg-muted px-3 py-2 text-foreground">{stats.total} total audit events</span>
                    <span className="rounded-lg bg-muted px-3 py-2 text-muted-foreground">Unread: not tracked</span>
                    <span className="rounded-lg bg-muted px-3 py-2 text-muted-foreground">Priority: not provided</span>
                  </div>
                )}
              </header>

              {!isAdmin ? (
                <section className="rounded-lg border border-border bg-card p-6" role="status">
                  <h2 className="font-semibold text-foreground">Administrative audit activity</h2>
                  <p className="mt-2 text-sm text-muted-foreground">Audit activity is available to administrators only. Personal notifications are not implemented in this system.</p>
                </section>
              ) : (
                <>
                  {loadError && (
                    <div className="mb-5 flex flex-wrap items-center gap-3 rounded-lg border border-error/30 bg-error/10 p-3 text-sm text-error" role="alert">
                      <Icon name="AlertTriangle" size={16} aria-hidden="true" />
                      <span className="min-w-0 flex-1 break-words">{loadError}</span>
                      <button type="button" onClick={() => setReloadKey(key => key + 1)} className="font-medium underline">Try again</button>
                    </div>
                  )}

                  <div className="mb-6 max-w-3xl">
                    <label htmlFor="audit-search" className="mb-1.5 block text-sm font-medium text-foreground">Search activity</label>
                    <Input id="audit-search" type="search" placeholder="Search event, message, actor, or category" value={searchQuery} onChange={event => { setSearchQuery(event.target.value); setPage(0); }} />
                  </div>

                  <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-4 lg:gap-6">
                    <section className="min-w-0 space-y-4 lg:col-span-3" aria-label="Audit activity events" aria-busy={loading}>
                      {loading ? (
                        <div className="flex items-center justify-center gap-3 rounded-lg border border-border bg-card p-12 text-sm text-muted-foreground" role="status">
                          <Icon name="Loader2" size={20} className="animate-spin" aria-hidden="true" />Loading audit activity…
                        </div>
                      ) : pagination.items.length ? (
                        <>
                          {pagination.items.map(event => <NotificationCard key={event.id} event={event} />)}
                          <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-muted-foreground" aria-live="polite">
                              Showing {pagination.firstItem}–{pagination.lastItem} of {filteredEvents.length} matching events ({auditEvents.length} total)
                            </p>
                            <div className="flex items-center justify-end gap-2">
                              <button type="button" onClick={() => setPage(current => Math.max(0, current - 1))} disabled={pagination.currentPage === 0} className="rounded-md border border-input px-3 py-2 text-sm text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50">Previous</button>
                              <span className="whitespace-nowrap text-xs text-muted-foreground" aria-live="polite">Page {pagination.currentPage + 1} of {pagination.pageCount}</span>
                              <button type="button" onClick={() => setPage(current => Math.min(pagination.pageCount - 1, current + 1))} disabled={pagination.currentPage >= pagination.pageCount - 1} className="rounded-md border border-input px-3 py-2 text-sm text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50">Next</button>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="rounded-lg border border-border bg-card p-8 text-center md:p-12">
                          <Icon name="Inbox" size={36} className="mx-auto mb-3 text-muted-foreground" aria-hidden="true" />
                          <h2 className="font-semibold text-foreground">{auditEvents.length ? 'No matching activity' : 'No audit activity available'}</h2>
                          <p className="mx-auto mt-2 max-w-md break-words text-sm leading-6 text-muted-foreground">{auditEvents.length ? 'Change or reset the search and filters to see more audit events.' : 'There are no audit events in the administrator activity dataset.'}</p>
                        </div>
                      )}
                    </section>

                    <aside className="min-w-0 space-y-5">
                      <FilterPanel filters={filters} onFilterChange={updateFilter} categories={categories} stats={stats} />
                      <QuickActions onExport={handleExport} disabled={!filteredEvents.length || loading} />
                    </aside>
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default NotificationCenter;
