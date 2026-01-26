import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ScoringRubricCard = ({ rubric }) => {
  const [expandedCriteria, setExpandedCriteria] = useState(null);

  const toggleCriteria = (criteriaId) => {
    setExpandedCriteria(expandedCriteria === criteriaId ? null : criteriaId);
  };

  const getScoreColor = (score, maxScore) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 85) return 'text-success';
    if (percentage >= 70) return 'text-accent';
    if (percentage >= 50) return 'text-warning';
    return 'text-error';
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="p-4 md:p-6 border-b border-border">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg md:text-xl font-heading font-semibold text-foreground mb-2">
              {rubric?.title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {rubric?.description}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground mb-1">Total Score</p>
            <p className={`text-2xl md:text-3xl font-heading font-bold ${getScoreColor(rubric?.totalScore, rubric?.maxScore)}`}>
              {rubric?.totalScore}/{rubric?.maxScore}
            </p>
          </div>
        </div>

        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-academic"
            style={{ width: `${(rubric?.totalScore / rubric?.maxScore) * 100}%` }}
          />
        </div>
      </div>
      <div className="divide-y divide-border">
        {rubric?.criteria?.map((criteria) => (
          <div key={criteria?.id} className="p-4 md:p-6">
            <button
              onClick={() => toggleCriteria(criteria?.id)}
              className="w-full flex items-start justify-between gap-4 text-left"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="text-base font-heading font-semibold text-foreground">
                    {criteria?.name}
                  </h4>
                  <span className={`text-sm font-semibold ${getScoreColor(criteria?.score, criteria?.maxScore)}`}>
                    {criteria?.score}/{criteria?.maxScore}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {criteria?.description}
                </p>
              </div>
              <Icon
                name={expandedCriteria === criteria?.id ? 'ChevronUp' : 'ChevronDown'}
                size={20}
                className="text-muted-foreground flex-shrink-0"
              />
            </button>

            {expandedCriteria === criteria?.id && (
              <div className="mt-4 pt-4 border-t border-border space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {criteria?.subCriteria?.map((sub) => (
                    <div key={sub?.id} className="bg-muted/30 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-foreground">
                          {sub?.name}
                        </span>
                        <span className={`text-sm font-semibold ${getScoreColor(sub?.score, sub?.maxScore)}`}>
                          {sub?.score}/{sub?.maxScore}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-academic"
                          style={{ width: `${(sub?.score / sub?.maxScore) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {criteria?.feedback && (
                  <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Icon name="MessageSquare" size={18} className="text-accent flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-accent mb-1">Reviewer Feedback</p>
                        <p className="text-sm text-foreground">{criteria?.feedback}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="p-4 md:p-6 border-t border-border bg-muted/30">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Icon name="User" size={18} className="text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Evaluated by</p>
              <p className="text-sm font-medium text-foreground">{rubric?.reviewerName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Icon name="Calendar" size={18} className="text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Evaluation Date</p>
              <p className="text-sm font-medium text-foreground">{rubric?.evaluationDate}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            iconName="Download"
            iconPosition="left"
          >
            Export Report
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ScoringRubricCard;