import React, { useCallback, useEffect, useState } from 'react';
import Header from '../../components/ui/Header';
import Button from '../../components/ui/Button';
import ConfigurationModal from './components/ConfigurationModal';
import { apiFetch, fetchAuditEvents } from '../../utils/api';
import { fetchAcademicTerms, saveAcademicTerm } from '../../utils/academic-terms.mjs';
import { fetchGradingScales, saveGradingScale } from '../../utils/grading-scales.mjs';
import { fetchNotificationTemplates, saveNotificationTemplate } from '../../utils/notification-templates.mjs';
import { createDefaultWorkflowConfiguration, fetchWorkflowConfiguration, saveWorkflowConfiguration } from '../../utils/workflow-configuration.mjs';
import { formatAuditEvent } from '../../utils/audit-event-presentation.mjs';

const options = [
  { key: 'academic-term', label: 'Academic terms', load: fetchAcademicTerms, save: saveAcademicTerm },
  { key: 'grading-scale', label: 'Grading scales', load: fetchGradingScales, save: saveGradingScale },
  { key: 'notification', label: 'Notification templates', load: fetchNotificationTemplates, save: saveNotificationTemplate },
  { key: 'workflow', label: 'Workflow configuration', load: fetchWorkflowConfiguration, save: saveWorkflowConfiguration },
];
const emptyConfig = type => type === 'academic-term' ? { termName: '', startDate: '', endDate: '', isActive: false } : type === 'grading-scale' ? { scaleName: '', maxPoints: '100', gradeType: 'percentage', criteria: [] } : type === 'notification' ? { templateName: '', triggerEvent: 'submission', emailEnabled: false, inAppEnabled: true } : createDefaultWorkflowConfiguration();

const SystemConfigurationPanel = () => {
  const [tab, setTab] = useState('academic-term'); const [records, setRecords] = useState({});
  const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const [audit, setAudit] = useState([]); const [auditLoading, setAuditLoading] = useState(false); const [auditError, setAuditError] = useState('');
  const [modalOpen, setModalOpen] = useState(false); const [config, setConfig] = useState(null); const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { const values = await Promise.all(options.map(option => option.load(apiFetch))); setRecords(Object.fromEntries(options.map((option, index) => [option.key, values[index] == null ? [] : Array.isArray(values[index]) ? values[index] : [values[index]]]))); }
    catch (err) { setError(err.message || 'Could not load configuration.'); }
    finally { setLoading(false); }
  }, []);
  const loadAudit = useCallback(async () => { setAuditLoading(true); setAuditError(''); try { setAudit(await fetchAuditEvents()); } catch (err) { setAuditError(err.message || 'Could not load audit events.'); } finally { setAuditLoading(false); } }, []);
  useEffect(() => { load(); loadAudit(); }, [load, loadAudit]);
  const beginEdit = row => { setConfig(row || emptyConfig(tab)); setModalOpen(true); };
  const save = async value => {
    const selectedOption = options.find(option => option.key === tab);
    setBusy(true);
    try {
      const saved = await selectedOption.save(apiFetch, value);
      const refreshed = await selectedOption.load(apiFetch);
      setRecords(previous => ({ ...previous, [tab]: refreshed == null ? [] : Array.isArray(refreshed) ? refreshed : [refreshed] }));
      await loadAudit();
      return saved;
    } finally { setBusy(false); }
  };
  return <div className="min-h-screen bg-background"><Header/><main className="mx-auto max-w-6xl space-y-6 p-6 pt-24"><h1 className="text-3xl font-bold">System configuration</h1><p className="text-muted-foreground">Manage settings supported by the backend.</p>
    <nav className="flex flex-wrap gap-2" aria-label="Configuration sections">{options.map(option => <button key={option.key} onClick={() => setTab(option.key)} className={`rounded border px-3 py-2 ${tab === option.key ? 'border-primary bg-primary/10' : ''}`}>{option.label}</button>)}</nav>
    {error && <div role="alert" className="rounded border border-error p-4">{error} <Button onClick={load} disabled={loading}>Retry</Button></div>}
    {loading ? <p role="status">Loading configuration…</p> : !error && <section className="space-y-3 rounded border bg-card p-5"><div className="flex items-center justify-between"><h2 className="text-xl font-semibold">{options.find(option => option.key === tab).label}</h2><Button onClick={() => beginEdit(tab === 'workflow' ? (records.workflow || [])[0] || null : null)}>{tab === 'workflow' && (records.workflow || []).length ? 'Configure' : 'Add'}</Button></div>{(records[tab] || []).length ? (records[tab] || []).map((item, index) => <div key={item.id || index} className="flex flex-wrap items-center gap-3 border-t py-3"><div className="mr-auto"><p className="font-medium">{item.termName || item.scaleName || item.templateName || item.workflowName}</p><p className="text-sm text-muted-foreground">{item.startDate ? `${item.startDate} – ${item.endDate}` : item.gradeType || item.triggerEvent || `Stages: ${item.reviewStages}`}</p></div><Button variant="outline" onClick={() => beginEdit(item)}>Edit</Button></div>) : <p className="border-t pt-3">No configuration records yet.</p>}</section>}
    <section className="space-y-3 rounded border bg-card p-5"><div className="flex items-center justify-between"><h2 className="text-xl font-semibold">Administrative audit events</h2><Button variant="outline" onClick={loadAudit} disabled={auditLoading}>Refresh</Button></div>{auditError && <p role="alert" className="text-error">{auditError} <Button onClick={loadAudit} disabled={auditLoading}>Retry</Button></p>}{auditLoading ? <p role="status">Loading audit events…</p> : audit.length ? <ul className="divide-y">{audit.slice(0, 20).map(event => { const item = formatAuditEvent(event); return <li key={event.id} className="py-3"><p className="font-medium">{item.category}: {item.message}</p><p className="text-sm text-muted-foreground">{item.actor} · {event.event_time ? new Date(event.event_time).toLocaleString() : ''}</p></li>; })}</ul> : !auditError && <p>No audit events yet.</p>}</section>
  </main><ConfigurationModal isOpen={modalOpen} onClose={() => { if (!busy) setModalOpen(false); }} title={`Configure ${options.find(option => option.key === tab).label}`} description="Changes are saved to the backend." configType={tab} currentConfig={config} onSave={save} savedTerms={records['academic-term'] || []} savedGradingScales={records['grading-scale'] || []} savedNotificationTemplates={records.notification || []} savedWorkflowConfiguration={(records.workflow || [])[0] || null} onRefreshTerms={load} onRefreshGradingScales={load} onRefreshNotificationTemplates={load} onRefreshWorkflowConfiguration={async () => { await load(); return (records.workflow || [])[0] || createDefaultWorkflowConfiguration(); }}/></div>;
};
export default SystemConfigurationPanel;
