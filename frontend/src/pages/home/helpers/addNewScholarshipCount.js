import { NEW_SCHOLARSHIPS_CAP } from '../constants/newScholarships.js';

/** Cộng số học bổng mới từ tín hiệu realtime; payload không đáng tin (kênh công khai) nên chỉ nhận số nguyên dương. */
export function addNewScholarshipCount(current, payload) {
  const added = Number(payload?.count);
  if (!Number.isInteger(added) || added <= 0) return current;
  return Math.min(current + added, NEW_SCHOLARSHIPS_CAP);
}

/** "5" hoặc "99+" khi đã chạm trần. */
export function formatNewScholarshipCount(count) {
  return count >= NEW_SCHOLARSHIPS_CAP ? `${NEW_SCHOLARSHIPS_CAP}+` : String(count);
}
