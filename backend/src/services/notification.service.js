import { AppError, notification as notificationErrors } from '~/constants/errors.js';
import notificationModel from '~/models/notification.model.js';
import { NOTIFICATION_TOPIC_PREFIX } from '~/constants/notification.js';
import { REMIND_DAYS, vnToday, addDays, daysBetween, milestoneFor } from '~/utils/deadline.js';

class NotificationService {
  // Người đã được tạo nhắc hạn trong ngày (giờ VN): mở chuông nhiều lần không ghi DB lại
  #remindedDay = null;
  #remindedUsers = new Set();

  /**
   * Tạo thông báo nhắc hạn cho học bổng đã lưu và đơn còn nháp có hạn trong 14 ngày tới.
   * Job gọi mỗi sáng cho mọi người dùng (userId = null); getAll gọi bù một lần / ngày / người
   * để chuông đúng kể cả khi server ngủ qua giờ chạy job. Chạy lại nhiều lần không tạo trùng.
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

  /** Gọi sau khi lưu học bổng / tạo đơn để có nhắc hạn ngay. Lỗi chỉ ghi log, không làm hỏng thao tác chính. */
  async refreshUserReminders(userId) {
    try {
      await this.generateDeadlineReminders({ userId });
    } catch (err) {
      console.warn('[Notification] Không tạo được nhắc hạn:', err.message);
    }
  }

  async #remindOncePerDay(userId, today) {
    if (this.#remindedDay !== today) {
      this.#remindedDay = today;
      this.#remindedUsers.clear();
    }
    if (this.#remindedUsers.has(userId)) return;
    await this.generateDeadlineReminders({ userId });
    this.#remindedUsers.add(userId);
  }

  async getAll(userId, { limit = 30 } = {}) {
    const today = vnToday();
    await this.#remindOncePerDay(userId, today);
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
      if (row.type === 'deadline' && scholarship.is_active === false) continue; // admin đã tắt học bổng
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

  /**
   * Kênh Supabase Realtime để chuông cập nhật ngay khi có thông báo mới. Tín hiệu không mang dữ liệu:
   * FE nhận xong gọi lại getAll. Tên kênh ngẫu nhiên theo người dùng nên chỉ trả cho chính họ.
   */
  async getChannel(userId) {
    const topic = await notificationModel.findRealtimeTopic(userId);
    if (!topic) throw new AppError(notificationErrors.CHANNEL_NOT_FOUND);
    return { topic: `${NOTIFICATION_TOPIC_PREFIX}${topic}` };
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
