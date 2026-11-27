import { COVERAGE_OPTIONS } from '~/pages/admin/scholarships/constants';

// Học bổng kéo về có hình thức là chữ tự do: thêm vào danh sách để admin thấy đúng giá trị đang lưu
export function getCoverageOptions(current) {
  const isKnown = !current || COVERAGE_OPTIONS.some((option) => option.value === current);
  return isKnown ? COVERAGE_OPTIONS : [...COVERAGE_OPTIONS, { value: current, label: current }];
}
