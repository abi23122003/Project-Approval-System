export const toAcademicTermForm = term => ({
  id: term.id,
  termName: term.term_name,
  startDate: term.start_date,
  endDate: term.end_date,
  isActive: term.is_active,
});

export const toAcademicTermPayload = config => ({
  term_name: config.termName.trim(),
  start_date: config.startDate,
  end_date: config.endDate,
  is_active: Boolean(config.isActive),
});

export const fetchAcademicTerms = async apiFetch => {
  const terms = await apiFetch('/admin/academic-terms/');
  if (!Array.isArray(terms)) throw new Error('The academic terms response was invalid.');
  return terms.map(toAcademicTermForm);
};

export const saveAcademicTerm = async (apiFetch, config) => {
  const path = config.id ? `/admin/academic-terms/${config.id}/` : '/admin/academic-terms/';
  const response = await apiFetch(path, {
    method: config.id ? 'PATCH' : 'POST',
    body: JSON.stringify(toAcademicTermPayload(config)),
  });
  if (!response?.id) throw new Error('The server did not confirm the academic term save.');
  return toAcademicTermForm(response);
};
