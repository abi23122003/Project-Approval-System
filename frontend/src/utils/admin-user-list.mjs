export const filterAdminUsers = (users = [], { searchTerm = '', role = 'all', status = 'all' } = {}) => {
  const query = searchTerm.trim().toLowerCase();
  return users.filter((user) => {
    const matchesSearch = !query || [user.name, user.email, user.userId]
      .some((value) => String(value ?? '').toLowerCase().includes(query));
    return matchesSearch && (role === 'all' || user.role === role) && (status === 'all' || user.status === status);
  });
};

export const paginateAdminUsers = (users, page, pageSize = 10) => {
  const pageCount = Math.ceil(users.length / pageSize);
  const currentPage = Math.min(Math.max(page, 0), Math.max(pageCount - 1, 0));
  const start = currentPage * pageSize;
  return {
    pageCount,
    currentPage,
    visibleUsers: users.slice(start, start + pageSize),
    firstItem: users.length ? start + 1 : 0,
    lastItem: Math.min(start + pageSize, users.length),
  };
};
