import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const RoleDistributionChart = ({ data }) => {
  const COLORS = {
    'Student': 'var(--color-primary)',
    'Guide': 'var(--color-accent)',
    'Reviewer': 'var(--color-brand-purple)',
    'HOD': 'var(--color-warning)',
    'Admin': 'var(--color-error)'
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload?.length) {
      return (
        <div className="bg-popover border border-border rounded-lg shadow-elevated p-3">
          <p className="text-sm font-medium text-foreground">{payload?.[0]?.name}</p>
          <p className="text-sm text-muted-foreground">
            {payload?.[0]?.value} users ({((payload?.[0]?.value / data?.reduce((sum, item) => sum + item?.value, 0)) * 100)?.toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 md:p-6">
      <h3 className="text-lg md:text-xl font-heading font-semibold text-foreground mb-6">Role Distribution</h3>
      <div className="w-full h-64 md:h-80" aria-label="Role Distribution Pie Chart">
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
              label={({ name, percent }) => `${name} ${(percent * 100)?.toFixed(0)}%`}
            >
              {data?.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS?.[entry?.name]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RoleDistributionChart;