import React from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';

const FacultyPerformance = ({ faculty }) => {
  return (
    <div className="bg-card rounded-lg border border-border p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg md:text-xl font-heading font-semibold text-foreground">
          Faculty Performance
        </h2>
        <button className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm text-primary hover:bg-primary/10 transition-colors duration-academic">
          <span>View All</span>
          <Icon name="ArrowRight" size={16} />
        </button>
      </div>
      <div className="space-y-4">
        {faculty?.map((member) => (
          <div 
            key={member?.id}
            className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/30 transition-colors duration-academic"
          >
            <div className="flex items-center space-x-4 flex-1 min-w-0">
              <div className="relative flex-shrink-0">
                <Image 
                  src={member?.avatar}
                  alt={member?.avatarAlt}
                  className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover"
                />
                <div 
                  className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-card ${
                    member?.status === 'active' ? 'bg-success' : 'bg-muted'
                  }`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm md:text-base font-medium text-foreground truncate">
                  {member?.name}
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground truncate">
                  {member?.role}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4 md:space-x-6 flex-shrink-0 ml-4">
              <div className="text-right hidden sm:block">
                <p className="text-xs text-muted-foreground">Projects</p>
                <p className="text-sm md:text-base font-semibold text-foreground">
                  {member?.projects}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Rating</p>
                <div className="flex items-center space-x-1">
                  <Icon name="Star" size={14} color="var(--color-warning)" />
                  <span className="text-sm md:text-base font-semibold text-foreground">
                    {member?.rating}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Workload</p>
                <div className="flex items-center space-x-2">
                  <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        member?.workload > 80 ? 'bg-error' :
                        member?.workload > 60 ? 'bg-warning': 'bg-success'
                      }`}
                      style={{ width: `${member?.workload}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-foreground whitespace-nowrap">
                    {member?.workload}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FacultyPerformance;