// Trạng thái đơn ứng tuyển — dùng ở danh sách đơn và trang chi tiết đơn.

// Nhãn + màu từng trạng thái. Màu theo nghĩa: chờ = tím, đang xét = cam, đậu = xanh, trượt = đỏ.
export const STATUS_META = {
  draft: { label: 'Nháp', variant: 'neutral' },
  submitted: { label: 'Đã nộp', variant: 'brand' },
  under_review: { label: 'Đang xét duyệt', variant: 'soon' },
  interview: { label: 'Phỏng vấn', variant: 'brand' },
  accepted: { label: 'Được nhận', variant: 'open' },
  rejected: { label: 'Từ chối', variant: 'urgent' },
  withdrawn: { label: 'Đã rút', variant: 'neutral' },
};

// Đơn còn nháp hoặc đã kết thúc không thành mới được xóa (giống backend)
export const DELETABLE_STATUSES = ['draft', 'rejected', 'withdrawn'];

export function getChecklistProgress(checklist) {
  const items = Array.isArray(checklist) ? checklist : [];
  return { done: items.filter((item) => item.done).length, total: items.length };
}
