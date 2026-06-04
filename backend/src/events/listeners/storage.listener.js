/**
 * storage.listener.js — Listener xử lý storage usage
 *
 * Lắng nghe các event liên quan đến Document:
 * - document.uploaded  → log + tính toán dung lượng
 * - document.deleted   → log + cập nhật dung lượng
 *
 * TODO: cập nhật bảng thống kê khi sẵn sàng.
 */

const eventBus = require('../eventBus');
const logger = require('../../utils/logger');

const registerStorageListeners = () => {
  // ── document.uploaded ──────────────────────────────────────
  eventBus.on('document.uploaded', async payload => {
    try {
      const { userId, docType, fileSize, fileName, documentId } = payload;
      logger.info({ userId, docType, fileSize, fileName, documentId }, 'Document uploaded');
      // TODO: Tính tổng dung lượng theo userId/docType, cập nhật bảng thống kê
    } catch (err) {
      // Bọc try/catch — lỗi không làm sập server
      logger.error({ err }, 'Error handling document.uploaded');
    }
  });

  // ── document.deleted ───────────────────────────────────────
  eventBus.on('document.deleted', async payload => {
    try {
      const { userId, documentId, fileSize } = payload;
      logger.info({ userId, documentId, fileSize }, 'Document deleted');
      // TODO: Trừ dung lượng theo userId, cập nhật bảng thống kê
    } catch (err) {
      logger.error({ err }, 'Error handling document.deleted');
    }
  });
};

module.exports = { registerStorageListeners };
