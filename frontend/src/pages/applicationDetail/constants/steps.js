// Các chặng của một đơn, theo đúng luồng chuyển trạng thái ở backend
// (nháp → đã nộp → đang xét → phỏng vấn → kết quả). Kết quả gộp "được nhận" và "từ chối".
export const STEPS = [
  { key: 'draft', label: 'Chuẩn bị' },
  { key: 'submitted', label: 'Đã nộp' },
  { key: 'under_review', label: 'Xét duyệt' },
  { key: 'interview', label: 'Phỏng vấn' },
  { key: 'result', label: 'Kết quả' },
];
