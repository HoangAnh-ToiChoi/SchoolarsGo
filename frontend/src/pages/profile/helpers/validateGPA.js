// Validate điểm GPA thang 4.0
export function validateGPA(value) {
  if (value === undefined || value === null || String(value).trim() === '') return '';
  const num = Number(String(value).trim());
  if (!Number.isFinite(num)) return 'GPA phải là số';
  if (num < 0 || num > 4) return 'GPA phải từ 0 đến 4.0';
  return '';
}
