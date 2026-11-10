// Tính toán chỉ dùng trong layout người dùng

// "Trần Hoàng Anh" → "TA" để hiện trong avatar
export function getInitials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const letters = parts.length > 1 ? parts[0][0] + parts.at(-1)[0] : parts[0][0];
  return letters.toUpperCase();
}
