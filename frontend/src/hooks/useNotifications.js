import { useMemo, useState } from 'react';
import { useApplications } from '~/hooks/useApplication';
import { useSavedScholarships } from '~/hooks/useScholarship';
import { MAX_LIMIT } from '~/utils/constants';
import { getDeadlineInfo, sortByDeadline } from '~/utils/scholarship';

// Nhắc trước hạn 14, 7 và 1 ngày (theo roadmap giai đoạn 3). Mỗi mốc là một thông báo riêng,
// nên qua mốc mới thì chuông sáng lại dù đã đọc nhắc ở mốc trước.
const REMIND_DAYS = [1, 7, 14];
const SEEN_KEY = 'scholarsgoSeenNotifications';

const readSeen = () => {
  try {
    return new Set(JSON.parse(localStorage.getItem(SEEN_KEY)) ?? []);
  } catch {
    return new Set();
  }
};

const writeSeen = (seen) => {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...seen]));
  } catch {
    // trình duyệt chặn localStorage thì chỉ nhớ trong phiên hiện tại
  }
};

function buildReminder({ scholarship, source, to }) {
  const { daysLeft, tone } = getDeadlineInfo(scholarship?.deadline);
  if (daysLeft === null || daysLeft < 0 || daysLeft > REMIND_DAYS.at(-1)) return null;
  const milestone = REMIND_DAYS.find((d) => daysLeft <= d);
  return { id: `${source}-${scholarship.id}-${milestone}`, source, to, scholarship, daysLeft, tone };
}

// Thông báo nhắc hạn, tính từ học bổng đã lưu và đơn còn ở dạng nháp.
// Chưa có API thông báo (giai đoạn 3) nên tính ở máy khách; trạng thái "đã đọc" lưu trong trình duyệt.
export function useNotifications() {
  const { data: saved, isLoading: savedLoading } = useSavedScholarships();
  const { data: applications, isLoading: appsLoading } = useApplications({ limit: MAX_LIMIT });
  const [seen, setSeen] = useState(readSeen);

  const items = useMemo(() => {
    const drafts = (applications?.data ?? [])
      .filter((app) => app.status === 'draft' && app.scholarship)
      .map((app) => buildReminder({ scholarship: app.scholarship, source: 'application', to: `/applications/${app.id}` }));
    // Học bổng đã có đơn nháp thì chỉ nhắc theo đơn, không nhắc trùng từ danh sách đã lưu
    const applied = new Set(drafts.filter(Boolean).map((r) => r.scholarship.id));
    const savedReminders = (saved?.data ?? [])
      .map((item) => item.scholarship)
      .filter((s) => s && !applied.has(s.id))
      .map((s) => buildReminder({ scholarship: s, source: 'saved', to: null }));
    return sortByDeadline([...drafts, ...savedReminders].filter(Boolean), (r) => r.scholarship.deadline);
  }, [saved, applications]);

  // Chỉ giữ id của thông báo còn hiện, để danh sách đã đọc không phình mãi
  const update = (next) => {
    const current = new Set(items.map((item) => item.id));
    const kept = new Set([...next].filter((id) => current.has(id)));
    setSeen(kept);
    writeSeen(kept);
  };

  return {
    items: items.map((item) => ({ ...item, unread: !seen.has(item.id) })),
    unreadCount: items.filter((item) => !seen.has(item.id)).length,
    // Đơn chưa tải xong (mới đăng nhập) thì coi như đang tải để không nháy trạng thái rỗng
    isLoading: savedLoading || appsLoading,
    markRead: (id) => update(new Set([...seen, id])),
    markAllRead: () => update(new Set([...seen, ...items.map((item) => item.id)])),
  };
}
