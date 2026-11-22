// Hằng số của hồ sơ người dùng (profile.service, profile.validation, profile.model)

const PROFILE_VALID_DEGREES = Object.freeze(['Bachelor', 'Master', 'PhD', 'Any']);
const PROFILE_ENGLISH_LEVEL_MAX = 50;
const PROFILE_DEFAULT_GPA_SCALE = 4.0;

// Trường mới của Migration 008. Giới hạn khớp cột và ràng buộc trong DB
const PROFILE_CURRENT_DEGREES = Object.freeze(['Bachelor', 'Master', 'PhD']);
const PROFILE_MAJOR_MAX = 100;
const PROFILE_EXPERIENCE_MAX = 2000;
const PROFILE_BIRTH_YEAR_MIN = 1940;
const PROFILE_BIRTH_YEAR_MAX = new Date().getFullYear();
const PROFILE_NATIONALITY_PATTERN = /^[A-Za-z]{2}$/;
const PROFILE_MAX_CERTIFICATES = 10;
const PROFILE_CERTIFICATE_TYPE_MAX = 20;
const PROFILE_CERTIFICATE_LEVEL_MAX = 20;
const PROFILE_CERTIFICATE_SCORE_MAX = 120;
const PROFILE_IELTS_NAME = 'ielts';
const PROFILE_IELTS_MAX_SCORE = 9;

// Cột cho phép ghi qua PUT /profile; trường khác bị bỏ
const PROFILE_UPDATABLE_FIELDS = Object.freeze([
  'bio', 'gpa', 'gpa_scale', 'english_level', 'target_country', 'target_major', 'target_degree', 'target_intake',
  'current_degree', 'major', 'nationality', 'birth_year', 'experience', 'certificates',
]);

export {
  PROFILE_VALID_DEGREES, PROFILE_ENGLISH_LEVEL_MAX, PROFILE_DEFAULT_GPA_SCALE,
  PROFILE_CURRENT_DEGREES, PROFILE_MAJOR_MAX, PROFILE_EXPERIENCE_MAX,
  PROFILE_BIRTH_YEAR_MIN, PROFILE_BIRTH_YEAR_MAX, PROFILE_NATIONALITY_PATTERN,
  PROFILE_MAX_CERTIFICATES, PROFILE_CERTIFICATE_TYPE_MAX, PROFILE_CERTIFICATE_LEVEL_MAX, PROFILE_CERTIFICATE_SCORE_MAX,
  PROFILE_IELTS_NAME, PROFILE_IELTS_MAX_SCORE, PROFILE_UPDATABLE_FIELDS,
};
