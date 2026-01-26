import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import { Checkbox } from '../../../components/ui/Checkbox';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';

const NotificationSettings = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    digestFrequency: 'daily',
    notifySubmissions: true,
    notifyReviews: true,
    notifyFeedback: true,
    notifyDeadlines: true,
    notifySystem: false,
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00'
  });

  const digestOptions = [
    { value: 'realtime', label: 'Real-time' },
    { value: 'hourly', label: 'Hourly' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' }
  ];

  const handleSave = () => {
    console.log('Saving notification settings:', settings);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-lg shadow-elevated w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border p-4 md:p-6 flex items-center justify-between">
          <h2 className="font-heading font-semibold text-xl md:text-2xl text-foreground">
            Notification Settings
          </h2>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors duration-academic"
            aria-label="Close settings"
          >
            <Icon name="X" size={20} />
          </button>
        </div>

        <div className="p-4 md:p-6 space-y-6">
          <div>
            <h3 className="font-heading font-semibold text-base md:text-lg text-foreground mb-4">
              Delivery Channels
            </h3>
            <div className="space-y-3">
              <Checkbox
                label="Email Notifications"
                description="Receive notifications via email"
                checked={settings?.emailNotifications}
                onChange={(e) => setSettings({ ...settings, emailNotifications: e?.target?.checked })}
              />
              <Checkbox
                label="Push Notifications"
                description="Receive browser push notifications"
                checked={settings?.pushNotifications}
                onChange={(e) => setSettings({ ...settings, pushNotifications: e?.target?.checked })}
              />
              <Checkbox
                label="SMS Notifications"
                description="Receive critical alerts via SMS"
                checked={settings?.smsNotifications}
                onChange={(e) => setSettings({ ...settings, smsNotifications: e?.target?.checked })}
              />
            </div>
          </div>

          <div>
            <Select
              label="Email Digest Frequency"
              description="How often to receive email summaries"
              options={digestOptions}
              value={settings?.digestFrequency}
              onChange={(value) => setSettings({ ...settings, digestFrequency: value })}
            />
          </div>

          <div>
            <h3 className="font-heading font-semibold text-base md:text-lg text-foreground mb-4">
              Notification Types
            </h3>
            <div className="space-y-3">
              <Checkbox
                label="Project Submissions"
                description="New project submissions and updates"
                checked={settings?.notifySubmissions}
                onChange={(e) => setSettings({ ...settings, notifySubmissions: e?.target?.checked })}
              />
              <Checkbox
                label="Review Requests"
                description="New review assignments and completions"
                checked={settings?.notifyReviews}
                onChange={(e) => setSettings({ ...settings, notifyReviews: e?.target?.checked })}
              />
              <Checkbox
                label="Feedback Available"
                description="When feedback is provided on your work"
                checked={settings?.notifyFeedback}
                onChange={(e) => setSettings({ ...settings, notifyFeedback: e?.target?.checked })}
              />
              <Checkbox
                label="Deadline Reminders"
                description="Upcoming deadlines and due dates"
                checked={settings?.notifyDeadlines}
                onChange={(e) => setSettings({ ...settings, notifyDeadlines: e?.target?.checked })}
              />
              <Checkbox
                label="System Updates"
                description="System maintenance and feature updates"
                checked={settings?.notifySystem}
                onChange={(e) => setSettings({ ...settings, notifySystem: e?.target?.checked })}
              />
            </div>
          </div>

          <div>
            <h3 className="font-heading font-semibold text-base md:text-lg text-foreground mb-4">
              Quiet Hours
            </h3>
            <Checkbox
              label="Enable Quiet Hours"
              description="Pause non-critical notifications during specified hours"
              checked={settings?.quietHoursEnabled}
              onChange={(e) => setSettings({ ...settings, quietHoursEnabled: e?.target?.checked })}
              className="mb-4"
            />
            {settings?.quietHoursEnabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-8">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={settings?.quietHoursStart}
                    onChange={(e) => setSettings({ ...settings, quietHoursStart: e?.target?.value })}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={settings?.quietHoursEnd}
                    onChange={(e) => setSettings({ ...settings, quietHoursEnd: e?.target?.value })}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 bg-card border-t border-border p-4 md:p-6 flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="default" onClick={handleSave}>
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;