export const setUserActive = (apiFetch, userId, isActive) => apiFetch(`/admin/users/${userId}/status/`, {
  method: 'PATCH',
  body: JSON.stringify({ is_active: Boolean(isActive) }),
});

export const assignUserDepartment = (apiFetch, userId, departmentId) => apiFetch(`/admin/users/${userId}/department/`, {
  method: 'POST',
  body: JSON.stringify({ department: Number(departmentId) }),
});

export const requestUserPasswordReset = (apiFetch, userId) => apiFetch(`/admin/users/${userId}/password-reset/`, {
  method: 'POST',
  body: JSON.stringify({}),
});

export const completePasswordReset = async (apiFetch, { uid, token, newPassword, confirmPassword }) => {
  if (!uid || !token) throw new Error('This password reset link is invalid or incomplete.');
  if (!newPassword) throw new Error('Enter a new password.');
  if (newPassword !== confirmPassword) throw new Error('The passwords do not match.');
  return await apiFetch('/auth/password-reset/confirm/', {
    method: 'POST',
    body: JSON.stringify({ uid, token, new_password: newPassword }),
  });
};
