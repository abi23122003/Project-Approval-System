import React, { useState } from 'react';

import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';

const FilterToolbar = ({ onFilterChange, onSearch, onSavePreset, savedPresets }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocType, setSelectedDocType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedFormat, setSelectedFormat] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [presetName, setPresetName] = useState('');

  const documentTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'proposal', label: 'Proposals' },
    { value: 'progress', label: 'Progress Reports' },
    { value: 'final', label: 'Final Submissions' },
    { value: 'supporting', label: 'Supporting Materials' }
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'approved', label: 'Approved' },
    { value: 'pending', label: 'Pending Review' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'draft', label: 'Draft' }
  ];

  const formatOptions = [
    { value: 'all', label: 'All Formats' },
    { value: 'pdf', label: 'PDF' },
    { value: 'doc', label: 'Word Documents' },
    { value: 'xls', label: 'Excel Sheets' },
    { value: 'ppt', label: 'Presentations' },
    { value: 'zip', label: 'Archives' }
  ];

  const handleSearch = (value) => {
    setSearchQuery(value);
    onSearch(value);
  };

  const handleApplyFilters = () => {
    onFilterChange({
      docType: selectedDocType,
      status: selectedStatus,
      format: selectedFormat,
      dateRange
    });
  };

  const handleClearFilters = () => {
    setSelectedDocType('all');
    setSelectedStatus('all');
    setSelectedFormat('all');
    setDateRange({ start: '', end: '' });
    setSearchQuery('');
    onFilterChange({
      docType: 'all',
      status: 'all',
      format: 'all',
      dateRange: { start: '', end: '' }
    });
    onSearch('');
  };

  const handleSavePreset = () => {
    if (presetName?.trim()) {
      onSavePreset({
        name: presetName,
        filters: {
          docType: selectedDocType,
          status: selectedStatus,
          format: selectedFormat,
          dateRange
        }
      });
      setPresetName('');
      setShowPresetModal(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-6">
      <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 mb-4">
        <div className="flex-1 w-full lg:w-auto">
          <Input
            type="search"
            placeholder="Search documents by name..."
            value={searchQuery}
            onChange={(e) => handleSearch(e?.target?.value)}
            className="w-full"
          />
        </div>

        <div className="flex items-center gap-2 w-full lg:w-auto">
          <Button
            variant="outline"
            iconName="Filter"
            iconPosition="left"
            onClick={handleApplyFilters}
            className="flex-1 lg:flex-initial"
          >
            Apply Filters
          </Button>
          <Button
            variant="ghost"
            iconName="X"
            onClick={handleClearFilters}
            className="flex-1 lg:flex-initial"
          >
            Clear
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Select
          label="Document Type"
          options={documentTypes}
          value={selectedDocType}
          onChange={setSelectedDocType}
        />

        <Select
          label="Status"
          options={statusOptions}
          value={selectedStatus}
          onChange={setSelectedStatus}
        />

        <Select
          label="File Format"
          options={formatOptions}
          value={selectedFormat}
          onChange={setSelectedFormat}
        />

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Date Range</label>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={dateRange?.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e?.target?.value })}
              className="flex-1"
            />
            <span className="text-muted-foreground">to</span>
            <Input
              type="date"
              value={dateRange?.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e?.target?.value })}
              className="flex-1"
            />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Saved Presets:</span>
          {savedPresets?.length > 0 ? (
            <div className="flex items-center gap-2 flex-wrap">
              {savedPresets?.map((preset) => (
                <button
                  key={preset?.id}
                  onClick={() => {
                    setSelectedDocType(preset?.filters?.docType);
                    setSelectedStatus(preset?.filters?.status);
                    setSelectedFormat(preset?.filters?.format);
                    setDateRange(preset?.filters?.dateRange);
                  }}
                  className="px-3 py-1 bg-muted rounded-full text-xs font-medium text-foreground hover:bg-primary hover:text-primary-foreground transition-smooth"
                >
                  {preset?.name}
                </button>
              ))}
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">No saved presets</span>
          )}
        </div>

        <Button
          variant="ghost"
          iconName="Save"
          iconPosition="left"
          onClick={() => setShowPresetModal(true)}
        >
          Save Preset
        </Button>
      </div>
      {showPresetModal && (
        <>
          <div
            className="fixed inset-0 bg-background/80 z-[1010]"
            onClick={() => setShowPresetModal(false)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card border border-border rounded-lg shadow-elevation-xl z-[1020] p-6">
            <h3 className="text-lg font-heading font-semibold text-foreground mb-4">
              Save Filter Preset
            </h3>
            <Input
              label="Preset Name"
              placeholder="Enter preset name..."
              value={presetName}
              onChange={(e) => setPresetName(e?.target?.value)}
              className="mb-4"
            />
            <div className="flex items-center gap-2 justify-end">
              <Button
                variant="ghost"
                onClick={() => setShowPresetModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={handleSavePreset}
                disabled={!presetName?.trim()}
              >
                Save Preset
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FilterToolbar;