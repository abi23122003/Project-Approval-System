import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';

const ConfigurationModal = ({ 
  isOpen, 
  onClose, 
  title, 
  description,
  configType,
  currentConfig,
  onSave 
}) => {
  const [config, setConfig] = useState(currentConfig || {});
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    onSave(config);
    setIsSaving(false);
    onClose();
  };

  const renderConfigFields = () => {
    switch (configType) {
      case 'academic-term':
        return (
          <>
            <Input
              label="Term Name"
              type="text"
              value={config?.termName || ''}
              onChange={(e) => setConfig({ ...config, termName: e?.target?.value })}
              placeholder="e.g., Spring 2026"
              required
              className="mb-4"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Input
                label="Start Date"
                type="date"
                value={config?.startDate || ''}
                onChange={(e) => setConfig({ ...config, startDate: e?.target?.value })}
                required
              />
              <Input
                label="End Date"
                type="date"
                value={config?.endDate || ''}
                onChange={(e) => setConfig({ ...config, endDate: e?.target?.value })}
                required
              />
            </div>
            <Checkbox
              label="Set as Active Term"
              checked={config?.isActive || false}
              onChange={(e) => setConfig({ ...config, isActive: e?.target?.checked })}
              className="mb-4"
            />
          </>
        );
      case 'grading-scale':
        return (
          <>
            <Input
              label="Scale Name"
              type="text"
              value={config?.scaleName || ''}
              onChange={(e) => setConfig({ ...config, scaleName: e?.target?.value })}
              placeholder="e.g., Standard 4.0 Scale"
              required
              className="mb-4"
            />
            <Input
              label="Maximum Points"
              type="number"
              value={config?.maxPoints || ''}
              onChange={(e) => setConfig({ ...config, maxPoints: e?.target?.value })}
              placeholder="100"
              required
              className="mb-4"
            />
            <Select
              label="Grade Type"
              options={[
                { value: 'percentage', label: 'Percentage Based' },
                { value: 'points', label: 'Points Based' },
                { value: 'letter', label: 'Letter Grade' }
              ]}
              value={config?.gradeType || 'percentage'}
              onChange={(value) => setConfig({ ...config, gradeType: value })}
              className="mb-4"
            />
          </>
        );
      case 'notification':
        return (
          <>
            <Input
              label="Notification Template Name"
              type="text"
              value={config?.templateName || ''}
              onChange={(e) => setConfig({ ...config, templateName: e?.target?.value })}
              placeholder="e.g., Project Submission Reminder"
              required
              className="mb-4"
            />
            <Select
              label="Trigger Event"
              options={[
                { value: 'submission', label: 'Project Submission' },
                { value: 'review', label: 'Review Completed' },
                { value: 'deadline', label: 'Deadline Approaching' },
                { value: 'approval', label: 'Approval Required' }
              ]}
              value={config?.triggerEvent || 'submission'}
              onChange={(value) => setConfig({ ...config, triggerEvent: value })}
              className="mb-4"
            />
            <Checkbox
              label="Enable Email Notifications"
              checked={config?.emailEnabled || false}
              onChange={(e) => setConfig({ ...config, emailEnabled: e?.target?.checked })}
              className="mb-2"
            />
            <Checkbox
              label="Enable In-App Notifications"
              checked={config?.inAppEnabled || true}
              onChange={(e) => setConfig({ ...config, inAppEnabled: e?.target?.checked })}
              className="mb-4"
            />
          </>
        );
      case 'workflow':
        return (
          <>
            <Input
              label="Workflow Name"
              type="text"
              value={config?.workflowName || ''}
              onChange={(e) => setConfig({ ...config, workflowName: e?.target?.value })}
              placeholder="e.g., Standard Project Review"
              required
              className="mb-4"
            />
            <Select
              label="Number of Review Stages"
              options={[
                { value: '1', label: '1 Stage' },
                { value: '2', label: '2 Stages' },
                { value: '3', label: '3 Stages' },
                { value: '4', label: '4 Stages' }
              ]}
              value={config?.reviewStages || '2'}
              onChange={(value) => setConfig({ ...config, reviewStages: value })}
              className="mb-4"
            />
            <Checkbox
              label="Require HOD Approval"
              checked={config?.requireHodApproval || true}
              onChange={(e) => setConfig({ ...config, requireHodApproval: e?.target?.checked })}
              className="mb-2"
            />
            <Checkbox
              label="Enable Parallel Reviews"
              checked={config?.parallelReviews || false}
              onChange={(e) => setConfig({ ...config, parallelReviews: e?.target?.checked })}
              className="mb-4"
            />
          </>
        );
      default:
        return (
          <Input
            label="Configuration Value"
            type="text"
            value={config?.value || ''}
            onChange={(e) => setConfig({ ...config, value: e?.target?.value })}
            placeholder="Enter configuration value"
            className="mb-4"
          />
        );
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-card border border-border rounded-lg shadow-elevated w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-4 md:p-6 border-b border-border">
            <div className="min-w-0 flex-1 mr-4">
              <h2 className="font-heading font-semibold text-lg md:text-xl text-foreground mb-1">
                {title}
              </h2>
              {description && (
                <p className="text-xs md:text-sm text-muted-foreground">
                  {description}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors duration-academic flex-shrink-0"
              aria-label="Close modal"
            >
              <Icon name="X" size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            {renderConfigFields()}
          </div>

          <div className="flex items-center justify-end space-x-3 p-4 md:p-6 border-t border-border">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={handleSave}
              loading={isSaving}
              iconName="Save"
              iconPosition="left"
            >
              Save Configuration
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ConfigurationModal;