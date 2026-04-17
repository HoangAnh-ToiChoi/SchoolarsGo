/**
 * container.js — VÙNG 2 (Controller → Service → Repository → DB)
 *
 * QUY TẮC TUYỆT ĐỐI:
 * - File DUY NHẤT được tạo instance của Repository và Service
 * - CHỈ THÊM VÀO — không sửa, không xóa dòng cũ
 * - Là Singleton: Node.js cache module, mọi nơi import đều dùng cùng instance
 *
 * Wiring: db → ApplicationRepository → ApplicationService
 */

const db = require('./utils/db');

// ── Application Module ──────────────────────────────────
const ApplicationRepository = require('./repositories/application.repository');
const ApplicationService = require('./services/application-v2.service');

const applicationRepo = new ApplicationRepository(db);
const applicationService = new ApplicationService(applicationRepo);

module.exports = {
  applicationService,
};
