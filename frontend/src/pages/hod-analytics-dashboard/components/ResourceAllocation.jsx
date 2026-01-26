import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import Icon from '../../../components/AppIcon';

const ResourceAllocation = ({ data, budgetData }) => {
  const COLORS = [
    'var(--color-primary)',
    'var(--color-accent)',
    'var(--color-success)',
    'var(--color-warning)',
    'var(--color-brand-purple)'
  ];

  return (
    <div className="bg-card rounded-lg border border-border p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg md:text-xl font-heading font-semibold text-foreground">
          Resource Allocation
        </h2>
        <button className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors duration-academic">
          <Icon name="Settings" size={16} />
          <span className="hidden sm:inline">Configure</span>
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-4">
            Budget Distribution
          </h3>
          <div className="w-full h-64" aria-label="Budget Distribution Pie Chart">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS?.[index % COLORS?.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'var(--color-popover)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    color: 'var(--color-popover-foreground)'
                  }}
                />
                <Legend 
                  verticalAlign="bottom"
                  height={36}
                  wrapperStyle={{
                    fontSize: '12px',
                    color: 'var(--color-muted-foreground)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-4">
            Budget Breakdown
          </h3>
          <div className="space-y-4">
            {budgetData?.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS?.[index % COLORS?.length] }}
                    />
                    <span className="text-sm text-foreground">{item?.category}</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    ${item?.amount?.toLocaleString()}
                  </span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-academic"
                    style={{ 
                      width: `${item?.percentage}%`,
                      backgroundColor: COLORS?.[index % COLORS?.length]
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{item?.percentage}% of total budget</span>
                  <span className={`font-medium ${
                    item?.status === 'on-track' ? 'text-success' :
                    item?.status === 'warning'? 'text-warning' : 'text-error'
                  }`}>
                    {item?.statusLabel}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceAllocation;