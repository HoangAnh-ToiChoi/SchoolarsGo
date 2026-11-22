import { addDays, startOfDay } from 'date-fns';
import { getDeadlineInfo } from '~/utils/scholarship';
import { FOLLOW_UP_DAYS, ACTIVE_STATUSES } from '../constants';

// Gom các mốc thời gian CỦA RIÊNG người dùng: học bổng đã lưu + đơn ứng tuyển.
// Mỗi mốc: { id, date, kind: 'deadline' | 'followUp', title, scholarshipId, scholarshipSlug, status?, tone }
export function buildDeadlineEvents(saved = [], applications = [], today = new Date()) {
  const events = [];
  const appliedIds = new Set(applications.map((app) => app.scholarship?.id));

  applications.forEach((app) => {
    const s = app.scholarship;
    if (s?.deadline && ACTIVE_STATUSES.includes(app.status)) {
      events.push({ id: `app-${app.id}`, date: new Date(s.deadline), kind: 'deadline', title: s.title, scholarshipId: s.id, scholarshipSlug: s.slug, status: app.status });
    }
    if (app.applied_at) {
      events.push({ id: `follow-${app.id}`, date: addDays(new Date(app.applied_at), FOLLOW_UP_DAYS), kind: 'followUp', title: s?.title, scholarshipId: s?.id, scholarshipSlug: s?.slug, status: app.status });
    }
  });

  // Học bổng đã lưu mà đã tạo đơn thì chỉ hiện một lần (theo đơn)
  saved.forEach(({ scholarship: s }) => {
    if (s?.deadline && !appliedIds.has(s.id)) {
      events.push({ id: `saved-${s.id}`, date: new Date(s.deadline), kind: 'deadline', title: s.title, scholarshipId: s.id, scholarshipSlug: s.slug });
    }
  });

  const start = startOfDay(today);
  return events
    .map((e) => ({
      ...e,
      isPast: e.date < start,
      tone: e.kind === 'followUp' ? 'brand' : e.date < start ? 'neutral' : getDeadlineInfo(e.date, today).tone,
    }))
    .sort((a, b) => a.date - b.date);
}
