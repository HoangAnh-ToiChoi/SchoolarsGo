// Validate điểm GPA thang 4.0
export function validateGPA(value) {
  if (value === undefined || value === null || value === '') return '';
  const num = parseFloat(value);
  if (isNaN(num)) return 'GPA phải là số';
  if (num < 0 || num > 4) return 'GPA phải từ 0 đến 4.0';
  return '';
}
