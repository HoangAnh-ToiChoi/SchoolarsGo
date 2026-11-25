import {
  CURRENT_DEGREES,
  NATIONALITY_PATTERN,
  PROFILE_LIMITS,
} from '../constants/profileLimits.js';
import { validateGPA } from './validateGPA.js';

const hasValue = (val) => val !== undefined && val !== null && String(val).trim() !== '';

// Kiểm tra năm sinh: số nguyên trong [1940, năm hiện tại]
export function validateBirthYear(value, currentYear = new Date().getFullYear()) {
  if (!hasValue(value)) return '';
  const num = Number(String(value).trim());
  if (!Number.isInteger(num)) return 'Năm sinh phải là số nguyên';
  if (num < PROFILE_LIMITS.BIRTH_YEAR_MIN || num > currentYear) {
    return `Năm sinh phải từ ${PROFILE_LIMITS.BIRTH_YEAR_MIN} đến ${currentYear}`;
  }
  return '';
}

// Kiểm tra quốc tịch: đúng 2 chữ cái ASCII (VD: VN, JP)
export function validateNationality(value) {
  if (!hasValue(value)) return '';
  const trimmed = String(value).trim();
  if (!NATIONALITY_PATTERN.test(trimmed)) {
    return 'Quốc tịch phải gồm đúng 2 chữ cái (VD: VN, JP)';
  }
  return '';
}

// Kiểm tra độ dài tối đa của chuỗi
export function validateMaxLength(value, max, label) {
  if (value === undefined || value === null || value === '') return '';
  if (String(value).length > max) {
    return `${label} tối đa ${max} ký tự`;
  }
  return '';
}

// Kiểm tra bậc học hiện tại thuộc ['Bachelor', 'Master', 'PhD']
export function validateCurrentDegree(value) {
  if (!hasValue(value)) return '';
  if (!CURRENT_DEGREES.includes(value)) {
    return 'Bậc học hiện tại không hợp lệ';
  }
  return '';
}

// Kiểm tra một dòng chứng chỉ; requirePresence = false khi mới rời ô loại để người dùng nhập tiếp điểm/mức
export function validateSingleCertificate(cert, { requirePresence = true } = {}) {
  const item = cert || {};
  const err = {};
  const type = String(item.type ?? '').trim();
  const level = String(item.level ?? '').trim();
  const hasScore = hasValue(item.score);
  const hasLevel = level !== '';

  if (!type) {
    err.type = 'Vui lòng nhập loại chứng chỉ';
  } else if (type.length > PROFILE_LIMITS.CERT_TYPE_MAX) {
    err.type = `Loại chứng chỉ tối đa ${PROFILE_LIMITS.CERT_TYPE_MAX} ký tự`;
  }

  const isIelts = type.toLowerCase() === 'ielts';

  if (hasScore) {
    const numScore = Number(String(item.score).trim());
    if (!Number.isFinite(numScore)) {
      err.score = 'Điểm chứng chỉ phải là số';
    } else if (numScore < 0) {
      err.score = 'Điểm chứng chỉ không được âm';
    } else if (isIelts && numScore > PROFILE_LIMITS.IELTS_MAX) {
      err.score = `Điểm IELTS phải từ 0 đến ${PROFILE_LIMITS.IELTS_MAX}`;
    } else if (!isIelts && numScore > PROFILE_LIMITS.CERT_SCORE_MAX) {
      err.score = `Điểm chứng chỉ tối đa ${PROFILE_LIMITS.CERT_SCORE_MAX}`;
    }
  }

  if (hasLevel && level.length > PROFILE_LIMITS.CERT_LEVEL_MAX) {
    err.level = `Mức chứng chỉ tối đa ${PROFILE_LIMITS.CERT_LEVEL_MAX} ký tự`;
  }

  if (requirePresence) {
    if (isIelts && !hasScore && !err.score) {
      err.score = `IELTS bắt buộc có điểm từ 0 đến ${PROFILE_LIMITS.IELTS_MAX}`;
    } else if (!isIelts && type && !hasScore && !hasLevel) {
      err.row = 'Chứng chỉ cần có điểm hoặc mức';
    }
  }

  return err;
}

