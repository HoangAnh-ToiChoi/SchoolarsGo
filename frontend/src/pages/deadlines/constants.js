import { APPLICATION_STATUSES } from '~/utils/constants';

// Màu chấm/nhãn của từng loại mốc (khớp nhãn hạn nộp trên thẻ học bổng)
export const TONE_DOT = {
  urgent: 'bg-urgent-fg',
  soon: 'bg-soon-fg',
  open: 'bg-open-fg',
  brand: 'bg-brand-600',
  neutral: 'bg-line-strong',
};

export const LEGEND = [
  { tone: 'urgent', label: 'Hạn nộp còn ≤ 10 ngày' },
  { tone: 'soon', label: 'Hạn nộp còn 11–30 ngày' },
  { tone: 'open', label: 'Hạn nộp còn trên 30 ngày' },
  { tone: 'brand', label: 'Nên hỏi lại kết quả (14 ngày sau khi nộp)' },
];

export const statusLabel = (status) => APPLICATION_STATUSES.find((s) => s.value === status)?.label;
