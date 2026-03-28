// Các constants dùng chung trong app
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Pagination
export const PAGE_SIZE = 20;
export const MAX_LIMIT = 50;

// Document types
export const DOCUMENT_TYPES = [
  { value: 'cv', label: 'Curriculum Vitae (CV)' },
  { value: 'sop', label: 'Statement of Purpose (SOP)' },
  { value: 'transcript', label: 'Bảng điểm' },
  { value: 'recommendation_letter', label: 'Thư giới thiệu' },
  { value: 'other', label: 'Khác' },
];

// Degrees
export const DEGREES = [
  { value: 'Bachelor', label: 'Cử nhân (Bachelor)' },
  { value: 'Master', label: 'Thạc sĩ (Master)' },
  { value: 'PhD', label: 'Tiến sĩ (PhD)' },
  { value: 'Any', label: 'Tất cả' },
];

// Languages
export const LANGUAGES = [
  { value: 'English', label: 'Tiếng Anh' },
  { value: 'Vietnamese', label: 'Tiếng Việt' },
  { value: 'Korean', label: 'Tiếng Hàn' },
  { value: 'Japanese', label: 'Tiếng Nhật' },
  { value: 'Chinese', label: 'Tiếng Trung' },
  { value: 'German', label: 'Tiếng Đức' },
  { value: 'French', label: 'Tiếng Pháp' },
  { value: 'Spanish', label: 'Tiếng Tây Ban Nha' },
];

// Coverage types
export const COVERAGES = [
  { value: 'Full', label: 'Toàn phần (Full)' },
  { value: 'Partial', label: 'Bán phần (Partial)' },
  { value: 'Tuition', label: 'Học phí (Tuition)' },
  { value: 'Stipend', label: 'Sinh hoạt phí (Stipend)' },
  { value: 'Accommodation', label: 'Chỗ ở (Accommodation)' },
];

// Application statuses
export const APPLICATION_STATUSES = [
  { value: 'draft', label: 'Nháp' },
  { value: 'submitted', label: 'Đã nộp' },
  { value: 'under_review', label: 'Đang xét duyệt' },
  { value: 'interview', label: 'Phỏng vấn' },
  { value: 'accepted', label: 'Được nhận' },
  { value: 'rejected', label: 'Từ chối' },
  { value: 'withdrawn', label: 'Đã rút' },
];

// Common majors
export const COMMON_MAJORS = [
  'Computer Science',
  'Data Science',
  'Artificial Intelligence',
  'Business Administration',
  'Economics',
  'Engineering',
  'Medicine',
  'Law',
  'Psychology',
  'International Relations',
  'Environmental Science',
  'Finance',
  'Marketing',
  'Architecture',
  'Biotechnology',
];
