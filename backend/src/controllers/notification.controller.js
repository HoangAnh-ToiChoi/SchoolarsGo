const { success } = require('../utils/responseHelper');

class NotificationController {
  #service;

  constructor(notificationService) {
    this.#service = notificationService;
    if (!this.#service) throw new Error('NotificationService is required');
  }

  async getAll(req, res, next) {
    try {
      const { data, unread } = await this.#service.getAll(req.user.id, { limit: req.query.limit });
      return success(res, data, 'OK', { unread });
    } catch (err) {
      next(err);
    }
  }

  async markRead(req, res, next) {
    try {
      const data = await this.#service.markRead(req.user.id, req.params.id);
      return success(res, data, 'Đã đánh dấu đã đọc.');
    } catch (err) {
      next(err);
    }
  }

  async markAllRead(req, res, next) {
    try {
      const data = await this.#service.markAllRead(req.user.id);
      return success(res, data, 'Đã đánh dấu tất cả đã đọc.');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = NotificationController;
