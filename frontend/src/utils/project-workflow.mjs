export const FACULTY_REVIEW_DECISIONS = ['APPROVE', 'REJECT'];

export const submitFacultyProjectReview = async (apiFetch, projectId, decision, reason = '') => {
  if (!projectId) throw new Error('Select an assigned project before submitting a review.');
  if (!FACULTY_REVIEW_DECISIONS.includes(decision)) throw new Error('Select Approve or Reject.');
  const response = await apiFetch(`/faculty/projects/${projectId}/review/`, {
    method: 'POST',
    body: JSON.stringify({ decision, reason }),
  });
  if (!response?.id || !response?.project_status) throw new Error('The server did not confirm the project review.');
  return response;
};
