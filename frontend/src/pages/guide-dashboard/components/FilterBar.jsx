import React, { useState } from 'react';

import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';

const FilterBar = ({ onFilterChange, onSearch, totalStudents, activeFilters }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'pending-review', label: 'Pending Review' },
    { value: 'approved', label: 'Approved' },
    { value: 'needs-revision', label: 'Needs Revision' },
    { value: 'submitted', label: 'Submitted' }
  ];

  const priorityOptions = [
    { value: 'all', label: 'All Priority' },
    { value: 'high', label: 'High Priority' },
    { value: 'medium', label: 'Medium Priority' },
    { value: 'low', label: 'Low Priority' }
  ];

  const phaseOptions = [
    { value: 'all', label: 'All Phases' },
    { value: '1', label: 'Phase 1' },
    { value: '2', label: 'Phase 2' },
    { value: '3', label: 'Phase 3' },
    { value: '4', label: 'Phase 4' }
  ];

  const sortOptions = [
    { value: 'recent', label: 'Most Recent' },
    { value: 'deadline', label: 'Nearest Deadline' },
    { value: 'progress', label: 'Progress Score' },
    { value: 'name', label: 'Student Name' }
  ];

  const handleSearch = (e) => {
    const value = e?.target?.value;
    setSearchQuery(value);
    onSearch(value);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    onFilterChange({
      status: 'all',
      priority: 'all',
      phase: 'all',
      sort: 'recent'
    });
  };

  return (
    <div className="bg-card border-b border-border">
      <div className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
          <div className="flex-1">
            <Input
              type="search"
              placeholder="Search students by name or project..."
              value={searchQuery}
              onChange={handleSearch}
              className="w-full"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              iconName="Filter"
              iconPosition="left"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              Filters
              {activeFilters > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-primary text-primary-foreground rounded-full text-xs">
                  {activeFilters}
                </span>
              )}
            </Button>

            <Button
              variant="outline"
              iconName="Download"
              iconPosition="left"
            >
              Export
            </Button>
          </div>
        </div>

        {isFilterOpen && (
          <div className="bg-muted rounded-lg p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Select
                label="Status"
                options={statusOptions}
                value="all"
                onChange={(value) => onFilterChange({ status: value })}
              />

              <Select
                label="Priority"
                options={priorityOptions}
                value="all"
                onChange={(value) => onFilterChange({ priority: value })}
              />

              <Select
                label="Phase"
                options={phaseOptions}
                value="all"
                onChange={(value) => onFilterChange({ phase: value })}
              />

              <Select
                label="Sort By"
                options={sortOptions}
                value="recent"
                onChange={(value) => onFilterChange({ sort: value })}
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="text-sm text-muted-foreground">
                {totalStudents} students found
              </span>
              <Button
                variant="ghost"
                size="sm"
                iconName="X"
                iconPosition="left"
                onClick={handleClearFilters}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterBar;