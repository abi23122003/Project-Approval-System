import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';

const StudentContextHeader = ({ student, project }) => {
  const [showHistory, setShowHistory] = useState(false);

  // Review history is fetched per-project; empty until a real endpoint is wired
  const reviewHistory = [];

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="px-4 py-4 md:px-6 md:py-5 bg-gradient-to-r from-primary/5 to-primary/10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full overflow-hidden flex-shrink-0 border-2 border-primary/20">
              <Image
                src={student?.avatar}
                alt={student?.avatarAlt}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg md:text-xl font-heading font-semibold text-foreground">{student?.name}</h2>
              <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-1">
                <span className="text-xs md:text-sm text-muted-foreground">{student?.rollNumber}</span>
                <span className="text-muted-foreground">•</span>
                <span className="text-xs md:text-sm text-muted-foreground">{student?.department}</span>
                <span className="text-muted-foreground">•</span>
                <span className="text-xs md:text-sm text-muted-foreground">{student?.year}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Icon name="Mail" size={14} />
                  <span>{student?.email}</span>
                </div>
                <span className="text-muted-foreground">•</span>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Icon name="Phone" size={14} />
                  <span>{student?.phone}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              iconName="History"
              iconPosition="left"
              onClick={() => setShowHistory(!showHistory)}
            >
              Review History
            </Button>
            <Button
              variant="ghost"
              size="sm"
              iconName="MessageSquare"
              iconPosition="left"
            >
              Contact Student
            </Button>
          </div>
        </div>
      </div>
      <div className="px-4 py-3 md:px-6 md:py-4 border-t border-border">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Project Title</div>
            <div className="text-sm font-medium text-foreground line-clamp-2">{project?.title}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Current Phase</div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded">
                {project?.phase}
              </span>
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Submission Date</div>
            <div className="flex items-center gap-1.5 text-sm text-foreground">
              <Icon name="Calendar" size={14} />
              <span>{project?.submissionDate}</span>
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Review Deadline</div>
            <div className="flex items-center gap-1.5 text-sm text-error">
              <Icon name="Clock" size={14} />
              <span>{project?.reviewDeadline}</span>
            </div>
          </div>
        </div>
      </div>
      {showHistory && (
        <>
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[1030]"
            onClick={() => setShowHistory(false)}
          />
          <div className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-3xl bg-card border border-border rounded-lg shadow-elevation-2xl z-[1040] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4 border-b border-border">
              <h3 className="text-base md:text-lg font-heading font-semibold text-foreground">Review History</h3>
              <button
                onClick={() => setShowHistory(false)}
                className="p-2 hover:bg-muted rounded-lg transition-smooth"
              >
                <Icon name="X" size={20} color="var(--color-foreground)" />
              </button>
            </div>

            <div className="p-4 md:p-6 max-h-[calc(100vh-200px)] md:max-h-96 overflow-y-auto">
              <div className="space-y-4">
                {reviewHistory?.map((review, index) => (
                  <div key={review?.id} className="relative">
                    {index !== reviewHistory?.length - 1 && (
                      <div className="absolute left-4 top-12 bottom-0 w-px bg-border" />
                    )}
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 relative z-10">
                        <Icon name="CheckCircle" size={16} color="var(--color-primary)" />
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
                          <div>
                            <h4 className="text-sm font-medium text-foreground">{review?.phase}</h4>
                            <p className="text-xs text-muted-foreground mt-0.5">Reviewed by {review?.reviewer}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded ${
                              review?.decision === 'Approved' ? 'bg-success/10 text-success' :
                              review?.decision === 'Minor Revisions'? 'bg-warning/10 text-warning' : 'bg-error/10 text-error'
                            }`}>
                              {review?.decision}
                            </span>
                            <span className="text-sm font-medium text-foreground">{review?.score}/100</span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{review?.comments}</p>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Icon name="Calendar" size={12} />
                          <span>{review?.date}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default StudentContextHeader;