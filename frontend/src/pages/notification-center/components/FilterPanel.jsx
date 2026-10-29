import React from 'react';
import Icon from '../../../components/AppIcon';

const ACTIVITY_TYPES = ['Departments', 'Users', 'Projects', 'Join Requests', 'Progress', 'Other Activity'];
const TIME_RANGES = [
  ['all', 'All time'],
  ['today', 'Today'],
  ['week', 'Past 7 days'],
  ['month', 'Past 30 days'],
];

const FilterSelect = ({ id, label, value, options, onChange }) => (
  <div>
    <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>
    <select id={id} value={value} onChange={event => onChange(event.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
      {options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}
    </select>
  </div>
);

const FilterPanel = ({ filters, onFilterChange, categories, stats }) => (
  <section className="min-w-0 rounded-lg border border-border bg-card p-4 md:p-5" aria-labelledby="activity-filters-heading">
    <div className="mb-5 flex items-center justify-between gap-3">
      <h2 id="activity-filters-heading" className="text-lg font-semibold text-foreground">Filters</h2>
      <button type="button" onClick={() => onFilterChange('reset')} className="inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <Icon name="RotateCcw" size={16} aria-hidden="true" />Reset
      </button>
    </div>
    <div className="space-y-4">
      <FilterSelect id="activity-type-filter" label="Activity type" value={filters.type} onChange={value => onFilterChange('type', value)} options={[
        ['all', 'All activity types'], ...ACTIVITY_TYPES.map(type => [type, type]),
      ]} />
      <FilterSelect id="activity-category-filter" label="Record category" value={filters.category} onChange={value => onFilterChange('category', value)} options={[
        ['all', 'All record categories'], ...categories.map(category => [category, category]),
      ]} />
      <FilterSelect id="activity-time-filter" label="Time range" value={filters.timeRange} onChange={value => onFilterChange('timeRange', value)} options={TIME_RANGES} />
    </div>
    <div className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
      <h3 className="font-semibold text-foreground">Activity counts</h3>
      <div className="flex justify-between gap-3"><span className="text-muted-foreground">Total audit events</span><span className="font-semibold text-foreground">{stats.total}</span></div>
      <div className="flex justify-between gap-3"><span className="text-muted-foreground">Matching filters</span><span className="font-semibold text-foreground">{stats.filtered}</span></div>
      <p className="pt-2 text-xs leading-5 text-muted-foreground">Unread status and priority are not stored for audit events.</p>
    </div>
  </section>
);

export default FilterPanel;
