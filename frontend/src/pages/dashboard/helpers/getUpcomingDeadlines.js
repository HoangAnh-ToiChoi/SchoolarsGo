import { DASHBOARD_LIST_LIMIT, UPCOMING_WINDOW_DAYS } from '../constants';

// Học bổng hết hạn trong 30 ngày tới (chưa qua hạn), hạn gần nhất trước
export function getUpcomingDeadlines(scholarships, now) {
  const windowEnd = new Date(now);
  windowEnd.setDate(windowEnd.getDate() + UPCOMING_WINDOW_DAYS);

  const inWindow = scholarships.filter((s) => {
    const deadline = new Date(s.deadline);
    return deadline <= windowEnd && deadline > now;
  });
  const sorted = inWindow.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  return sorted.slice(0, DASHBOARD_LIST_LIMIT);
}
