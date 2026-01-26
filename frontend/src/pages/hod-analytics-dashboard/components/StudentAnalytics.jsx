import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Icon from '../../../components/AppIcon';

const StudentAnalytics = ({ data, enrollmentTrend }) => {
  return (
    <div className="bg-card rounded-lg border border-border p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg md:text-xl font-heading font-semibold text-foreground">
          Student Analytics
        </h2>
        <div className="flex items-center space-x-2">
          <button className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors duration-academic">
            <Icon name="Filter" size={16} />
            <span className="hidden sm:inline">Filter</span>
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {data?.map((item, index) => (
          <div 
            key={index}
            className="p-4 rounded-lg border border-border"
          >
            <div className="flex items-center space-x-2 mb-2">
              <Icon name={item?.icon} size={16} color={item?.color} />
              <span className="text-xs text-muted-foreground">{item?.label}</span>
            </div>
            <p className="text-xl md:text-2xl font-heading font-bold text-foreground">
              {item?.value}
            </p>
            {item?.change && (
              <div className="flex items-center space-x-1 mt-1">
                <Icon 
                  name={item?.changeType === 'positive' ? 'TrendingUp' : 'TrendingDown'} 
                  size={12} 
                  color={item?.changeType === 'positive' ? 'var(--color-success)' : 'var(--color-error)'}
                />
                <span className={`text-xs font-medium ${
                  item?.changeType === 'positive' ? 'text-success' : 'text-error'
                }`}>
                  {item?.change}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-4">
          Enrollment Trend (Last 6 Months)
        </h3>
        <div className="w-full h-64" aria-label="Enrollment Trend Line Chart">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={enrollmentTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis 
                dataKey="month" 
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
              <Line 
                type="monotone" 
                dataKey="enrolled" 
                stroke="var(--color-primary)" 
                strokeWidth={2}
                dot={{ fill: 'var(--color-primary)', r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="graduated" 
                stroke="var(--color-success)" 
                strokeWidth={2}
                dot={{ fill: 'var(--color-success)', r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="dropped" 
                stroke="var(--color-error)" 
                strokeWidth={2}
                dot={{ fill: 'var(--color-error)', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default StudentAnalytics;