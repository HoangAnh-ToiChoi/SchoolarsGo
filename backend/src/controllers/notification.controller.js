import { success } from '#utils/responseHelper.js';
import notificationService from '#services/notification.service.js';

class NotificationController {
  async getAll(req, res) {
    const { data, unread } = await notificationService.getAll(req.user.id, { limit: req.query.limit });
    return success(res, data, 'OK', { unread });
  }

  async markRead(req, res) {
    const data = await notificationService.markRead(req.user.id, req.params.id);
    return success(res, data, 'Đã đánh dấu đã đọc.');
  }

  async markAllRead(req, res) {
    const data = await notificationService.markAllRead(req.user.id);
    return success(res, data, 'Đã đánh dấu tất cả đã đọc.');
  }
}

export default new NotificationController();