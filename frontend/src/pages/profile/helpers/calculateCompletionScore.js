import { PROFILE_SIGNAL_FIELDS } from '../constants';

// Tính điểm hoàn thiện hồ sơ 0-100%
export function calculateCompletionScore(profile, documents) {
  const p = profile || {};
  const docList = Array.isArray(documents) ? documents : documents?.data;
  const docCount = Array.isArray(docList)
    ? docList.length
    : typeof documents === 'number'
      ? documents
      : 0;

  const filledCount = PROFILE_SIGNAL_FIELDS.filter(({ key }) => {
    const val = p[key];
    return val !== undefined && val !== null && String(val).trim() !== '';
  }).length;

  const docScore = docCount > 0 ? 1 : 0;
  const total = PROFILE_SIGNAL_FIELDS.length + 1;
  const percentage = Math.round(((filledCount + docScore) / total) * 100);

  const missingSignals = PROFILE_SIGNAL_FIELDS.filter(({ key }) => {
    const val = p[key];
    return val === undefined || val === null || String(val).trim() === '';
  });
  const missingLabels = missingSignals.map(f => f.label);
  if (docCount === 0) missingLabels.push('tài liệu hồ sơ');

  const res = new Number(percentage);
  res.score = filledCount + docScore;
  res.total = total;
  res.percentage = percentage;
  res.missingLabels = missingLabels;
  return res;
}
