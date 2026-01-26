import React from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';

const CollaborationIndicator = ({ activeReviewers }) => {
  if (!activeReviewers || activeReviewers?.length === 0) {
    return null;
  }

  return (
    <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 md:p-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
          <Icon name="Users" size={16} color="var(--color-primary)" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-foreground mb-2">Active Reviewers</h4>
          <div className="flex flex-wrap items-center gap-2">
            {activeReviewers?.map((reviewer) => (
              <div key={reviewer?.id} className="flex items-center gap-2 px-3 py-1.5 bg-background border border-border rounded-lg">
                <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                  <Image
                    src={reviewer?.avatar}
                    alt={reviewer?.avatarAlt}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-xs font-medium text-foreground">{reviewer?.name}</span>
                <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {activeReviewers?.length} {activeReviewers?.length === 1 ? 'reviewer is' : 'reviewers are'} currently viewing this project
          </p>
        </div>
      </div>
    </div>
  );
};

export default CollaborationIndicator;