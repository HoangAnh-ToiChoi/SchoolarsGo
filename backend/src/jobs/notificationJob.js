'use strict';

const cron = require('node-cron');
const { notificationService } = require('../container');

const TIMEZONE = 'Asia/Ho_Chi_Minh';

/** Tạo thông báo nhắc hạn cho mọi người dùng. Chạy lại cùng ngày không tạo trùng. */
async function runDeadlineReminders() {
  try {
    const count = await notificationService.generateDeadlineReminders();
    console.log(`[Notification] Đã xét ${count} nhắc hạn (bản ghi trùng tự bỏ qua)`);
  } catch (e) {
    console.error('[Notification] Lỗi khi tạo nhắc hạn:', e.message);
  }
}

function startNotificationJob() {
  // 7:00 sáng mỗi ngày: sinh viên mở web buổi sáng là thấy nhắc hạn mới
  cron.schedule('0 7 * * *', runDeadlineReminders, { timezone: TIMEZONE });
  console.log('[Notification] Cron đã đăng ký: nhắc hạn nộp mỗi ngày 7:00 (GMT+7)');
}

module.exports = { startNotificationJob, runDeadlineReminders };
