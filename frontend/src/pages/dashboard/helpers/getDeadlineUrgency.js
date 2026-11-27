import { SOON_DAYS, URGENT_DAYS } from '../constants';

// Mức gấp theo ngưỡng riêng của dashboard: ≤ 7 ngày, ≤ 14 ngày, còn lại
export function getDeadlineUrgency(daysUntil) {
  if (daysUntil <= URGENT_DAYS) return 'urgent';
  if (daysUntil <= SOON_DAYS) return 'soon';
  return 'normal';
}
