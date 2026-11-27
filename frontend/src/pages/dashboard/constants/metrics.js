import { BookmarkIcon, ClipboardCheck, AlertCircle } from 'lucide-react';

export const METRICS = [
  { id: 'total-apps', label: 'Tổng đơn ứng tuyển', key: 'totalApps', icon: ClipboardCheck, color: 'text-primary-400' },
  { id: 'saved-scholarships', label: 'Học bổng đã lưu', key: 'savedCount', icon: BookmarkIcon, color: 'text-warning-400' },
  { id: 'profile-completion', label: 'Hoàn thành profile', key: 'completion', icon: ClipboardCheck, color: 'text-success-400' },
  { id: 'upcoming-deadlines', label: 'Sắp tới hạn', key: 'upcomingCount', icon: AlertCircle, color: 'text-danger-400' },
];
