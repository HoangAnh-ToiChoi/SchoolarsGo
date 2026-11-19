// Các chặng của một đơn, theo đúng luồng chuyển trạng thái ở backend
// (nháp → đã nộp → đang xét → phỏng vấn → kết quả). Kết quả gộp "được nhận" và "từ chối".
export const STEPS = [
  { key: 'draft', label: 'Chuẩn bị' },
  { key: 'submitted', label: 'Đã nộp' },
  { key: 'under_review', label: 'Xét duyệt' },
  { key: 'interview', label: 'Phỏng vấn' },
  { key: 'result', label: 'Kết quả' },
];

export function getStepIndex(status) {
  if (status === 'accepted' || status === 'rejected') return STEPS.length - 1;
  return STEPS.findIndex((step) => step.key === status);
}

// Việc tiếp theo cho từng trạng thái: một nút chính + các lựa chọn phụ trong menu "⋯".
// Sinh viên tự cập nhật vì hệ thống không nhận kết quả trực tiếp từ nhà tài trợ.
export const NEXT_ACTIONS = {
  draft: {
    primary: { status: 'submitted', label: 'Đánh dấu đã nộp' },
    more: [],
  },
  submitted: {
    primary: { status: 'under_review', label: 'Đánh dấu đang xét duyệt' },
    more: [{ status: 'rejected', label: 'Bị từ chối' }],
  },
  under_review: {
    primary: { status: 'interview', label: 'Đánh dấu có phỏng vấn' },
    more: [{ status: 'rejected', label: 'Bị từ chối' }],
  },
  interview: {
    primary: { status: 'accepted', label: 'Đánh dấu được nhận' },
    more: [{ status: 'rejected', label: 'Bị từ chối' }],
  },
};

export const CAN_WITHDRAW = ['draft', 'submitted', 'under_review', 'interview'];

// Checklist lưu dạng JSONB; dữ liệu cũ có thể là chuỗi JSON
export function parseChecklist(raw) {
  if (Array.isArray(raw)) return raw;
  if (typeof raw !== 'string') return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Đoán loại tài liệu (cv, transcript…) từ tên mục checklist để lưu đúng nhóm trong hồ sơ
const DOC_TYPE_PATTERNS = [
  ['cv', /^\s*cv\s*$|curriculum/i],
  ['sop', /^\s*sop\s*$|statement|bài\s*luận|essay/i],
  ['transcript', /bảng\s*điểm|transcript/i],
  ['recommendation_letter', /thư\s*giới\s*thiệu|recommendation/i],
];

export function guessDocType(itemName) {
  return DOC_TYPE_PATTERNS.find(([, pattern]) => pattern.test(itemName))?.[0] ?? 'other';
}

export const ACCEPTED_FILES = '.pdf,.doc,.docx,.txt';
export const MAX_FILE_MB = 5;

export function validateFile(file) {
  const ext = `.${file.name.split('.').pop().toLowerCase()}`;
  if (!ACCEPTED_FILES.split(',').includes(ext)) return 'Chỉ nhận tệp PDF, DOC, DOCX hoặc TXT';
  if (file.size > MAX_FILE_MB * 1024 * 1024) return `Tệp lớn hơn ${MAX_FILE_MB}MB`;
  return null;
}

export function formatFileSize(bytes) {
  if (!bytes) return '';
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
