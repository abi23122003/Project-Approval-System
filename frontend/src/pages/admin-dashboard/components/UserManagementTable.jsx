import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';

const UserManagementTable = ({ users, onEditUser, onDeleteUser, onViewDetails }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredUsers = users?.filter(user => {
    const matchesSearch = user?.name?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
                         user?.email?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
                         user?.userId?.toLowerCase()?.includes(searchTerm?.toLowerCase());
    const matchesRole = roleFilter === 'all' || user?.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user?.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadgeColor = (role) => {
    const colors = {
      'Student': 'bg-primary/10 text-primary',
      'Guide': 'bg-accent/10 text-accent',
      'Reviewer': 'bg-brand-purple/10 text-brand-purple',
      'HOD': 'bg-warning/10 text-warning',
      'Admin': 'bg-error/10 text-error'
    };
    return colors?.[role] || 'bg-muted text-muted-foreground';
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      'Active': 'bg-success/10 text-success',
      'Inactive': 'bg-muted text-muted-foreground',
      'Suspended': 'bg-error/10 text-error',
      'Pending': 'bg-warning/10 text-warning'
    };
    return colors?.[status] || 'bg-muted text-muted-foreground';
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="p-4 md:p-6 border-b border-border">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <h3 className="text-lg md:text-xl font-heading font-semibold text-foreground">User Management</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 sm:flex-initial sm:w-64">
              <Icon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e?.target?.value)}
                className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e?.target?.value)}
              className="px-4 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Roles</option>
              <option value="Student">Student</option>
              <option value="Guide">Guide</option>
              <option value="Reviewer">Reviewer</option>
              <option value="HOD">HOD</option>
              <option value="Admin">Admin</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e?.target?.value)}
              className="px-4 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Suspended">Suspended</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">User</th>
              <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">User ID</th>
              <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Role</th>
              <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
              <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Last Active</th>
              <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredUsers?.map((user) => (
              <tr key={user?.id} className="hover:bg-muted/30 transition-colors duration-academic">
                <td className="px-4 md:px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden">
                      <Image
                        src={user?.avatar}
                        alt={user?.avatarAlt}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 md:px-6 py-4">
                  <span className="text-sm text-foreground font-mono">{user?.userId}</span>
                </td>
                <td className="px-4 md:px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user?.role)}`}>
                    {user?.role}
                  </span>
                </td>
                <td className="px-4 md:px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(user?.status)}`}>
                    {user?.status}
                  </span>
                </td>
                <td className="px-4 md:px-6 py-4">
                  <span className="text-sm text-muted-foreground">{user?.lastActive}</span>
                </td>
                <td className="px-4 md:px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onViewDetails(user)}
                      className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors duration-academic"
                      aria-label="View details"
                    >
                      <Icon name="Eye" size={16} />
                    </button>
                    <button
                      onClick={() => onEditUser(user)}
                      className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors duration-academic"
                      aria-label="Edit user"
                    >
                      <Icon name="Edit" size={16} />
                    </button>
                    <button
                      onClick={() => onDeleteUser(user)}
                      className="p-1.5 text-muted-foreground hover:text-error hover:bg-error/10 rounded transition-colors duration-academic"
                      aria-label="Delete user"
                    >
                      <Icon name="Trash2" size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filteredUsers?.length === 0 && (
        <div className="p-8 md:p-12 text-center">
          <Icon name="Users" size={48} className="mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No users found matching your criteria</p>
        </div>
      )}
      <div className="p-4 md:p-6 border-t border-border flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
        <p className="text-sm text-muted-foreground">
          Showing {filteredUsers?.length} of {users?.length} users
        </p>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" iconName="ChevronLeft">
            Previous
          </Button>
          <Button variant="outline" size="sm" iconName="ChevronRight" iconPosition="right">
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UserManagementTable;