export const GRADE_TYPES = ['percentage', 'points', 'letter'];

const defaultBands = [
  [0, 60, 'F'],
  [60, 70, 'D'],
  [70, 80, 'C'],
  [80, 90, 'B'],
  [90, 100, 'A'],
];

const fixed = value => Number(value).toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');

export const defaultGradingCriteria = (gradeType = 'percentage', maximumPoints = 100) => {
  const maximum = gradeType === 'points' ? Number(maximumPoints) : 100;
  if (!Number.isFinite(maximum) || maximum <= 0) return [];
  return defaultBands.map(([minimum, maximumPercent, grade]) => ({
    min_value: fixed(maximum * minimum / 100),
    max_value: fixed(maximum * maximumPercent / 100),
    grade,
  }));
};

export const createDefaultGradingScale = () => ({
  scaleName: '',
  maxPoints: '100',
  gradeType: 'percentage',
  criteria: defaultGradingCriteria('percentage'),
});

export const toGradingScaleForm = scale => ({
  id: scale.id,
  scaleName: scale.scale_name,
  maxPoints: String(scale.maximum_points),
  gradeType: scale.grade_type,
  criteria: scale.criteria.map(item => ({ ...item, min_value: String(item.min_value), max_value: String(item.max_value) })),
});

export const toGradingScalePayload = config => ({
  scale_name: config.scaleName.trim(),
  maximum_points: config.maxPoints,
  grade_type: config.gradeType,
  criteria: config.criteria.map(item => ({
    min_value: item.min_value,
    max_value: item.max_value,
    grade: item.grade.trim(),
  })),
});

export const validateGradingScale = (config = {}) => {
  const errors = {};
  const name = typeof config.scaleName === 'string' ? config.scaleName.trim() : '';
  const maximum = Number(config.maxPoints);
  const gradeType = config.gradeType;
  const criteria = Array.isArray(config.criteria) ? config.criteria : [];
  if (!name) errors.scaleName = 'Scale name is required.';
  if (config.maxPoints === '' || !Number.isFinite(maximum) || maximum <= 0) errors.maxPoints = 'Maximum points must be greater than zero.';
  if (!GRADE_TYPES.includes(gradeType)) errors.gradeType = 'Select a supported grade type.';
  if (!criteria.length) errors.criteria = 'Add at least one grading criterion.';
  const upperBound = gradeType === 'points' ? maximum : 100;
  const ranges = [];
  criteria.forEach((item, index) => {
    const minimum = Number(item?.min_value);
    const max = Number(item?.max_value);
    if (item?.min_value === '' || item?.min_value == null || item?.max_value === '' || item?.max_value == null ||
        !Number.isFinite(minimum) || !Number.isFinite(max) || max <= minimum || !String(item?.grade || '').trim()) {
      errors.criteria = `Criterion ${index + 1} needs a valid increasing range and grade.`;
      return;
    }
    ranges.push([minimum, max]);
  });
  if (ranges.length === criteria.length && ranges.length) {
    if (ranges[0][0] !== 0) errors.criteria = 'Criteria must start at 0.';
    for (let index = 0; index < ranges.length; index += 1) {
      if (ranges[index][1] > upperBound) errors.criteria = `Criteria cannot exceed ${upperBound}.`;
      if (index && ranges[index][0] !== ranges[index - 1][1]) errors.criteria = 'Criteria must be ordered, contiguous, and non-overlapping.';
    }
    if (ranges[ranges.length - 1][1] !== upperBound) errors.criteria = `Criteria must cover the full range from 0 to ${upperBound}.`;
  }
  return errors;
};

export const fetchGradingScales = async apiFetch => {
  const scales = await apiFetch('/admin/grading-scales/');
  if (!Array.isArray(scales)) throw new Error('The grading scales response was invalid.');
  return scales.map(toGradingScaleForm);
};

export const saveGradingScale = async (apiFetch, config) => {
  const path = config.id ? `/admin/grading-scales/${config.id}/` : '/admin/grading-scales/';
  const response = await apiFetch(path, {
    method: config.id ? 'PATCH' : 'POST',
    body: JSON.stringify(toGradingScalePayload(config)),
  });
  if (!response?.id) throw new Error('The server did not confirm the grading scale save.');
  return toGradingScaleForm(response);
};
