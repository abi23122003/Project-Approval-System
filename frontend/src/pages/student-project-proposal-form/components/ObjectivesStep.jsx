import React from 'react';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const ObjectivesStep = ({ formData, onChange, errors }) => {
  const addObjective = () => {
    const objectives = formData?.objectives || [];
    onChange('objectives', [...objectives, { id: Date.now(), text: '' }]);
  };

  const removeObjective = (id) => {
    const objectives = formData?.objectives || [];
    onChange('objectives', objectives?.filter(obj => obj?.id !== id));
  };

  const updateObjective = (id, text) => {
    const objectives = formData?.objectives || [];
    onChange('objectives', objectives?.map(obj => obj?.id === id ? { ...obj, text } : obj));
  };

  const addOutcome = () => {
    const outcomes = formData?.expectedOutcomes || [];
    onChange('expectedOutcomes', [...outcomes, { id: Date.now(), text: '' }]);
  };

  const removeOutcome = (id) => {
    const outcomes = formData?.expectedOutcomes || [];
    onChange('expectedOutcomes', outcomes?.filter(out => out?.id !== id));
  };

  const updateOutcome = (id, text) => {
    const outcomes = formData?.expectedOutcomes || [];
    onChange('expectedOutcomes', outcomes?.map(out => out?.id === id ? { ...out, text } : out));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-lg">
        <Icon name="Target" size={20} color="var(--color-primary)" className="flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-foreground">Define Clear Objectives</p>
          <p className="text-xs text-muted-foreground mt-1">
            List specific, measurable objectives that your project aims to achieve. Each objective should be clear and actionable.
          </p>
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-4">
          <label className="block text-sm font-medium text-foreground">
            Project Objectives <span className="text-error">*</span>
          </label>
          <Button
            variant="outline"
            size="sm"
            iconName="Plus"
            iconPosition="left"
            onClick={addObjective}
          >
            Add Objective
          </Button>
        </div>
        <div className="space-y-3">
          {(formData?.objectives || [])?.map((objective, index) => (
            <div key={objective?.id} className="flex items-start gap-3">
              <div className="flex-1">
                <Input
                  type="text"
                  value={objective?.text}
                  onChange={(e) => updateObjective(objective?.id, e?.target?.value)}
                  placeholder={`Objective ${index + 1}`}
                  error={errors?.[`objective_${objective?.id}`]}
                />
              </div>
              <button
                onClick={() => removeObjective(objective?.id)}
                className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-smooth mt-1"
              >
                <Icon name="Trash2" size={18} />
              </button>
            </div>
          ))}
          {(!formData?.objectives || formData?.objectives?.length === 0) && (
            <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
              <Icon name="Target" size={32} color="var(--color-muted-foreground)" className="mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No objectives added yet</p>
              <p className="text-xs text-muted-foreground mt-1">Click "Add Objective" to get started</p>
            </div>
          )}
        </div>
        {errors?.objectives && (
          <p className="text-xs text-error mt-2">{errors?.objectives}</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Problem Statement <span className="text-error">*</span>
        </label>
        <textarea
          value={formData?.problemStatement || ''}
          onChange={(e) => onChange('problemStatement', e?.target?.value)}
          placeholder="Describe the problem your project addresses and its significance"
          rows={6}
          maxLength={2000}
          className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-muted-foreground">
            Clearly articulate the problem and its context
          </p>
          <p className="text-xs text-muted-foreground">
            {(formData?.problemStatement || '')?.length}/2000 characters
          </p>
        </div>
        {errors?.problemStatement && (
          <p className="text-xs text-error mt-1">{errors?.problemStatement}</p>
        )}
      </div>
      <div>
        <div className="flex items-center justify-between mb-4">
          <label className="block text-sm font-medium text-foreground">
            Expected Outcomes <span className="text-error">*</span>
          </label>
          <Button
            variant="outline"
            size="sm"
            iconName="Plus"
            iconPosition="left"
            onClick={addOutcome}
          >
            Add Outcome
          </Button>
        </div>
        <div className="space-y-3">
          {(formData?.expectedOutcomes || [])?.map((outcome, index) => (
            <div key={outcome?.id} className="flex items-start gap-3">
              <div className="flex-1">
                <Input
                  type="text"
                  value={outcome?.text}
                  onChange={(e) => updateOutcome(outcome?.id, e?.target?.value)}
                  placeholder={`Expected outcome ${index + 1}`}
                  error={errors?.[`outcome_${outcome?.id}`]}
                />
              </div>
              <button
                onClick={() => removeOutcome(outcome?.id)}
                className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-smooth mt-1"
              >
                <Icon name="Trash2" size={18} />
              </button>
            </div>
          ))}
          {(!formData?.expectedOutcomes || formData?.expectedOutcomes?.length === 0) && (
            <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
              <Icon name="TrendingUp" size={32} color="var(--color-muted-foreground)" className="mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No expected outcomes added yet</p>
              <p className="text-xs text-muted-foreground mt-1">Click "Add Outcome" to get started</p>
            </div>
          )}
        </div>
        {errors?.expectedOutcomes && (
          <p className="text-xs text-error mt-2">{errors?.expectedOutcomes}</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Scope and Limitations
        </label>
        <textarea
          value={formData?.scopeLimitations || ''}
          onChange={(e) => onChange('scopeLimitations', e?.target?.value)}
          placeholder="Define the boundaries of your project and any known limitations"
          rows={5}
          maxLength={1500}
          className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
        <p className="text-xs text-muted-foreground mt-2">
          {(formData?.scopeLimitations || '')?.length}/1500 characters
        </p>
      </div>
    </div>
  );
};

export default ObjectivesStep;