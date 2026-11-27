import { DASHBOARD_LIST_LIMIT } from '../constants';

// Đơn tạo gần đây nhất trước; không đổi thứ tự mảng gốc
export function getRecentApplications(applications) {
  const sorted = [...applications].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return sorted.slice(0, DASHBOARD_LIST_LIMIT);
}
