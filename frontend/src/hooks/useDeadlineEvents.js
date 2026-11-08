import { useMemo } from 'react';
import { addDays, startOfDay } from 'date-fns';
import { useApplications } from '~/hooks/useApplication';
import { useSavedScholarships } from '~/hooks/useScholarship';
import { getDeadlineInfo } from '~/lib/scholarship';

// Sau khi nộp đơn bao nhiêu ngày thì nhắc hỏi lại kết quả
export const FOLLOW_UP_DAYS = 14;
// Đơn còn ở các trạng thái này thì hạn nộp vẫn còn ý nghĩa
const ACTIVE_STATUSES = ['draft', 'submitted', 'under_review'];

// Gom các mốc thời gian CỦA RIÊNG người dùng: học bổng đã lưu + đơn ứng tuyển.
// Mỗi mốc: { id, date, kind: 'deadline' | 'followUp', title, scholarshipId, status?, tone }
export function buildDeadlineEvents(saved = [], applications = [], today = new Date()) {
  const events = [];
  const appliedIds = new Set(applications.map((app) => app.scholarship?.id));

  applications.forEach((app) => {
    const s = app.scholarship;
    if (s?.deadline && ACTIVE_STATUSES.includes(app.status)) {
      events.push({ id: `app-${app.id}`, date: new Date(s.deadline), kind: 'deadline', title: s.title, scholarshipId: s.id, status: app.status });
    }
    if (app.applied_at) {
      events.push({ id: `follow-${app.id}`, date: addDays(new Date(app.applied_at), FOLLOW_UP_DAYS), kind: 'followUp', title: s?.title, scholarshipId: s?.id, status: app.status });
    }
  });

  // Học bổng đã lưu mà đã tạo đơn thì chỉ hiện một lần (theo đơn)
  saved.forEach(({ scholarship: s }) => {
    if (s?.deadline && !appliedIds.has(s.id)) {
      events.push({ id: `saved-${s.id}`, date: new Date(s.deadline), kind: 'deadline', title: s.title, scholarshipId: s.id });
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

export function useDeadlineEvents() {
  const saved = useSavedScholarships();
  const applications = useApplications({ limit: 50 });

  const events = useMemo(
    () => buildDeadlineEvents(saved.data?.data ?? [], applications.data?.data ?? []),
    [saved.data, applications.data]
  );

  return {
    events,
    isLoading: saved.isLoading || applications.isLoading,
    isError: saved.isError || applications.isError,
    refetch: () => {
      saved.refetch();
      applications.refetch();
    },
  };
}
