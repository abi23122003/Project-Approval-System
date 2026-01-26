import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const AssessmentHistoryTable = ({ assessments }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'completed', label: 'Completed' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'pending', label: 'Pending' }
  ];

  const getScoreColor = (score) => {
    if (score >= 85) return 'text-success';
    if (score >= 70) return 'text-accent';
    if (score >= 50) return 'text-warning';
    return 'text-error';
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-success/10 text-success border-success/20';
      case 'in-progress':
        return 'bg-accent/10 text-accent border-accent/20';
      case 'pending':
        return 'bg-warning/10 text-warning border-warning/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const filteredAssessments = assessments?.filter(assessment => {
    const matchesSearch = assessment?.projectTitle?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
                         assessment?.studentName?.toLowerCase()?.includes(searchTerm?.toLowerCase());
    const matchesStatus = filterStatus === 'all' || assessment?.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredAssessments?.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAssessments = filteredAssessments?.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="p-4 md:p-6 border-b border-border">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <h2 className="text-lg md:text-xl font-heading font-semibold text-foreground">
            Assessment History
          </h2>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <Input
              type="search"
              placeholder="Search projects or students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e?.target?.value)}
              className="w-full sm:w-64"
            />
            <Select
              options={statusOptions}
              value={filterStatus}
              onChange={setFilterStatus}
              className="w-full sm:w-48"
            />
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Project
              </th>
              <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Student
              </th>
              <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Score
              </th>
              <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 md:px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginatedAssessments?.map((assessment) => (
              <tr key={assessment?.id} className="hover:bg-muted/30 transition-colors duration-academic">
                <td className="px-4 md:px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden bg-muted">
                      <Image
                        src={assessment?.projectImage}
                        alt={assessment?.projectImageAlt}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground line-clamp-1">
                        {assessment?.projectTitle}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {assessment?.department}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 md:px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden bg-muted">
                      <Image
                        src={assessment?.studentAvatar}
                        alt={assessment?.studentAvatarAlt}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-sm text-foreground whitespace-nowrap">
                      {assessment?.studentName}
                    </span>
                  </div>
                </td>
                <td className="px-4 md:px-6 py-4">
                  <span className={`text-sm font-semibold ${getScoreColor(assessment?.score)}`}>
                    {assessment?.score}/100
                  </span>
                </td>
                <td className="px-4 md:px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${getStatusBadge(assessment?.status)}`}>
                    {assessment?.status?.charAt(0)?.toUpperCase() + assessment?.status?.slice(1)?.replace('-', ' ')}
                  </span>
                </td>
                <td className="px-4 md:px-6 py-4">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    {assessment?.evaluationDate}
                  </span>
                </td>
                <td className="px-4 md:px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      iconName="Eye"
                    >
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      iconName="Download"
                    >
                      Export
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filteredAssessments?.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <Icon name="Search" size={48} className="text-muted-foreground mb-4" />
          <p className="text-base font-medium text-foreground mb-1">No assessments found</p>
          <p className="text-sm text-muted-foreground">Try adjusting your search or filter criteria</p>
        </div>
      )}
      {filteredAssessments?.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 md:p-6 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredAssessments?.length)} of {filteredAssessments?.length} assessments
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              iconName="ChevronLeft"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            >
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors duration-academic ${
                      currentPage === pageNum
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              iconName="ChevronRight"
              iconPosition="right"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssessmentHistoryTable;