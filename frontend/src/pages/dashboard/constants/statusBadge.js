// Nhãn + màu Badge (components/legacy) của trạng thái đơn trên dashboard cũ.
// Chữ khác utils/application.js STATUS_META ("Được chấp nhận", "Bị từ chối"): giữ nguyên tới khi làm lại trang.
export const STATUS_BADGE_COLORS = {
  draft: 'gray',
  submitted: 'blue',
  under_review: 'amber',
  interview: 'purple',
  accepted: 'green',
  rejected: 'rose',
  withdrawn: 'gray',
};

export const STATUS_BADGE_LABELS = {
  draft: 'Nháp',
  submitted: 'Đã nộp',
  under_review: 'Đang xét duyệt',
  interview: 'Phỏng vấn',
  accepted: 'Được chấp nhận',
  rejected: 'Bị từ chối',
  withdrawn: 'Đã rút',
};
