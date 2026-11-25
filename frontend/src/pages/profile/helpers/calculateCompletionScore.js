import { PROFILE_COMPLETION_FIELDS } from '../constants/profileCompletionFields.js';

function isFieldFilled(val) {
  if (Array.isArray(val)) {
    // Chứng chỉ chỉ tính đã điền khi có ít nhất 1 mục có loại hợp lệ (không tính dòng trống vừa thêm)
    return val.some((item) =>
      typeof item === 'string'
        ? item.trim() !== ''
        : Boolean(item && String(item.type ?? '').trim() !== ''),
    );
  }
  return val !== undefined && val !== null && String(val).trim() !== '';
}

// Tính điểm hoàn thiện hồ sơ 0-100%
export function calculateCompletionScore(profile, documents) {
  const p = profile || {};
  const docList = Array.isArray(documents) ? documents : documents?.data;
  let docCount = 0;
  if (Array.isArray(docList)) {
    docCount = docList.length;
  } else if (typeof documents === 'number') {
    docCount = documents;
  }

  const filledCount = PROFILE_COMPLETION_FIELDS.filter(({ key }) => isFieldFilled(p[key])).length;

  const docScore = docCount > 0 ? 1 : 0;
  const total = PROFILE_COMPLETION_FIELDS.length + 1;
  const percentage = Math.round(((filledCount + docScore) / total) * 100);

  const missingSignals = PROFILE_COMPLETION_FIELDS.filter(({ key }) => !isFieldFilled(p[key]));
  const missingLabels = missingSignals.map((f) => f.label);
  if (docCount === 0) missingLabels.push('tài liệu hồ sơ');

  const res = new Number(percentage);
  res.score = filledCount + docScore;
  res.total = total;
  res.percentage = percentage;
  res.missingLabels = missingLabels;
  return res;
}
