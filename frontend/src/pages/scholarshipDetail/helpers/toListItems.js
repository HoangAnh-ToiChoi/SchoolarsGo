import { BULLET } from '../constants';

// DB lưu quyền lợi/điều kiện/hồ sơ dạng text, mỗi ý một dòng. Tách thành danh sách để hiển thị.
// Phòng khi API trả mảng thì dùng luôn.
export function toListItems(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value !== 'string') return [];
  return value
    .split(/\r?\n/)
    .map((line) => line.replace(BULLET, '').trim())
    .filter(Boolean);
}
