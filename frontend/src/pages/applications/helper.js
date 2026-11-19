// Gom 7 trạng thái thành 3 chặng để sinh viên biết đơn nào còn phải làm
export const STAGES = [
  { value: 'all', label: 'Tất cả', statuses: null },
  { value: 'preparing', label: 'Đang chuẩn bị', statuses: ['draft'] },
  { value: 'waiting', label: 'Chờ kết quả', statuses: ['submitted', 'under_review', 'interview'] },
  { value: 'done', label: 'Đã có kết quả', statuses: ['accepted', 'rejected', 'withdrawn'] },
];

export const inStage = (stage, application) => !stage.statuses || stage.statuses.includes(application.status);
