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
