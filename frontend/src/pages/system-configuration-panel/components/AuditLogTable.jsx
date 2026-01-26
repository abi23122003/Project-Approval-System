import React from 'react';
import Icon from '../../../components/AppIcon';

const AuditLogTable = ({ logs }) => {
  const getActionColor = (action) => {
    switch (action) {
      case 'created':
        return 'text-success bg-success/10';
      case 'updated':
        return 'text-warning bg-warning/10';
      case 'deleted':
        return 'text-error bg-error/10';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'created':
        return 'Plus';
      case 'updated':
        return 'Edit';
      case 'deleted':
        return 'Trash2';
      default:
        return 'Activity';
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                Timestamp
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                Action
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                Configuration
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                User
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {logs?.map((log) => (
              <tr key={log?.id} className="hover:bg-muted/30 transition-colors duration-academic">
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <Icon name="Clock" size={14} color="var(--color-muted-foreground)" />
                    <span className="text-sm text-foreground">{log?.timestamp}</span>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium ${getActionColor(log?.action)}`}>
                    <Icon name={getActionIcon(log?.action)} size={12} />
                    <span className="capitalize">{log?.action}</span>
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm font-medium text-foreground">{log?.configuration}</span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon name="User" size={12} color="var(--color-primary)" />
                    </div>
                    <span className="text-sm text-foreground">{log?.user}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-muted-foreground line-clamp-1">{log?.details}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditLogTable;