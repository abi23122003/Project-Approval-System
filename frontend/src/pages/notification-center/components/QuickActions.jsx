import React from 'react';
import Icon from '../../../components/AppIcon';

const QuickActions = ({ onExport, disabled }) => (
  <section className="min-w-0 rounded-lg border border-border bg-card p-4 md:p-5" aria-labelledby="activity-actions-heading">
    <h2 id="activity-actions-heading" className="mb-3 text-lg font-semibold text-foreground">Activity actions</h2>
    <p className="mb-4 text-sm leading-5 text-muted-foreground">Audit history is preserved by the system. Read, archive, and delete actions are not available for audit events.</p>
    <button type="button" onClick={onExport} disabled={disabled} className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-input px-3 py-2 text-sm font-medium text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
      <Icon name="Download" size={16} aria-hidden="true" />Export filtered activity as CSV
    </button>
  </section>
);

export default QuickActions;
