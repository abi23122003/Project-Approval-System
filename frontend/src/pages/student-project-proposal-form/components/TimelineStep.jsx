import React from 'react';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const TimelineStep = ({ formData, onChange, errors }) => {
  const addMilestone = () => {
    const milestones = formData?.milestones || [];
    onChange('milestones', [
      ...milestones,
      {
        id: Date.now(),
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        deliverables: ''
      }
    ]);
  };

  const removeMilestone = (id) => {
    const milestones = formData?.milestones || [];
    onChange('milestones', milestones?.filter(m => m?.id !== id));
  };

  const updateMilestone = (id, field, value) => {
    const milestones = formData?.milestones || [];
    onChange(
      'milestones',
      milestones?.map(m => (m?.id === id ? { ...m, [field]: value } : m))
    );
  };

  const calculateDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return '';
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const weeks = Math.floor(diffDays / 7);
    const days = diffDays % 7;
    return `${weeks} weeks${days > 0 ? ` ${days} days` : ''}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-lg">
        <Icon name="Calendar" size={20} color="var(--color-primary)" className="flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-foreground">Project Timeline</p>
          <p className="text-xs text-muted-foreground mt-1">
            Break down your project into manageable milestones with clear deliverables and deadlines. Ensure realistic time allocation.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <Input
          label="Project Start Date"
          type="date"
          value={formData?.projectStartDate || ''}
          onChange={(e) => onChange('projectStartDate', e?.target?.value)}
          required
          error={errors?.projectStartDate}
        />
        <Input
          label="Expected Completion Date"
          type="date"
          value={formData?.projectEndDate || ''}
          onChange={(e) => onChange('projectEndDate', e?.target?.value)}
          required
          error={errors?.projectEndDate}
        />
      </div>
      {formData?.projectStartDate && formData?.projectEndDate && (
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-sm text-foreground">
            <span className="font-medium">Total Duration:</span>{' '}
            {calculateDuration(formData?.projectStartDate, formData?.projectEndDate)}
          </p>
        </div>
      )}
      <div>
        <div className="flex items-center justify-between mb-4">
          <label className="block text-sm font-medium text-foreground">
            Project Milestones <span className="text-error">*</span>
          </label>
          <Button
            variant="outline"
            size="sm"
            iconName="Plus"
            iconPosition="left"
            onClick={addMilestone}
          >
            Add Milestone
          </Button>
        </div>

        <div className="space-y-4">
          {(formData?.milestones || [])?.map((milestone, index) => (
            <div
              key={milestone?.id}
              className="p-4 border border-border rounded-lg bg-card space-y-4"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-foreground">
                  Milestone {index + 1}
                </h4>
                <button
                  onClick={() => removeMilestone(milestone?.id)}
                  className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-smooth"
                >
                  <Icon name="Trash2" size={16} />
                </button>
              </div>

              <Input
                label="Milestone Title"
                type="text"
                value={milestone?.title}
                onChange={(e) => updateMilestone(milestone?.id, 'title', e?.target?.value)}
                placeholder="e.g., Literature Review Completion"
                required
                error={errors?.[`milestone_${milestone?.id}_title`]}
              />

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Description
                </label>
                <textarea
                  value={milestone?.description}
                  onChange={(e) => updateMilestone(milestone?.id, 'description', e?.target?.value)}
                  placeholder="Describe what will be accomplished in this milestone"
                  rows={3}
                  maxLength={500}
                  className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {(milestone?.description || '')?.length}/500 characters
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Start Date"
                  type="date"
                  value={milestone?.startDate}
                  onChange={(e) => updateMilestone(milestone?.id, 'startDate', e?.target?.value)}
                  required
                />
                <Input
                  label="End Date"
                  type="date"
                  value={milestone?.endDate}
                  onChange={(e) => updateMilestone(milestone?.id, 'endDate', e?.target?.value)}
                  required
                />
              </div>

              {milestone?.startDate && milestone?.endDate && (
                <div className="p-2 bg-muted rounded text-xs text-foreground">
                  Duration: {calculateDuration(milestone?.startDate, milestone?.endDate)}
                </div>
              )}

              <Input
                label="Expected Deliverables"
                type="text"
                value={milestone?.deliverables}
                onChange={(e) => updateMilestone(milestone?.id, 'deliverables', e?.target?.value)}
                placeholder="e.g., Research paper draft, prototype, documentation"
                required
              />
            </div>
          ))}

          {(!formData?.milestones || formData?.milestones?.length === 0) && (
            <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
              <Icon name="Calendar" size={40} color="var(--color-muted-foreground)" className="mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No milestones added yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Click "Add Milestone" to create your project timeline
              </p>
            </div>
          )}
        </div>

        {errors?.milestones && (
          <p className="text-xs text-error mt-2">{errors?.milestones}</p>
        )}
      </div>
      <div className="flex items-start gap-3 p-4 bg-warning/5 border border-warning/20 rounded-lg">
        <Icon name="Clock" size={20} color="var(--color-warning)" className="flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-foreground">Timeline Tips</p>
          <ul className="text-xs text-muted-foreground mt-2 space-y-1 list-disc list-inside">
            <li>Allow buffer time for unexpected delays</li>
            <li>Consider academic calendar and holidays</li>
            <li>Align milestones with institutional review periods</li>
            <li>Include time for revisions and feedback incorporation</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TimelineStep;