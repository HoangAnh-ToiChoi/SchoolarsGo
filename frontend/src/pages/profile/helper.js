import { DEGREES, COMMON_MAJORS } from '~/utils/constants';

// 7 trường tín hiệu học thuật cốt lõi cho AI Recommend (OCP Schema)
export const PROFILE_SIGNAL_FIELDS = [
  { key: 'gpa', label: 'GPA (thang 4.0)', type: 'number', placeholder: '3.5', step: '0.01', min: '0', max: '4', colSpan: 1 },
  { key: 'english_level', label: 'Trình độ tiếng Anh', type: 'text', placeholder: 'IELTS 7.0', colSpan: 1 },
  { key: 'target_country', label: 'Quốc gia muốn đến', type: 'text', placeholder: 'UK, USA, Australia...', colSpan: 1 },
  { key: 'target_degree', label: 'Bậc học mong muốn', type: 'select', placeholder: 'Chọn bậc học', options: DEGREES, colSpan: 1 },
  { key: 'target_intake', label: 'Kỳ nhập học dự kiến', type: 'text', placeholder: 'Fall 2027, Spring 2028...', colSpan: 1 },
  { key: 'target_major', label: 'Ngành học mong muốn', type: 'text', placeholder: 'Computer Science', datalist: COMMON_MAJORS, colSpan: 2 },
  { key: 'bio', label: 'Giới thiệu bản thân', type: 'textarea', placeholder: 'Viết vài dòng về bản thân, mục tiêu du học, thế mạnh học tập...', rows: 4, colSpan: 2 },
];

// Slot cấu hình 4 trường tương lai (OCP Extension Slots)
export const FUTURE_SIGNAL_FIELDS = [
  { key: 'experience', label: 'Kinh nghiệm làm việc', type: 'text', placeholder: 'VD: 2 năm làm việc...', isFuture: true, colSpan: 1 },
  { key: 'nationality', label: 'Quốc tịch', type: 'text', placeholder: 'VD: Việt Nam', isFuture: true, colSpan: 1 },
  { key: 'birth_year', label: 'Năm sinh', type: 'number', placeholder: 'VD: 2002', isFuture: true, colSpan: 1 },
  { key: 'certifications', label: 'Chứng chỉ khác', type: 'text', placeholder: 'VD: SAT 1450, GRE...', isFuture: true, colSpan: 1 },
];

// Cấu hình slot nút Điền nhanh từ CV
export const FAST_FILL_SLOT = {
  key: 'fast_fill_cv',
  label: 'Điền nhanh từ CV',
  badge: 'Sắp ra mắt',
  isFuture: true,
};

// Validate điểm GPA thang 4.0
export function validateGPA(value) {
  if (value === undefined || value === null || value === '') return '';
  const num = parseFloat(value);
  if (isNaN(num)) return 'GPA phải là số';
  if (num < 0 || num > 4) return 'GPA phải từ 0 đến 4.0';
  return '';
}

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

// Tự động phân loại tài liệu (pdf, doc, docx, txt) thành cv, sop hoặc other
export function autoClassifyDocument(file) {
  const name = typeof file === 'string' ? file : file?.name || '';
  const fileExt = name.split('.').pop().toLowerCase();
  const fileName = name.toLowerCase();

  if (fileExt === 'pdf') {
    if (fileName.includes('cv') || fileName.includes('resume')) return 'cv';
    if (fileName.includes('sop') || fileName.includes('statement')) return 'sop';
    return 'cv';
  }
  if (fileExt === 'doc' || fileExt === 'docx') return 'cv';
  if (fileExt === 'txt') return 'sop';
  return 'other';
}

// Kiểm tra định dạng và kích thước tệp upload (tối đa 10MB)
export function validateDocumentFile(file, options = {}) {
  const {
    maxSize = 10 * 1024 * 1024,
    allowedExtensions = ['.pdf', '.doc', '.docx', '.txt'],
  } = options;

  if (!file) return { valid: false, error: 'Vui lòng chọn một tệp.' };
  if (file.size > maxSize) return { valid: false, error: 'Dung lượng tệp vượt quá 10MB.' };
  const ext = '.' + (file.name || '').split('.').pop().toLowerCase();
  if (!allowedExtensions.includes(ext)) {
    return {
      valid: false,
      error: 'Định dạng tệp không được hỗ trợ. Chỉ chấp nhận .pdf, .doc, .docx, .txt.',
    };
  }
  return { valid: true, error: null };
}

// Định dạng kích thước tệp ra KB / MB
export function formatFileSize(bytes) {
  if (typeof bytes !== 'number' || isNaN(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}