// Kiểm tra toàn bộ danh sách chứng chỉ (tối đa 10 mục)
export function validateCertificates(certificates) {
  if (certificates === undefined || certificates === null) {
    return { listError: '', itemErrors: [], hasError: false };
  }
  if (!Array.isArray(certificates)) {
    return { listError: 'Danh sách chứng chỉ không hợp lệ', itemErrors: [], hasError: true };
  }
  const listError =
    certificates.length > PROFILE_LIMITS.MAX_CERTIFICATES
      ? `Tối đa ${PROFILE_LIMITS.MAX_CERTIFICATES} chứng chỉ`
      : '';
  const itemErrors = certificates.map((cert) => validateSingleCertificate(cert));
  const hasItemError = itemErrors.some((e) => Object.keys(e).length > 0);
  return { listError, itemErrors, hasError: Boolean(listError) || hasItemError };
}

// Validate từng trường đơn lẻ (dùng cho onBlur và tổng hợp form)
export function validateSingleField(key, value, currentYear = new Date().getFullYear()) {
  switch (key) {
    case 'gpa':
      return validateGPA(value);
    case 'current_degree':
      return validateCurrentDegree(value);
    case 'major':
      return validateMaxLength(value, PROFILE_LIMITS.MAJOR_MAX, 'Ngành học hiện tại');
    case 'nationality':
      return validateNationality(value);
    case 'birth_year':
      return validateBirthYear(value, currentYear);
    case 'experience':
      return validateMaxLength(value, PROFILE_LIMITS.EXPERIENCE_MAX, 'Kinh nghiệm');
    case 'english_level':
      return validateMaxLength(value, PROFILE_LIMITS.ENGLISH_LEVEL_MAX, 'Trình độ tiếng Anh');
    case 'target_country':
      return validateMaxLength(value, PROFILE_LIMITS.TARGET_COUNTRY_MAX, 'Quốc gia muốn đến');
    case 'target_major':
      return validateMaxLength(value, PROFILE_LIMITS.TARGET_MAJOR_MAX, 'Ngành học mong muốn');
    case 'target_intake':
      return validateMaxLength(value, PROFILE_LIMITS.TARGET_INTAKE_MAX, 'Kỳ nhập học dự kiến');
    case 'bio':
      return validateMaxLength(value, PROFILE_LIMITS.BIO_MAX, 'Giới thiệu bản thân');
    default:
      return '';
  }
}

const VALIDATED_FIELD_KEYS = [
  'gpa',
  'current_degree',
  'major',
  'nationality',
  'birth_year',
  'experience',
  'english_level',
  'target_country',
  'target_major',
  'target_intake',
  'bio',
];

// Validate toàn bộ form hồ sơ trước khi gửi PUT /api/profile
export function validateProfileForm(values = {}, currentYear = new Date().getFullYear()) {
  const input = values || {};
  const errors = {};

  for (const key of VALIDATED_FIELD_KEYS) {
    const msg = validateSingleField(key, input[key], currentYear);
    if (msg) errors[key] = msg;
  }

  const certResult = validateCertificates(input.certificates);
  if (certResult.hasError) {
    errors.certificates = {
      listError: certResult.listError,
      itemErrors: certResult.itemErrors,
    };
  }

  return { errors, hasError: Object.keys(errors).length > 0 };
}

// Cập nhật lỗi cho một dòng chứng chỉ khi onBlur mà không ghi đè lỗi các dòng khác
export function mergeCertificateRowError(prevCertError, rowIndex, rowError, totalCount) {
  const prevItems = Array.isArray(prevCertError?.itemErrors) ? [...prevCertError.itemErrors] : [];
  prevItems[rowIndex] = rowError;
  const listError =
    totalCount > PROFILE_LIMITS.MAX_CERTIFICATES
      ? `Tối đa ${PROFILE_LIMITS.MAX_CERTIFICATES} chứng chỉ`
      : '';
  const hasAnyItemError = prevItems.some((item) => item && Object.keys(item).length > 0);
  if (!listError && !hasAnyItemError) return null;
  return { listError, itemErrors: prevItems };
}

export const validateProfileFields = validateProfileForm;
