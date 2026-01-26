import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';

const EvaluationForm = ({ onSubmit, onSaveDraft }) => {
  const [expandedSections, setExpandedSections] = useState(['overview']);
  const [formData, setFormData] = useState({
    overallScore: '',
    decision: '',
    comments: '',
    criteriaScores: {},
    revisionRequirements: [],
    plagiarismCheck: false,
    citationValidation: false
  });

  const [showTemplates, setShowTemplates] = useState(false);

  const evaluationCriteria = [
    {
      id: 'research',
      name: 'Research Quality',
      weight: 30,
      subcriteria: [
        { id: 'literature', name: 'Literature Review', maxScore: 10 },
        { id: 'methodology', name: 'Research Methodology', maxScore: 10 },
        { id: 'originality', name: 'Originality', maxScore: 10 }
      ]
    },
    {
      id: 'technical',
      name: 'Technical Implementation',
      weight: 25,
      subcriteria: [
        { id: 'design', name: 'System Design', maxScore: 10 },
        { id: 'implementation', name: 'Implementation Quality', maxScore: 10 },
        { id: 'testing', name: 'Testing & Validation', maxScore: 5 }
      ]
    },
    {
      id: 'documentation',
      name: 'Documentation',
      weight: 20,
      subcriteria: [
        { id: 'clarity', name: 'Clarity & Organization', maxScore: 10 },
        { id: 'completeness', name: 'Completeness', maxScore: 10 }
      ]
    },
    {
      id: 'presentation',
      name: 'Presentation & Communication',
      weight: 15,
      subcriteria: [
        { id: 'writing', name: 'Writing Quality', maxScore: 8 },
        { id: 'visuals', name: 'Visual Aids', maxScore: 7 }
      ]
    },
    {
      id: 'impact',
      name: 'Impact & Feasibility',
      weight: 10,
      subcriteria: [
        { id: 'practical', name: 'Practical Application', maxScore: 5 },
        { id: 'innovation', name: 'Innovation Level', maxScore: 5 }
      ]
    }
  ];

  const commentTemplates = [
    { id: 1, title: 'Excellent Work', content: 'This project demonstrates exceptional understanding of the subject matter with thorough research and well-executed implementation. The documentation is comprehensive and the results are impressive.' },
    { id: 2, title: 'Good Progress', content: 'The project shows good progress with solid fundamentals. Some areas require further refinement, particularly in the methodology section. Overall, the work is on the right track.' },
    { id: 3, title: 'Needs Improvement', content: 'While the project has potential, several key areas need significant improvement. Please address the methodology concerns and strengthen the literature review before resubmission.' },
    { id: 4, title: 'Minor Revisions', content: 'The project is nearly complete with only minor revisions needed. Please address the formatting issues and expand on the conclusion section as discussed.' }
  ];

  const decisionOptions = [
    { value: 'approved', label: 'Approved' },
    { value: 'approved-conditions', label: 'Approved with Conditions' },
    { value: 'minor-revisions', label: 'Minor Revisions Required' },
    { value: 'major-revisions', label: 'Major Revisions Required' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'refer-committee', label: 'Refer to Committee' }
  ];

  const toggleSection = (sectionId) => {
    setExpandedSections(prev =>
      prev?.includes(sectionId)
        ? prev?.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleScoreChange = (criteriaId, subcriteriaId, value) => {
    setFormData(prev => ({
      ...prev,
      criteriaScores: {
        ...prev?.criteriaScores,
        [`${criteriaId}-${subcriteriaId}`]: parseFloat(value) || 0
      }
    }));
  };

  const calculateTotalScore = () => {
    let total = 0;
    evaluationCriteria?.forEach(criteria => {
      criteria?.subcriteria?.forEach(sub => {
        const score = formData?.criteriaScores?.[`${criteria?.id}-${sub?.id}`] || 0;
        total += score;
      });
    });
    return total?.toFixed(1);
  };

  const handleTemplateInsert = (template) => {
    setFormData(prev => ({
      ...prev,
      comments: prev?.comments ? `${prev?.comments}\n\n${template?.content}` : template?.content
    }));
    setShowTemplates(false);
  };

  const handleSubmitReview = () => {
    const reviewData = {
      ...formData,
      totalScore: calculateTotalScore(),
      timestamp: new Date()?.toISOString()
    };
    onSubmit(reviewData);
  };

  return (
    <div className="h-full flex flex-col bg-card border border-border rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="ClipboardCheck" size={18} color="var(--color-primary)" />
            <h3 className="text-sm font-heading font-semibold text-foreground">Evaluation Form</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">Total Score:</span>
            <span className="text-lg font-heading font-bold text-primary">{calculateTotalScore()}/100</span>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4 space-y-4">
        <div className="bg-background border border-border rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('overview')}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-smooth"
          >
            <div className="flex items-center gap-2">
              <Icon name="FileText" size={18} color="var(--color-foreground)" />
              <span className="text-sm font-medium text-foreground">Overview & Decision</span>
            </div>
            <Icon name={expandedSections?.includes('overview') ? 'ChevronUp' : 'ChevronDown'} size={18} color="var(--color-foreground)" />
          </button>

          {expandedSections?.includes('overview') && (
            <div className="px-4 py-4 border-t border-border space-y-4">
              <Select
                label="Review Decision"
                required
                options={decisionOptions}
                value={formData?.decision}
                onChange={(value) => setFormData(prev => ({ ...prev, decision: value }))}
                placeholder="Select decision"
              />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">Overall Comments</label>
                  <Button
                    variant="ghost"
                    size="sm"
                    iconName="FileText"
                    onClick={() => setShowTemplates(!showTemplates)}
                  >
                    Templates
                  </Button>
                </div>

                {showTemplates && (
                  <div className="bg-muted/50 border border-border rounded-lg p-3 space-y-2">
                    {commentTemplates?.map(template => (
                      <button
                        key={template?.id}
                        onClick={() => handleTemplateInsert(template)}
                        className="w-full text-left px-3 py-2 bg-background hover:bg-muted rounded-lg transition-smooth"
                      >
                        <div className="text-sm font-medium text-foreground">{template?.title}</div>
                        <div className="text-xs text-muted-foreground line-clamp-2 mt-1">{template?.content}</div>
                      </button>
                    ))}
                  </div>
                )}

                <textarea
                  value={formData?.comments}
                  onChange={(e) => setFormData(prev => ({ ...prev, comments: e?.target?.value }))}
                  placeholder="Enter your detailed feedback and comments..."
                  rows={6}
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>

              <div className="flex items-center gap-4 pt-2">
                <Checkbox
                  label="Plagiarism check completed"
                  checked={formData?.plagiarismCheck}
                  onChange={(e) => setFormData(prev => ({ ...prev, plagiarismCheck: e?.target?.checked }))}
                />
                <Checkbox
                  label="Citation validation done"
                  checked={formData?.citationValidation}
                  onChange={(e) => setFormData(prev => ({ ...prev, citationValidation: e?.target?.checked }))}
                />
              </div>
            </div>
          )}
        </div>

        {evaluationCriteria?.map((criteria) => (
          <div key={criteria?.id} className="bg-background border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection(criteria?.id)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-smooth"
            >
              <div className="flex items-center gap-2">
                <Icon name="Award" size={18} color="var(--color-foreground)" />
                <span className="text-sm font-medium text-foreground">{criteria?.name}</span>
                <span className="text-xs text-muted-foreground">({criteria?.weight}% weight)</span>
              </div>
              <Icon name={expandedSections?.includes(criteria?.id) ? 'ChevronUp' : 'ChevronDown'} size={18} color="var(--color-foreground)" />
            </button>

            {expandedSections?.includes(criteria?.id) && (
              <div className="px-4 py-4 border-t border-border space-y-3">
                {criteria?.subcriteria?.map((sub) => (
                  <div key={sub?.id} className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="text-sm text-foreground">{sub?.name}</label>
                      <span className="text-xs text-muted-foreground ml-2">(Max: {sub?.maxScore})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max={sub?.maxScore}
                        step="0.5"
                        value={formData?.criteriaScores?.[`${criteria?.id}-${sub?.id}`] || ''}
                        onChange={(e) => handleScoreChange(criteria?.id, sub?.id, e?.target?.value)}
                        className="w-20 px-3 py-1.5 text-sm text-center bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="0"
                      />
                      <span className="text-sm text-muted-foreground">/ {sub?.maxScore}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Icon name="Info" size={18} color="var(--color-primary)" className="mt-0.5" />
            <div className="flex-1 space-y-2">
              <h4 className="text-sm font-medium text-foreground">Compliance Checks</h4>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Icon name="CheckCircle" size={14} color="var(--color-success)" />
                  <span>Plagiarism detection: 2% similarity (Acceptable)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Icon name="CheckCircle" size={14} color="var(--color-success)" />
                  <span>Citation format: IEEE standard compliant</span>
                </div>
                <div className="flex items-center gap-2">
                  <Icon name="AlertCircle" size={14} color="var(--color-warning)" />
                  <span>Word count: 8,450 words (Recommended: 10,000+)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="px-4 py-4 border-t border-border bg-muted/30 space-y-3">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            fullWidth
            iconName="Save"
            iconPosition="left"
            onClick={onSaveDraft}
          >
            Save Draft
          </Button>
          <Button
            variant="default"
            fullWidth
            iconName="Send"
            iconPosition="left"
            onClick={handleSubmitReview}
            disabled={!formData?.decision || calculateTotalScore() === '0.0'}
          >
            Submit Review
          </Button>
        </div>

        <div className="text-xs text-center text-muted-foreground">
          Use number keys (1-9) for quick scoring • Ctrl+S to save draft
        </div>
      </div>
    </div>
  );
};

export default EvaluationForm;