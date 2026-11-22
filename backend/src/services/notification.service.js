import { AppError, notification as notificationErrors } from '~/constants/errors.js';
import notificationModel from '~/models/notification.model.js';
import { REMIND_DAYS, vnToday, addDays, daysBetween, milestoneFor } from '~/utils/deadline.js';

class NotificationService {
  /**
   * Tạo thông báo nhắc hạn cho học bổng đã lưu và đơn còn nháp có hạn trong 14 ngày tới.
   * Gọi mỗi đêm cho mọi người dùng (userId = null), và trước khi trả danh sách cho một người
   * để chuông luôn đúng kể cả khi server ngủ qua giờ chạy job. Chạy lại nhiều lần không tạo trùng.
   */
  async generateDeadlineReminders({ userId = null, now = new Date() } = {}) {
    const today = vnToday(now);
    const until = addDays(today, REMIND_DAYS.at(-1) + 1);
    const [saved, drafts] = await Promise.all([
      notificationModel.findSavedDueBetween(today, until, userId),
      notificationModel.findDraftApplicationsDueBetween(today, until, userId),
    ]);

    // Học bổng đã có đơn nháp thì nhắc theo đơn (bấm vào mở trang đơn), không nhắc trùng từ mục đã lưu
    const byKey = new Map();
    for (const item of [...saved, ...drafts]) byKey.set(`${item.user_id}:${item.scholarship_id}`, item);

    const rows = [];
    for (const item of byKey.values()) {
      const milestone = milestoneFor(daysBetween(today, item.deadline));
      if (milestone === null) continue;
      rows.push({
        user_id: item.user_id,
        type: 'deadline',
        scholarship_id: item.scholarship_id,
        application_id: item.application_id,
        milestone,
      });
    }
    await notificationModel.insertIgnoreDuplicates(rows);
    return rows.length;
  }

  async getAll(userId, { limit = 30 } = {}) {
    await this.generateDeadlineReminders({ userId });
    const today = vnToday();
    const rows = await notificationModel.findByUser(userId, limit);

    // Mỗi học bổng chỉ giữ thông báo mới nhất (mốc 7 thay mốc 14); bỏ nhắc hạn đã quá hạn hoặc của đơn đã nộp
    const seen = new Set();
    const data = [];
    for (const row of rows) {
      const scholarship = row.scholarships;
      if (!scholarship) continue;
      const key = `${row.type}:${scholarship.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const daysLeft = scholarship.deadline ? daysBetween(today, scholarship.deadline) : null;
      if (row.type === 'deadline' && (daysLeft === null || daysLeft < 0)) continue;
      // Đơn đã nộp thì không còn cần nhắc hạn
      if (row.type === 'deadline' && row.applications && row.applications.status !== 'draft') continue;
      data.push({
        id: row.id,
        type: row.type,
        milestone: row.milestone,
        days_left: daysLeft,
        application_id: row.application_id,
        read_at: row.read_at,
        created_at: row.created_at,
        scholarship: {
          id: scholarship.id,
          slug: scholarship.slug,
          title: scholarship.title,
          provider: scholarship.provider,
          deadline: scholarship.deadline,
        },
      });
    }
    return { data, unread: data.filter(n => !n.read_at).length };
  }

  async markRead(userId, notificationId) {
    const found = await notificationModel.markRead(userId, notificationId);
    if (!found) throw new AppError(notificationErrors.NOT_FOUND);
    return { id: notificationId };
  }

  async markAllRead(userId) {
    return { updated: await notificationModel.markAllRead(userId) };
  }
}

export default new NotificationService();
