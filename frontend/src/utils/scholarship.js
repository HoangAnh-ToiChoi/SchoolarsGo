import { differenceInCalendarDays } from 'date-fns';
import { formatDate } from './format.js';

// Ngưỡng màu nhãn hạn nộp (ngày). Đổi ở đây là đổi cho toàn hệ thống.
export const DEADLINE_URGENT_DAYS = 10;
export const DEADLINE_SOON_DAYS = 30;

// Số ngày còn lại và tông màu nhãn: urgent ≤ 10, soon 11–30, open > 30, neutral = chưa rõ hạn
export function getDeadlineInfo(deadline, today = new Date()) {
  // Nhiều học bổng chưa công bố hạn nộp (deadline = null) hoặc ngày không hợp lệ: không tính ngày, không tô màu cảnh báo
  if (!deadline) return { daysLeft: null, tone: 'neutral' };
  const target = new Date(deadline);
  if (Number.isNaN(target.getTime())) return { daysLeft: null, tone: 'neutral' };
  const daysLeft = differenceInCalendarDays(target, today);
  let tone = 'open';
  if (daysLeft <= DEADLINE_URGENT_DAYS) tone = 'urgent';
  else if (daysLeft <= DEADLINE_SOON_DAYS) tone = 'soon';
  return { daysLeft, tone };
}

// Chữ và mô tả thống nhất cho hạn nộp ở mọi nơi (R2)
export function getDeadlineLabel(deadline, today = new Date()) {
  if (typeof deadline === 'number' && !Number.isNaN(deadline)) {
    const daysLeft = deadline;
    let tone = 'open';
    if (daysLeft <= DEADLINE_URGENT_DAYS) tone = 'urgent';
    else if (daysLeft <= DEADLINE_SOON_DAYS) tone = 'soon';
    if (daysLeft === 0) {
      return {
        tone,
        daysLeft,
        short: 'Hết hạn hôm nay',
        note: '',
        badge: 'Hết hạn hôm nay',
        actionTitle: 'Hạn nộp hôm nay',
        actionDesc: 'Hôm nay là ngày cuối cùng',
        notificationDesc: 'hết hạn hôm nay',
        hasDeadline: true,
      };
    }
    return {
      tone,
      daysLeft,
      short: `còn ${daysLeft} ngày`,
      note: '',
      badge: `còn ${daysLeft} ngày`,
      actionTitle: `còn ${daysLeft} ngày`,
      actionDesc: `Còn ${daysLeft} ngày để chuẩn bị hồ sơ`,
      notificationDesc: `còn ${daysLeft} ngày là hết hạn`,
      hasDeadline: true,
    };
  }

  const { daysLeft, tone } = getDeadlineInfo(deadline, today);
  if (daysLeft === null || Number.isNaN(daysLeft)) {
    return {
      tone: 'neutral',
      daysLeft: null,
      short: 'Chưa công bố',
      note: 'Theo dõi bài đăng gốc',
      badge: 'Chưa công bố',
      actionTitle: 'Chưa công bố',
      actionDesc: 'Nhà tài trợ chưa đăng mốc thời gian chính thức.',
      notificationDesc: 'chưa công bố',
      hasDeadline: false,
    };
  }

  const formattedDate = formatDate(deadline);
  if (daysLeft === 0) {
    return {
      tone,
      daysLeft,
      short: 'Hết hạn hôm nay',
      note: formattedDate,
      badge: `${formattedDate} · Hết hạn hôm nay`,
      actionTitle: `Hạn nộp ${formattedDate}`,
      actionDesc: 'Hôm nay là ngày cuối cùng',
      notificationDesc: 'hết hạn hôm nay',
      hasDeadline: true,
    };
  }

  return {
    tone,
    daysLeft,
    short: `còn ${daysLeft} ngày`,
    note: formattedDate,
    badge: `${formattedDate} · còn ${daysLeft} ngày`,
    actionTitle: `Hạn nộp ${formattedDate}`,
    actionDesc: `Còn ${daysLeft} ngày để chuẩn bị hồ sơ`,
    notificationDesc: `còn ${daysLeft} ngày là hết hạn`,
    hasDeadline: true,
  };
}

const DOMESTIC_COUNTRIES = ['vietnam', 'viet nam', 'việt nam'];

// Học bổng trong nước hay du học. DB chưa có cột scope nên tạm suy ra từ quốc gia.
export function getScope(scholarship) {
  if (scholarship.scope) return scholarship.scope;
  return DOMESTIC_COUNTRIES.includes(String(scholarship.country).trim().toLowerCase()) ? 'domestic' : 'international';
}

export const SCOPE_LABELS = { international: 'Du học', domestic: 'Trong nước' };

// DB lưu tiếng Anh; hiển thị tiếng Việt, không có trong bảng thì giữ nguyên
export const DEGREE_LABELS = { Bachelor: 'Đại học', Master: 'Thạc sĩ', PhD: 'Tiến sĩ', Any: 'Mọi bậc' };

export const COUNTRY_LABELS = {
  UK: 'Anh', 'United Kingdom': 'Anh', USA: 'Mỹ', 'United States': 'Mỹ', Germany: 'Đức', France: 'Pháp',
  Japan: 'Nhật Bản', 'South Korea': 'Hàn Quốc', Korea: 'Hàn Quốc', Australia: 'Úc', Canada: 'Canada',
  Netherlands: 'Hà Lan', Sweden: 'Thụy Điển', Singapore: 'Singapore', 'New Zealand': 'New Zealand',
  China: 'Trung Quốc', Taiwan: 'Đài Loan', Vietnam: 'Việt Nam',
};

export const labelOf = (labels, value) => labels[value] ?? value;

// Đường dẫn trang chi tiết: ưu tiên slug (URL dễ đọc), chưa có slug thì dùng id
export const scholarshipPath = (scholarship) => `/scholarships/${scholarship?.slug || scholarship?.id}`;

// Sắp theo hạn nộp tăng dần; chưa công bố hạn xếp cuối (dùng ở trang đã lưu, đơn ứng tuyển, thông báo)
export function sortByDeadline(items, getDeadline = (item) => item.deadline) {
  const time = (item) => {
    const deadline = getDeadline(item);
    if (!deadline) return Infinity;
    const t = new Date(deadline).getTime();
    return Number.isNaN(t) ? Infinity : t;
  };
  return [...items].sort((a, b) => time(a) - time(b));
}
