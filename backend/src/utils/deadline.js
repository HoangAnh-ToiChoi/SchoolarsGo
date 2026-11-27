// Nhắc trước hạn nộp 14, 7 và 1 ngày. Mỗi mốc là một thông báo riêng.
const REMIND_DAYS = [1, 7, 14];
const DAY_MS = 864e5;
const TIMEZONE = 'Asia/Ho_Chi_Minh';

/** Ngày hôm nay theo giờ Việt Nam, dạng 'YYYY-MM-DD' (cột deadline lưu theo ngày địa phương). */
const vnToday = (now = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE }).format(now);

const addDays = (isoDate, days) => new Date(Date.parse(`${isoDate}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);

// Chuỗi có múi giờ: "…Z" hoặc "…+07:00" / "…-0500" ở cuối
const HAS_TIMEZONE = /(?:z|[+-]\d{2}:?\d{2})$/i;

/**
 * Ngày lịch giờ VN của một hạn nộp, dạng 'YYYY-MM-DD'. Cột deadline lưu ngày địa phương không múi giờ ("2026-12-02T00:00:00")
 * nên lấy 10 ký tự đầu; giá trị có múi giờ (admin gửi ISO "2026-12-01T17:00:00Z" = 0h ngày 02/12 giờ VN) hoặc Date
 * thì đổi sang giờ VN trước (R25: trước đây cắt chuỗi nên lệch một ngày).
 */
function toVnDate(deadline) {
  if (deadline instanceof Date) return vnToday(deadline);
  const text = String(deadline);
  return HAS_TIMEZONE.test(text) ? vnToday(new Date(text)) : text.slice(0, 10);
}

/** Số ngày lịch còn lại tới hạn nộp (0 = hết hạn hôm nay). */
function daysBetween(todayIso, deadline) {
  const deadlineDay = Date.parse(`${toVnDate(deadline)}T00:00:00Z`);
  const today = Date.parse(`${todayIso}T00:00:00Z`);
  return Math.round((deadlineDay - today) / DAY_MS);
}

/** Mốc nhắc nhỏ nhất còn ≥ số ngày còn lại: còn 5 ngày → mốc 7. Ngoài 0–14 ngày → null. */
const milestoneFor = daysLeft => (daysLeft < 0 ? null : (REMIND_DAYS.find(d => daysLeft <= d) ?? null));

export { REMIND_DAYS, vnToday, addDays, toVnDate, daysBetween, milestoneFor };
