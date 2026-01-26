import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import Icon from '../../../components/AppIcon';

const ComparativeAnalysisChart = ({ data, type = 'bar' }) => {
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload?.length) {
      return (
        <div className="bg-popover border border-border rounded-lg shadow-elevated p-3">
          <p className="text-sm font-semibold text-foreground mb-2">{label}</p>
          {payload?.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <span className="text-xs text-muted-foreground">{entry?.name}:</span>
              <span className="text-xs font-semibold text-foreground">{entry?.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 md:p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg md:text-xl font-heading font-semibold text-foreground mb-2">
            Comparative Analysis
          </h3>
          <p className="text-sm text-muted-foreground">
            Performance comparison across evaluation criteria
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors duration-academic">
            <Icon name="Download" size={16} />
          </button>
          <button className="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors duration-academic">
            <Icon name="Share2" size={16} />
          </button>
        </div>
      </div>

      {type === 'bar' && (
        <div className="w-full h-80" aria-label="Comparative Bar Chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ fontSize: '12px' }}
                iconType="circle"
              />
              <Bar dataKey="currentProject" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="departmentAverage" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="universityAverage" fill="var(--color-secondary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {type === 'radar' && (
        <div className="w-full h-80" aria-label="Comparative Radar Chart">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data}>
              <PolarGrid stroke="var(--color-border)" />
              <PolarAngleAxis 
                dataKey="name" 
                stroke="var(--color-muted-foreground)"
                style={{ fontSize: '12px' }}
              />
              <PolarRadiusAxis 
                stroke="var(--color-muted-foreground)"
                style={{ fontSize: '12px' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ fontSize: '12px' }}
                iconType="circle"
              />
              <Radar 
                name="Current Project" 
                dataKey="currentProject" 
                stroke="var(--color-primary)" 
                fill="var(--color-primary)" 
                fillOpacity={0.6} 
              />
              <Radar 
                name="Department Average" 
                dataKey="departmentAverage" 
                stroke="var(--color-accent)" 
                fill="var(--color-accent)" 
                fillOpacity={0.6} 
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <div>
            <p className="text-xs text-muted-foreground">Current Project</p>
            <p className="text-sm font-semibold text-foreground">82.5 Average</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-accent" />
          <div>
            <p className="text-xs text-muted-foreground">Department Average</p>
            <p className="text-sm font-semibold text-foreground">78.3 Average</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-secondary" />
          <div>
            <p className="text-xs text-muted-foreground">University Average</p>
            <p className="text-sm font-semibold text-foreground">75.8 Average</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComparativeAnalysisChart;