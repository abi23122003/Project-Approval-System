import React from 'react';
import Icon from '../../../components/AppIcon';

const DepartmentOverview = ({ data }) => {
  return (
    <div className="bg-card rounded-lg border border-border p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg md:text-xl font-heading font-semibold text-foreground">
          Department Overview
        </h2>
        <button className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors duration-academic">
          <Icon name="Download" size={16} />
          <span className="hidden sm:inline">Export</span>
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {data?.map((item, index) => (
          <div 
            key={index}
            className="p-4 rounded-lg border border-border hover:border-primary/30 transition-colors duration-academic"
          >
            <div className="flex items-center justify-between mb-3">
              <div 
                className="flex items-center justify-center w-10 h-10 rounded-lg"
                style={{ backgroundColor: `${item?.color}15` }}
              >
                <Icon name={item?.icon} size={20} color={item?.color} />
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                item?.status === 'excellent' ? 'bg-success/10 text-success' :
                item?.status === 'good' ? 'bg-accent/10 text-accent' :
                item?.status === 'average'? 'bg-warning/10 text-warning' : 'bg-muted text-muted-foreground'
              }`}>
                {item?.statusLabel}
              </span>
            </div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">
              {item?.label}
            </h3>
            <p className="text-xl md:text-2xl font-heading font-bold text-foreground">
              {item?.value}
            </p>
            {item?.subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{item?.subtitle}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DepartmentOverview;