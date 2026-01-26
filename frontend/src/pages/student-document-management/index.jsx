import React, { useState, useEffect } from 'react';
import Header from '../../components/ui/Header';
import Breadcrumbs from '../../components/ui/Breadcrumbs';
import QuickActions from '../../components/ui/QuickActions';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import DocumentCategoryCard from './components/DocumentCategoryCard';
import DocumentCard from './components/DocumentCard';
import FilterToolbar from './components/FilterToolbar';
import BulkActionsBar from './components/BulkActionsBar';
import UploadZone from './components/UploadZone';
import VersionHistoryModal from './components/VersionHistoryModal';
import DocumentPreviewModal from './components/DocumentPreviewModal';
import Select from '../../components/ui/Select';


const StudentDocumentManagement = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [showUploadZone, setShowUploadZone] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('date');
  const [savedPresets, setSavedPresets] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);

  const categories = [
  {
    id: 'all',
    name: 'All Documents',
    icon: 'FolderOpen',
    fileCount: 47,
    usedStorage: 245,
    totalStorage: 500
  },
  {
    id: 'proposals',
    name: 'Proposals',
    icon: 'FileText',
    fileCount: 12,
    usedStorage: 85,
    totalStorage: 150
  },
  {
    id: 'progress',
    name: 'Progress Reports',
    icon: 'TrendingUp',
    fileCount: 18,
    usedStorage: 120,
    totalStorage: 200
  },
  {
    id: 'final',
    name: 'Final Submissions',
    icon: 'CheckCircle',
    fileCount: 8,
    usedStorage: 95,
    totalStorage: 150
  },
  {
    id: 'supporting',
    name: 'Supporting Materials',
    icon: 'Paperclip',
    fileCount: 9,
    usedStorage: 45,
    totalStorage: 100
  }];


  const documents = [
  {
    id: 1,
    fileName: 'Project_Proposal_Final_v3.pdf',
    version: '3.0',
    uploadDate: '2026-01-20T10:30:00',
    fileSize: 2457600,
    status: 'Approved',
    category: 'Proposals',
    guideApproval: {
      name: 'Dr. Sarah Mitchell',
      avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_17784c577-1763297418164.png",
      avatarAlt: 'Professional headshot of Caucasian woman with shoulder-length brown hair wearing navy blazer'
    },
    submissionDeadline: '2026-01-25T23:59:00',
    metadata: {
      pages: 45,
      wordCount: 12500,
      lastModified: '2026-01-20T10:30:00'
    },
    versionHistory: [
    {
      versionNumber: '3.0',
      uploadDate: '2026-01-20T10:30:00',
      fileSize: 2457600,
      uploadedBy: {
        name: 'John Anderson',
        avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1e48bbba3-1763296151273.png",
        avatarAlt: 'Professional headshot of Caucasian man with short brown hair wearing blue shirt'
      },
      changes: 'Final revisions based on guide feedback, updated methodology section',
      comments: [
      {
        author: 'Dr. Sarah Mitchell',
        date: '2026-01-20T14:00:00',
        text: 'Excellent improvements. Approved for submission.'
      }]

    },
    {
      versionNumber: '2.0',
      uploadDate: '2026-01-15T16:45:00',
      fileSize: 2398720,
      uploadedBy: {
        name: 'John Anderson',
        avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1e48bbba3-1763296151273.png",
        avatarAlt: 'Professional headshot of Caucasian man with short brown hair wearing blue shirt'
      },
      changes: 'Added literature review section, revised abstract',
      comments: []
    }]

  },
  {
    id: 2,
    fileName: 'Progress_Report_January_2026.docx',
    version: '1.0',
    uploadDate: '2026-01-18T14:20:00',
    fileSize: 1048576,
    status: 'Pending Review',
    category: 'Progress Reports',
    guideApproval: null,
    submissionDeadline: '2026-01-22T23:59:00',
    metadata: {
      pages: 15,
      wordCount: 4200,
      lastModified: '2026-01-18T14:20:00'
    },
    versionHistory: [
    {
      versionNumber: '1.0',
      uploadDate: '2026-01-18T14:20:00',
      fileSize: 1048576,
      uploadedBy: {
        name: 'John Anderson',
        avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1e48bbba3-1763296151273.png",
        avatarAlt: 'Professional headshot of Caucasian man with short brown hair wearing blue shirt'
      },
      changes: 'Initial submission',
      comments: []
    }]

  },
  {
    id: 3,
    fileName: 'Literature_Review_Compilation.pdf',
    version: '2.0',
    uploadDate: '2026-01-15T09:15:00',
    fileSize: 3145728,
    status: 'Approved',
    category: 'Supporting Materials',
    guideApproval: {
      name: 'Dr. Sarah Mitchell',
      avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_17784c577-1763297418164.png",
      avatarAlt: 'Professional headshot of Caucasian woman with shoulder-length brown hair wearing navy blazer'
    },
    submissionDeadline: null,
    metadata: {
      pages: 68,
      wordCount: 18900,
      lastModified: '2026-01-15T09:15:00'
    },
    versionHistory: [
    {
      versionNumber: '2.0',
      uploadDate: '2026-01-15T09:15:00',
      fileSize: 3145728,
      uploadedBy: {
        name: 'John Anderson',
        avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1e48bbba3-1763296151273.png",
        avatarAlt: 'Professional headshot of Caucasian man with short brown hair wearing blue shirt'
      },
      changes: 'Added 15 new research papers, updated citations',
      comments: []
    }]

  },
  {
    id: 4,
    fileName: 'Research_Methodology_Draft.docx',
    version: '1.0',
    uploadDate: '2026-01-12T11:30:00',
    fileSize: 786432,
    status: 'Draft',
    category: 'Proposals',
    guideApproval: null,
    submissionDeadline: null,
    metadata: {
      pages: 12,
      wordCount: 3500,
      lastModified: '2026-01-12T11:30:00'
    },
    versionHistory: [
    {
      versionNumber: '1.0',
      uploadDate: '2026-01-12T11:30:00',
      fileSize: 786432,
      uploadedBy: {
        name: 'John Anderson',
        avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1e48bbba3-1763296151273.png",
        avatarAlt: 'Professional headshot of Caucasian man with short brown hair wearing blue shirt'
      },
      changes: 'Initial draft',
      comments: []
    }]

  },
  {
    id: 5,
    fileName: 'Data_Analysis_Results.xlsx',
    version: '1.0',
    uploadDate: '2026-01-10T16:45:00',
    fileSize: 524288,
    status: 'Pending Review',
    category: 'Progress Reports',
    guideApproval: null,
    submissionDeadline: '2026-01-15T23:59:00',
    metadata: {
      sheets: 8,
      rows: 2500,
      lastModified: '2026-01-10T16:45:00'
    },
    versionHistory: [
    {
      versionNumber: '1.0',
      uploadDate: '2026-01-10T16:45:00',
      fileSize: 524288,
      uploadedBy: {
        name: 'John Anderson',
        avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1e48bbba3-1763296151273.png",
        avatarAlt: 'Professional headshot of Caucasian man with short brown hair wearing blue shirt'
      },
      changes: 'Initial data analysis submission',
      comments: []
    }]

  },
  {
    id: 6,
    fileName: 'Presentation_Slides_Defense.pptx',
    version: '3.0',
    uploadDate: '2026-01-08T13:20:00',
    fileSize: 4194304,
    status: 'Approved',
    category: 'Final Submissions',
    guideApproval: {
      name: 'Dr. Sarah Mitchell',
      avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_17784c577-1763297418164.png",
      avatarAlt: 'Professional headshot of Caucasian woman with shoulder-length brown hair wearing navy blazer'
    },
    submissionDeadline: null,
    metadata: {
      slides: 35,
      duration: '25 minutes',
      lastModified: '2026-01-08T13:20:00'
    },
    versionHistory: [
    {
      versionNumber: '3.0',
      uploadDate: '2026-01-08T13:20:00',
      fileSize: 4194304,
      uploadedBy: {
        name: 'John Anderson',
        avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1e48bbba3-1763296151273.png",
        avatarAlt: 'Professional headshot of Caucasian man with short brown hair wearing blue shirt'
      },
      changes: 'Final version with animations and transitions',
      comments: []
    }]

  },
  {
    id: 7,
    fileName: 'Ethics_Approval_Form.pdf',
    version: '1.0',
    uploadDate: '2026-01-05T10:00:00',
    fileSize: 327680,
    status: 'Approved',
    category: 'Supporting Materials',
    guideApproval: {
      name: 'Dr. Sarah Mitchell',
      avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_17784c577-1763297418164.png",
      avatarAlt: 'Professional headshot of Caucasian woman with shoulder-length brown hair wearing navy blazer'
    },
    submissionDeadline: null,
    metadata: {
      pages: 8,
      approvalNumber: 'ETH-2026-0145',
      lastModified: '2026-01-05T10:00:00'
    },
    versionHistory: [
    {
      versionNumber: '1.0',
      uploadDate: '2026-01-05T10:00:00',
      fileSize: 327680,
      uploadedBy: {
        name: 'John Anderson',
        avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1e48bbba3-1763296151273.png",
        avatarAlt: 'Professional headshot of Caucasian man with short brown hair wearing blue shirt'
      },
      changes: 'Approved ethics documentation',
      comments: []
    }]

  },
  {
    id: 8,
    fileName: 'Survey_Questionnaire.docx',
    version: '2.0',
    uploadDate: '2026-01-03T15:30:00',
    fileSize: 245760,
    status: 'Rejected',
    category: 'Supporting Materials',
    guideApproval: {
      name: 'Dr. Sarah Mitchell',
      avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_17784c577-1763297418164.png",
      avatarAlt: 'Professional headshot of Caucasian woman with shoulder-length brown hair wearing navy blazer'
    },
    submissionDeadline: null,
    metadata: {
      pages: 6,
      questions: 45,
      lastModified: '2026-01-03T15:30:00'
    },
    versionHistory: [
    {
      versionNumber: '2.0',
      uploadDate: '2026-01-03T15:30:00',
      fileSize: 245760,
      uploadedBy: {
        name: 'John Anderson',
        avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1e48bbba3-1763296151273.png",
        avatarAlt: 'Professional headshot of Caucasian man with short brown hair wearing blue shirt'
      },
      changes: 'Revised based on initial feedback',
      comments: [
      {
        author: 'Dr. Sarah Mitchell',
        date: '2026-01-04T10:00:00',
        text: 'Questions need to be more specific. Please revise and resubmit.'
      }]

    }]

  }];


  useEffect(() => {
    setFilteredDocuments(documents);
  }, []);

  const handleCategoryChange = (categoryId) => {
    setActiveCategory(categoryId);
    if (categoryId === 'all') {
      setFilteredDocuments(documents);
    } else {
      let filtered = documents?.filter((doc) =>
      doc?.category?.toLowerCase() === categoryId?.toLowerCase()
      );
      setFilteredDocuments(filtered);
    }
  };

  const handleDocumentSelect = (docId, isSelected) => {
    if (isSelected) {
      setSelectedDocuments([...selectedDocuments, docId]);
    } else {
      setSelectedDocuments(selectedDocuments?.filter((id) => id !== docId));
    }
  };

  const handleSelectAll = () => {
    if (selectedDocuments?.length === filteredDocuments?.length) {
      setSelectedDocuments([]);
    } else {
      setSelectedDocuments(filteredDocuments?.map((doc) => doc?.id));
    }
  };

  const handleFilterChange = (filters) => {
    let filtered = [...documents];

    if (filters?.docType !== 'all') {
      filtered = filtered?.filter((doc) =>
      doc?.category?.toLowerCase() === filters?.docType?.toLowerCase()
      );
    }

    if (filters?.status !== 'all') {
      filtered = filtered?.filter((doc) =>
      doc?.status?.toLowerCase()?.replace(' ', '') === filters?.status?.toLowerCase()
      );
    }

    if (filters?.format !== 'all') {
      filtered = filtered?.filter((doc) =>
      doc?.fileName?.toLowerCase()?.endsWith(`.${filters?.format}`)
      );
    }

    if (filters?.dateRange?.start && filters?.dateRange?.end) {
      filtered = filtered?.filter((doc) => {
        const docDate = new Date(doc.uploadDate);
        const startDate = new Date(filters.dateRange.start);
        const endDate = new Date(filters.dateRange.end);
        return docDate >= startDate && docDate <= endDate;
      });
    }

    setFilteredDocuments(filtered);
  };

  const handleSearch = (query) => {
    if (!query?.trim()) {
      setFilteredDocuments(documents);
      return;
    }

    let filtered = documents?.filter((doc) =>
    doc?.fileName?.toLowerCase()?.includes(query?.toLowerCase())
    );
    setFilteredDocuments(filtered);
  };

  const handleSavePreset = (preset) => {
    setSavedPresets([...savedPresets, { ...preset, id: Date.now() }]);
  };

  const handleUpload = (fileData) => {
    console.log('File uploaded:', fileData);
  };

  const handleDownload = (document) => {
    console.log('Downloading:', document?.fileName);
  };

  const handlePreview = (document) => {
    setSelectedDocument(document);
    setShowPreview(true);
  };

  const handleVersionHistory = (document) => {
    setSelectedDocument(document);
    setShowVersionHistory(true);
  };

  const handleRollback = (versionNumber) => {
    console.log('Rolling back to version:', versionNumber);
    setShowVersionHistory(false);
  };

  const handleBulkDownload = () => {
    console.log('Downloading selected documents:', selectedDocuments);
  };

  const handleBulkArchive = () => {
    console.log('Archiving selected documents:', selectedDocuments);
  };

  const handleBulkUpdateStatus = () => {
    console.log('Updating status for selected documents:', selectedDocuments);
  };

  const sortDocuments = (docs) => {
    const sorted = [...docs];
    switch (sortBy) {
      case 'date':
        return sorted?.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
      case 'name':
        return sorted?.sort((a, b) => a?.fileName?.localeCompare(b?.fileName));
      case 'size':
        return sorted?.sort((a, b) => b?.fileSize - a?.fileSize);
      case 'status':
        return sorted?.sort((a, b) => a?.status?.localeCompare(b?.status));
      default:
        return sorted;
    }
  };

  const sortedDocuments = sortDocuments(filteredDocuments);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-16">
        <div className="max-w-[1920px] mx-auto px-4 md:px-6 lg:px-8 py-6">
          <Breadcrumbs />
          <QuickActions />

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-foreground mb-2">
                Document Management
              </h1>
              <p className="text-sm md:text-base text-muted-foreground">
                Manage your academic documents, track submissions, and maintain version control
              </p>
            </div>

            <Button
              variant="default"
              iconName="Upload"
              iconPosition="left"
              onClick={() => setShowUploadZone(!showUploadZone)}>

              Upload Files
            </Button>
          </div>

          {showUploadZone &&
          <div className="mb-6">
              <UploadZone
              onUpload={handleUpload}
              category={activeCategory} />

            </div>
          }

          <FilterToolbar
            onFilterChange={handleFilterChange}
            onSearch={handleSearch}
            onSavePreset={handleSavePreset}
            savedPresets={savedPresets} />


          <div className="flex flex-col lg:flex-row gap-6">
            <aside className="w-full lg:w-1/4 space-y-3">
              {categories?.map((category) =>
              <DocumentCategoryCard
                key={category?.id}
                category={category}
                isActive={activeCategory === category?.id}
                onClick={() => handleCategoryChange(category?.id)} />

              )}
            </aside>

            <main className="flex-1">
              <div className="bg-card border border-border rounded-lg p-4 mb-4">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={handleSelectAll}
                      className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-smooth">

                      <input
                        type="checkbox"
                        checked={selectedDocuments?.length === filteredDocuments?.length && filteredDocuments?.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary focus:ring-offset-0" />

                      <span>Select All ({filteredDocuments?.length})</span>
                    </button>

                    <div className="h-6 w-px bg-border" />

                    <span className="text-sm text-muted-foreground">
                      {selectedDocuments?.length} selected
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Select
                      options={[
                      { value: 'date', label: 'Sort by Date' },
                      { value: 'name', label: 'Sort by Name' },
                      { value: 'size', label: 'Sort by Size' },
                      { value: 'status', label: 'Sort by Status' }]
                      }
                      value={sortBy}
                      onChange={setSortBy}
                      className="w-40" />


                    <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded transition-smooth ${
                        viewMode === 'grid' ? 'bg-card shadow-elevation-sm' : 'hover:bg-card/50'}`
                        }>

                        <Icon name="Grid3x3" size={16} color="var(--color-foreground)" />
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded transition-smooth ${
                        viewMode === 'list' ? 'bg-card shadow-elevation-sm' : 'hover:bg-card/50'}`
                        }>

                        <Icon name="List" size={16} color="var(--color-foreground)" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {sortedDocuments?.length > 0 ?
              <div className={`grid gap-4 ${
              viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`
              }>
                  {sortedDocuments?.map((document) =>
                <DocumentCard
                  key={document?.id}
                  document={document}
                  isSelected={selectedDocuments?.includes(document?.id)}
                  onSelect={handleDocumentSelect}
                  onPreview={handlePreview}
                  onDownload={handleDownload} />

                )}
                </div> :

              <div className="bg-card border border-border rounded-lg p-12 text-center">
                  <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon name="FolderOpen" size={48} color="var(--color-muted-foreground)" />
                  </div>
                  <h3 className="text-lg font-heading font-semibold text-foreground mb-2">
                    No documents found
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Try adjusting your filters or upload new documents
                  </p>
                  <Button
                  variant="default"
                  iconName="Upload"
                  iconPosition="left"
                  onClick={() => setShowUploadZone(true)}>

                    Upload Files
                  </Button>
                </div>
              }
            </main>
          </div>
        </div>
      </div>
      <BulkActionsBar
        selectedCount={selectedDocuments?.length}
        onDownloadAll={handleBulkDownload}
        onArchiveAll={handleBulkArchive}
        onUpdateStatus={handleBulkUpdateStatus}
        onClearSelection={() => setSelectedDocuments([])} />

      {showVersionHistory && selectedDocument &&
      <VersionHistoryModal
        document={selectedDocument}
        onClose={() => setShowVersionHistory(false)}
        onRollback={handleRollback} />

      }
      {showPreview && selectedDocument &&
      <DocumentPreviewModal
        document={selectedDocument}
        onClose={() => setShowPreview(false)}
        onDownload={handleDownload} />

      }
    </div>);

};

export default StudentDocumentManagement;