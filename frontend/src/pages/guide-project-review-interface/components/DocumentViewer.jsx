import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';

import Button from '../../../components/ui/Button';

const DocumentViewer = ({ document, onAnnotate }) => {
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [showComparison, setShowComparison] = useState(false);
  const [annotations, setAnnotations] = useState([]);

  const totalPages = 15;

  const handleZoomIn = () => {
    if (zoom < 200) setZoom(prev => prev + 25);
  };

  const handleZoomOut = () => {
    if (zoom > 50) setZoom(prev => prev - 25);
  };

  const handlePageChange = (direction) => {
    if (direction === 'next' && currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    } else if (direction === 'prev' && currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleAddAnnotation = (type) => {
    const newAnnotation = {
      id: Date.now(),
      type,
      page: currentPage,
      timestamp: new Date()?.toISOString(),
      content: ''
    };
    setAnnotations([...annotations, newAnnotation]);
    if (onAnnotate) onAnnotate(newAnnotation);
  };

  return (
    <div className="h-full flex flex-col bg-card border border-border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <Icon name="FileText" size={18} color="var(--color-primary)" />
          <span className="text-sm font-medium text-foreground">{document?.name}</span>
          <span className="text-xs text-muted-foreground">({document?.size})</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" iconName="Download" iconPosition="left">
            Download
          </Button>
          <Button 
            variant={showComparison ? 'default' : 'outline'} 
            size="sm" 
            iconName="GitCompare"
            onClick={() => setShowComparison(!showComparison)}
          >
            Compare
          </Button>
        </div>
      </div>
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-background">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" iconName="ZoomOut" onClick={handleZoomOut} disabled={zoom <= 50} />
          <span className="text-sm font-medium text-foreground min-w-[60px] text-center">{zoom}%</span>
          <Button variant="ghost" size="sm" iconName="ZoomIn" onClick={handleZoomIn} disabled={zoom >= 200} />
          <div className="w-px h-6 bg-border mx-2" />
          <Button variant="ghost" size="sm" iconName="RotateCcw" />
          <Button variant="ghost" size="sm" iconName="RotateCw" />
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" iconName="ChevronLeft" onClick={() => handlePageChange('prev')} disabled={currentPage === 1} />
          <span className="text-sm text-foreground min-w-[80px] text-center">
            {currentPage} / {totalPages}
          </span>
          <Button variant="ghost" size="sm" iconName="ChevronRight" onClick={() => handlePageChange('next')} disabled={currentPage === totalPages} />
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search in document..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e?.target?.value)}
              className="w-48 px-3 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <Icon name="Search" size={16} color="var(--color-muted-foreground)" className="absolute right-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-muted/20">
        <span className="text-xs font-medium text-muted-foreground">Annotation Tools:</span>
        <Button variant="ghost" size="sm" iconName="Highlighter" onClick={() => handleAddAnnotation('highlight')} />
        <Button variant="ghost" size="sm" iconName="MessageSquare" onClick={() => handleAddAnnotation('comment')} />
        <Button variant="ghost" size="sm" iconName="Pencil" onClick={() => handleAddAnnotation('note')} />
        <Button variant="ghost" size="sm" iconName="Flag" onClick={() => handleAddAnnotation('flag')} />
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{annotations?.length} annotations</span>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4 bg-muted/10">
        <div className={`mx-auto bg-white shadow-elevation-md rounded-lg overflow-hidden transition-smooth ${showComparison ? 'grid grid-cols-2 gap-4' : ''}`} style={{ width: `${zoom}%`, minWidth: '600px' }}>
          <div className="p-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-heading font-bold text-gray-900">Machine Learning Applications in Healthcare</h1>
                <span className="text-sm text-gray-500">Page {currentPage}</span>
              </div>

              <div className="space-y-4 text-gray-800 leading-relaxed">
                <p className="text-base">
                  This research project explores the integration of machine learning algorithms in modern healthcare systems, focusing on predictive diagnostics and patient outcome optimization. The study encompasses three primary areas: disease prediction models, treatment recommendation systems, and patient monitoring frameworks.
                </p>

                <h2 className="text-xl font-heading font-semibold text-gray-900 mt-6">1. Introduction</h2>
                <p className="text-base">
                  The healthcare industry has witnessed unprecedented technological advancement in recent years, with artificial intelligence and machine learning emerging as transformative forces. This project investigates the practical applications of supervised and unsupervised learning techniques in clinical settings, examining their efficacy in improving diagnostic accuracy and treatment outcomes.
                </p>

                <h2 className="text-xl font-heading font-semibold text-gray-900 mt-6">2. Methodology</h2>
                <p className="text-base">
                  Our research methodology employs a mixed-methods approach, combining quantitative analysis of clinical datasets with qualitative assessments from healthcare professionals. We utilized Random Forest, Support Vector Machines, and Neural Network architectures to develop predictive models trained on anonymized patient records from multiple healthcare institutions.
                </p>

                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 my-4">
                  <p className="text-sm text-blue-900">
                    <strong>Key Finding:</strong> The Random Forest model achieved 94.2% accuracy in predicting diabetes onset within a 5-year timeframe, outperforming traditional statistical methods by 12%.
                  </p>
                </div>

                <h2 className="text-xl font-heading font-semibold text-gray-900 mt-6">3. Results and Analysis</h2>
                <p className="text-base">
                  Preliminary results indicate significant improvements in early disease detection rates. The machine learning models demonstrated superior performance in identifying subtle patterns within complex medical data that conventional diagnostic approaches often overlook.
                </p>

                {annotations?.filter(a => a?.page === currentPage)?.map((annotation) => (
                  <div key={annotation?.id} className="bg-yellow-50 border-l-4 border-yellow-400 p-3 my-2">
                    <div className="flex items-start gap-2">
                      <Icon name={annotation?.type === 'highlight' ? 'Highlighter' : annotation?.type === 'comment' ? 'MessageSquare' : annotation?.type === 'flag' ? 'Flag' : 'Pencil'} size={16} color="var(--color-warning)" />
                      <div className="flex-1">
                        <span className="text-xs font-medium text-yellow-900">Annotation added</span>
                        <p className="text-xs text-yellow-800 mt-1">Click to add your comment...</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {showComparison && (
            <div className="p-8 border-l-2 border-primary/20">
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-6">
                  <h1 className="text-2xl font-heading font-bold text-gray-900">Previous Version</h1>
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">v1.0</span>
                </div>

                <div className="space-y-4 text-gray-800 leading-relaxed opacity-75">
                  <p className="text-base">
                    This research project explores machine learning in healthcare, focusing on diagnostics and patient outcomes. The study covers disease prediction, treatment systems, and monitoring.
                  </p>

                  <h2 className="text-xl font-heading font-semibold text-gray-900 mt-6">1. Introduction</h2>
                  <p className="text-base">
                    Healthcare has seen technological advancement with AI and ML as transformative forces. This project investigates applications of learning techniques in clinical settings.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="px-4 py-3 border-t border-border bg-muted/30">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>Submitted: {document?.submittedDate}</span>
            <span>Version: {document?.version}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Keyboard shortcuts:</span>
            <kbd className="px-2 py-1 bg-background border border-border rounded text-xs">Ctrl + ←/→</kbd>
            <span>Navigate pages</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;