export const summarizeAdminUsers = (users = []) => {
  const summary = {
    total: users.length,
    active: 0,
    inactive: 0,
    activeRoles: { STUDENT: 0, FACULTY: 0, HOD: 0, ADMIN: 0 },
  };

  users.forEach((user) => {
    if (user?.is_active) {
      summary.active += 1;
      if (Object.hasOwn(summary.activeRoles, user.role_code)) {
        summary.activeRoles[user.role_code] += 1;
      }
    } else {
      summary.inactive += 1;
    }
  });

  return summary;
};
