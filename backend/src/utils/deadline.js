// Nhắc trước hạn nộp 14, 7 và 1 ngày. Mỗi mốc là một thông báo riêng.
const REMIND_DAYS = [1, 7, 14];
const DAY_MS = 864e5;
const TIMEZONE = 'Asia/Ho_Chi_Minh';

/** Ngày hôm nay theo giờ Việt Nam, dạng 'YYYY-MM-DD' (cột deadline lưu theo ngày địa phương). */
const vnToday = (now = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE }).format(now);

const addDays = (isoDate, days) => new Date(Date.parse(`${isoDate}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);

/** Số ngày lịch còn lại tới hạn nộp (0 = hết hạn hôm nay). */
const daysBetween = (todayIso, deadline) =>
  Math.round((Date.parse(`${String(deadline).slice(0, 10)}T00:00:00Z`) - Date.parse(`${todayIso}T00:00:00Z`)) / DAY_MS);

/** Mốc nhắc nhỏ nhất còn ≥ số ngày còn lại: còn 5 ngày → mốc 7. Ngoài 0–14 ngày → null. */
const milestoneFor = daysLeft => (daysLeft < 0 ? null : (REMIND_DAYS.find(d => daysLeft <= d) ?? null));

export { REMIND_DAYS, vnToday, addDays, daysBetween, milestoneFor };
