'use strict';

/**
 * Sổ đăng ký nguồn. Muốn tắt tạm một nguồn: xoá dòng của nó ở đây.
 * Muốn thêm nguồn mới: sao chép một folder nguồn, sửa config.js, rồi thêm một dòng vào mảng.
 */
const REGISTERED = [
  require('./scholars4dev'),
  require('./scholarshipsCorner'),
  require('./opportunitiesForYouth'),
  require('./scholarshipRegion'),
  require('./scholarshipRoar'),
];

/** Tên các nguồn đang bật, theo thứ tự ưu tiên. */
const sourceNames = () => REGISTERED.map((s) => s.config.name);

/**
 * Tạo các nguồn đã chọn, sắp theo ưu tiên (số nhỏ chạy trước).
 * @param {{ only?: string[], fetchImpl?: Function, now?: () => Date, delayMs?: number }} options
 * @returns {import('../types').Source[]}
 */
function createSources({ only = [], ...deps } = {}) {
  const unknown = only.filter((name) => !sourceNames().includes(name));
  if (unknown.length) throw new Error(`Không có nguồn: ${unknown.join(', ')}. Hiện có: ${sourceNames().join(', ')}`);
  return REGISTERED
    .filter((s) => only.length === 0 || only.includes(s.config.name))
    .map((s) => s.create(deps))
    .sort((a, b) => a.priority - b.priority);
}

module.exports = { createSources, sourceNames };
