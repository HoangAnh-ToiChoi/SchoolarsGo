// Hằng số và giới hạn miền giá trị cho hồ sơ cá nhân (khớp backend/src/constants/profile.js)
export const CURRENT_DEGREES = Object.freeze(['Bachelor', 'Master', 'PhD']);

export const CURRENT_DEGREE_OPTIONS = Object.freeze([
  { value: 'Bachelor', label: 'Cử nhân (Bachelor)' },
  { value: 'Master', label: 'Thạc sĩ (Master)' },
  { value: 'PhD', label: 'Tiến sĩ (PhD)' },
]);

export const NATIONALITY_SUGGESTIONS = Object.freeze([
  'VN', 'JP', 'KR', 'US', 'GB', 'AU', 'DE', 'FR', 'SG', 'CA',
]);

export const NATIONALITY_PATTERN = /^[A-Za-z]{2}$/;

export const CERTIFICATE_TYPE_SUGGESTIONS = Object.freeze([
  'IELTS', 'TOEFL', 'CEFR', 'JLPT', 'TOPIK', 'HSK', 'SAT',
]);

export const PROFILE_LIMITS = Object.freeze({
  BIRTH_YEAR_MIN: 1940,
  MAJOR_MAX: 100,
  EXPERIENCE_MAX: 2000,
  MAX_CERTIFICATES: 10,
  CERT_SCORE_MAX: 120,
  IELTS_MAX: 9,
  CERT_TYPE_MAX: 20,
  CERT_LEVEL_MAX: 20,
  GPA_MIN: 0,
  GPA_MAX: 4,
  ENGLISH_LEVEL_MAX: 50,
  TARGET_COUNTRY_MAX: 100,
  TARGET_MAJOR_MAX: 255,
  TARGET_INTAKE_MAX: 50,
  BIO_MAX: 2000,
});

// Các trường tùy chọn cần bỏ qua khi giá trị rỗng "" (tránh lỗi coerce/enum ở Zod backend)
export const OMIT_EMPTY_KEYS = Object.freeze([
  'gpa',
  'birth_year',
  'nationality',
  'current_degree',
  'target_degree',
]);
