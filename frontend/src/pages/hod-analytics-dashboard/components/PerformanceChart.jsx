import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const PerformanceChart = ({ data, title }) => {
  return (
    <div className="bg-card rounded-lg border border-border p-4 md:p-6">
      <h2 className="text-lg md:text-xl font-heading font-semibold text-foreground mb-6">
        {title}
      </h2>
      <div className="w-full h-64 md:h-80" aria-label={title}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis 
              dataKey="name" 
              stroke="var(--color-muted-foreground)"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="var(--color-muted-foreground)"
              style={{ fontSize: '12px' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'var(--color-popover)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                color: 'var(--color-popover-foreground)'
              }}
            />
            <Legend 
              wrapperStyle={{
                fontSize: '12px',
                color: 'var(--color-muted-foreground)'
              }}
            />
            <Bar dataKey="completed" fill="var(--color-success)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="inProgress" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="pending" fill="var(--color-warning)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PerformanceChart;