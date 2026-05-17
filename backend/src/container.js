/**
 * container.js — DI Container
 *
 * QUY TẮC TUYỆT ĐỐI:
 * - File DUY NHẤT được tạo instance của Repository, Service và Controller
 * - CHỈ THÊM VÀO — không sửa, không xóa dòng cũ
 * - Là Singleton: Node.js cache module, mọi nơi import đều dùng cùng instance
 */
const db = require('./utils/db');

// ── EventBus ────────────────────────────────────────────────
const eventBus = require('./events/eventBus');

// ── Admin Module ──────────────────────────────────────────
const AdminRepository = require('./repositories/admin.repository');
const AdminService = require('./services/admin.service');
const AdminController = require('./controllers/admin.controller');

const adminRepo = new AdminRepository(db);
const adminService = new AdminService(adminRepo);
const adminController = new AdminController(adminService);

module.exports = {
  adminRepo,
  adminService,
  adminController,
  eventBus,
};

// ── Event Listeners ─────────────────────────────────────────
const { registerStorageListeners } = require('./events/listeners/storage.listener');
const { registerAuthListeners } = require('./events/listeners/auth.listener');

registerStorageListeners();
registerAuthListeners();
