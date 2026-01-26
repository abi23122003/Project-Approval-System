import React from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';

const GuideInfoCard = ({ guide }) => {
  return (
    <div className="bg-card border border-border rounded-lg p-4 md:p-6 shadow-elevation-sm">
      <h3 className="text-base md:text-lg font-heading font-semibold text-foreground mb-4">
        Faculty Guide
      </h3>
      <div className="flex items-start gap-3 md:gap-4 mb-4">
        <div className="w-12 h-12 md:w-16 md:h-16 rounded-full overflow-hidden flex-shrink-0 bg-muted">
          <Image 
            src={guide?.avatar} 
            alt={guide?.avatarAlt}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm md:text-base font-heading font-semibold text-foreground mb-1">
            {guide?.name}
          </h4>
          <p className="text-xs md:text-sm text-muted-foreground mb-1">
            {guide?.designation}
          </p>
          <p className="text-xs text-muted-foreground">
            {guide?.department}
          </p>
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs md:text-sm">
          <Icon name="Mail" size={16} color="var(--color-muted-foreground)" />
          <a href={`mailto:${guide?.email}`} className="text-primary hover:underline truncate">
            {guide?.email}
          </a>
        </div>

        <div className="flex items-center gap-2 text-xs md:text-sm">
          <Icon name="Phone" size={16} color="var(--color-muted-foreground)" />
          <span className="text-foreground">{guide?.phone}</span>
        </div>

        <div className="flex items-center gap-2 text-xs md:text-sm">
          <Icon name="MapPin" size={16} color="var(--color-muted-foreground)" />
          <span className="text-foreground">{guide?.office}</span>
        </div>

        <div className="flex items-center gap-2 text-xs md:text-sm">
          <Icon name="Clock" size={16} color="var(--color-muted-foreground)" />
          <span className="text-foreground">{guide?.availability}</span>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-border">
        <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-smooth text-sm font-medium">
          <Icon name="Calendar" size={16} />
          <span>Schedule Meeting</span>
        </button>
      </div>
    </div>
  );
};

export default GuideInfoCard;