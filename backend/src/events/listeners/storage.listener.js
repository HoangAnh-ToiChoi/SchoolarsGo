/**
 * storage.listener.js — Listener xử lý storage usage
 *
 * Lắng nghe các event liên quan đến Document:
 * - document.uploaded  → log + tính toán dung lượng
 * - document.deleted   → log + cập nhật dung lượng
 *
 * Hiện tại chỉ console.log. TODO: cập nhật bảng thống kê khi sẵn sàng.
 */

const eventBus = require('../eventBus');

const registerStorageListeners = () => {
  // ── document.uploaded ──────────────────────────────────────
  eventBus.on('document.uploaded', async (payload) => {
    try {
      const { userId, docType, fileSize, fileName, documentId } = payload;
      console.log(
        `[STORAGE LOG] User ${userId} uploaded "${fileName}" ` +
        `(${fileSize} bytes, type: ${docType}, id: ${documentId}). ` +
        'Calculating storage usage...'
      );
      // TODO: Tính tổng dung lượng theo userId/docType, cập nhật bảng thống kê
    } catch (err) {
      // Bọc try/catch — lỗi không làm sập server
      console.error('[STORAGE LISTENER] Error handling document.uploaded:', err.message);
    }
  });

  // ── document.deleted ───────────────────────────────────────
  eventBus.on('document.deleted', async (payload) => {
    try {
      const { userId, documentId, fileSize } = payload;
      console.log(
        `[STORAGE LOG] User ${userId} deleted document id=${documentId} ` +
        `(${fileSize} bytes). Recalculating storage usage...`
      );
      // TODO: Trừ dung lượng theo userId, cập nhật bảng thống kê
    } catch (err) {
      console.error('[STORAGE LISTENER] Error handling document.deleted:', err.message);
    }
  });
};

module.exports = { registerStorageListeners };
