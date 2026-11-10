// Nhãn + màu từng trạng thái đơn. Màu theo nghĩa: chờ = tím, đang xét = cam, đậu = xanh, trượt = đỏ.
export const STATUS_META = {
  draft: { label: 'Nháp', variant: 'neutral' },
  submitted: { label: 'Đã nộp', variant: 'brand' },
  under_review: { label: 'Đang xét duyệt', variant: 'soon' },
  interview: { label: 'Phỏng vấn', variant: 'brand' },
  accepted: { label: 'Được nhận', variant: 'open' },
  rejected: { label: 'Từ chối', variant: 'urgent' },
  withdrawn: { label: 'Đã rút', variant: 'neutral' },
};

// Gom 7 trạng thái thành 3 chặng để sinh viên biết đơn nào còn phải làm
export const STAGES = [
  { value: 'all', label: 'Tất cả', statuses: null },
  { value: 'preparing', label: 'Đang chuẩn bị', statuses: ['draft'] },
  { value: 'waiting', label: 'Chờ kết quả', statuses: ['submitted', 'under_review', 'interview'] },
  { value: 'done', label: 'Đã có kết quả', statuses: ['accepted', 'rejected', 'withdrawn'] },
];

export const inStage = (stage, application) => !stage.statuses || stage.statuses.includes(application.status);

export function getChecklistProgress(checklist) {
  const items = Array.isArray(checklist) ? checklist : [];
  return { done: items.filter((item) => item.done).length, total: items.length };
}
