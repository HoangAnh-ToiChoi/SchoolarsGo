import { COVERAGES, DEGREES, LANGUAGES } from '~/utils/constants';
import { COUNTRY_LABELS, labelOf } from '~/utils/scholarship';

// Danh sách 8 bộ lọc. Thêm/bớt bộ lọc chỉ cần sửa mảng này.
// options: 'countries' = lấy từ API; mảng = danh sách cố định
export const FILTER_FIELDS = [
  { key: 'country', label: 'Quốc gia', type: 'select', options: 'countries' },
  { key: 'degree', label: 'Bậc học', type: 'select', options: DEGREES },
  { key: 'language', label: 'Ngôn ngữ', type: 'select', options: LANGUAGES },
  { key: 'coverage', label: 'Mức tài trợ', type: 'select', options: COVERAGES },
  { key: 'field', label: 'Ngành học', type: 'text', placeholder: 'VD: Khoa học dữ liệu' },
  { key: 'min_gpa', label: 'GPA tối thiểu', type: 'number', placeholder: 'VD: 3.0', min: 0, max: 4, step: 0.1 },
  { key: 'min_ielts', label: 'IELTS tối thiểu', type: 'number', placeholder: 'VD: 6.5', min: 0, max: 9, step: 0.5 },
  { key: 'amount_min', label: 'Số tiền tối thiểu (USD)', type: 'number', placeholder: 'VD: 10000', min: 0, step: 500 },
];

// Nhãn hiển thị trên các nhãn bộ lọc đang bật
export function getFilterLabel(key, value) {
  if (key === 'search') return `Từ khóa: ${value}`;
  const field = FILTER_FIELDS.find((f) => f.key === key);
  const option = Array.isArray(field?.options) ? field.options.find((o) => o.value === value) : null;
  const shown = option?.label ?? (key === 'country' ? labelOf(COUNTRY_LABELS, value) : value);
  if (key === 'min_gpa') return `GPA từ ${shown}`;
  if (key === 'min_ielts') return `IELTS từ ${shown}`;
  if (key === 'amount_min') return `Từ ${Number(shown).toLocaleString('vi-VN')} USD`;
  return `${field?.label ?? key}: ${shown}`;
}
