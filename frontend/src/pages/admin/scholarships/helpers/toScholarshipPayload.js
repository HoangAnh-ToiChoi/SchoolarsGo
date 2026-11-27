// Bắt buộc ở server: để trống thì không gửi thay vì ghi chuỗi rỗng
const REQUIRED_FIELDS = ['title', 'provider', 'country', 'degree'];
// Cột số / ngày: xóa giá trị phải gửi null
const NULLABLE_FIELDS = ['amount', 'deadline'];

function toApiValue(key, value) {
  if (value === '') return NULLABLE_FIELDS.includes(key) ? null : '';
  return key === 'amount' ? Number(value) : value;
}

function isSent(key, value, initial) {
  if (!initial) return value !== '';
  if (value === '' && REQUIRED_FIELDS.includes(key)) return false;
  return String(value) !== String(initial[key] ?? '');
}

// Thêm mới gửi mọi ô đã điền. Sửa chỉ gửi trường đã đổi: trường admin không đụng tới giữ nguyên trong DB
export function toScholarshipPayload(form, { id, initial } = {}) {
  const changed = Object.entries(form).filter(([key, value]) => isSent(key, value, initial));
  const payload = Object.fromEntries(changed.map(([key, value]) => [key, toApiValue(key, value)]));
  return id ? { id, ...payload } : payload;
}
