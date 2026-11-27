const MS_PER_DAY = 1000 * 60 * 60 * 24;

// Số ngày còn lại (làm tròn lên) tính theo giờ hiện tại, không theo ngày lịch
export function getDaysUntil(deadline, now) {
  const diff = new Date(deadline) - now;
  return Math.ceil(diff / MS_PER_DAY);
}
