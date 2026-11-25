import { OMIT_EMPTY_KEYS } from '../constants/profileLimits.js';

const NUMERIC_KEYS = new Set(['gpa', 'birth_year']);
const isBlank = (val) => val === undefined || val === null || String(val).trim() === '';

function normalizeCertificate(cert) {
  const item = { type: String(cert?.type ?? '').trim() };
  if (!isBlank(cert?.score)) {
    item.score = Number(String(cert.score).trim());
  }
  if (!isBlank(cert?.level)) {
    item.level = String(cert.level).trim();
  }
  return item;
}

// Chuẩn hóa payload trước khi gửi PUT /api/profile:
// bỏ qua "" ở các trường tùy chọn mà Zod không cho rỗng, ép Number và chuẩn hóa chữ hoa nationality
export function buildProfilePayload(form = {}) {
  const source = form || {};
  const payload = {};

  for (const [key, val] of Object.entries(source)) {
    if (val === undefined || val === null) continue;
    if (OMIT_EMPTY_KEYS.includes(key) && isBlank(val)) continue;

    if (NUMERIC_KEYS.has(key)) {
      payload[key] = Number(String(val).trim());
    } else if (key === 'nationality') {
      payload[key] = String(val).trim().toUpperCase();
    } else if (key === 'certificates') {
      if (Array.isArray(val)) {
        payload.certificates = val.map(normalizeCertificate);
      }
    } else if (typeof val === 'string') {
      payload[key] = val.trim();
    } else {
      payload[key] = val;
    }
  }

  return payload;
}
