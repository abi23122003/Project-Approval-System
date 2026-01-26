import React from 'react';
import Icon from '../../../components/AppIcon';

const WorkloadMetrics = ({ metrics }) => {
  const metricCards = [
    {
      label: 'Total Advisees',
      value: metrics?.totalAdvisees,
      icon: 'Users',
      color: 'primary',
      change: '+3 this semester'
    },
    {
      label: 'Pending Reviews',
      value: metrics?.pendingReviews,
      icon: 'ClipboardCheck',
      color: 'warning',
      change: 'Requires attention'
    },
    {
      label: 'Approved Projects',
      value: metrics?.approvedProjects,
      icon: 'CheckCircle',
      color: 'success',
      change: `${metrics?.approvalRate}% approval rate`
    },
    {
      label: 'Avg. Progress',
      value: `${metrics?.averageProgress}%`,
      icon: 'TrendingUp',
      color: 'accent',
      change: '+5% from last month'
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      primary: 'bg-primary/10 text-primary',
      warning: 'bg-warning/10 text-warning',
      success: 'bg-success/10 text-success',
      accent: 'bg-accent/10 text-accent'
    };
    return colors?.[color] || colors?.primary;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
      {metricCards?.map((metric, index) => (
        <div
          key={index}
          className="bg-card border border-border rounded-lg p-4 md:p-6 transition-smooth hover:shadow-elevation-md"
        >
          <div className="flex items-start justify-between mb-3">
            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center ${getColorClasses(metric?.color)}`}>
              <Icon name={metric?.icon} size={20} />
            </div>
          </div>

          <h3 className="text-2xl md:text-3xl font-heading font-bold text-foreground mb-1">
            {metric?.value}
          </h3>

          <p className="text-sm md:text-base text-muted-foreground mb-2">
            {metric?.label}
          </p>

          <div className="flex items-center gap-1 text-xs text-success">
            <Icon name="TrendingUp" size={12} />
            <span>{metric?.change}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default WorkloadMetrics;