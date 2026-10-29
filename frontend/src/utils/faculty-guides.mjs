export const mapFacultyGuideResponse = response => {
  if (!response || !Array.isArray(response.mentors)) {
    throw new Error('The faculty guide response was incomplete. Please retry.');
  }

  return {
    department: response.department || null,
    mentors: response.mentors
      .filter(mentor => mentor?.id !== undefined && mentor?.id !== null && typeof mentor.name === 'string' && mentor.name.trim())
      .map(mentor => ({ value: String(mentor.id), label: mentor.name.trim() })),
  };
};

export const loadFacultyGuides = async apiFetch =>
  mapFacultyGuideResponse(await apiFetch('/student/mentors/'));

export const getFacultyGuideEmptyMessage = ({ loading, error, department, mentors = [] }) => {
  if (loading) return 'Loading faculty guides…';
  if (error) return 'Faculty options are unavailable until the loading error is resolved.';
  if (!department?.id) return 'Your account has no department assignment. Contact an administrator.';
  if (mentors.length === 0) return 'No active faculty guides are assigned to your department.';
  return 'No matching faculty guides found.';
};
