/**
 * container.js — VÙNG 2 (Controller → Service → Repository → DB)
 *
 * QUY TẮC TUYỆT ĐỐI:
 * - File DUY NHẤT được tạo instance của Repository, Service và Controller
 * - CHỈ THÊM VÀO — không sửa, không xóa dòng cũ
 * - Là Singleton: Node.js cache module, mọi nơi import đều dùng cùng instance
 *
 * Wiring: db → ScholarshipRepository → ScholarshipService → ScholarshipController
 *         db → ProfileRepository → ProfileService → ProfileController
 *         db → ApplicationRepository → ApplicationService
 *         db → DocumentRepository → DocumentService → DocumentController
 */

const db = require('./utils/db');

// ── Scholarship Module ─────────────────────────────────────
const ScholarshipRepository = require('./repositories/scholarship.repository');
const ScholarshipService = require('./services/scholarship.service');
const ScholarshipController = require('./controllers/scholarship.controller');

const scholarshipRepo = new ScholarshipRepository(db);
const scholarshipService = new ScholarshipService(scholarshipRepo);
const scholarshipController = new ScholarshipController(scholarshipService);

// ── Profile Module ──────────────────────────────────────────
const ProfileRepository = require('./repositories/profile.repository');
const ProfileService = require('./services/profile.service');
const ProfileController = require('./controllers/profile.controller');

const profileRepo = new ProfileRepository(db);
const profileService = new ProfileService(profileRepo);
const profileController = new ProfileController(profileService);

// ── Application Module ──────────────────────────────────────
const ApplicationRepository = require('./repositories/application.repository');
const ApplicationService = require('./services/application-v2.service');

const applicationRepo = new ApplicationRepository(db);
const applicationService = new ApplicationService(applicationRepo);

// ── Document Module ─────────────────────────────────────────
const DocumentRepository = require('./repositories/document.repository');
const DocumentService = require('./services/document.service');
const DocumentController = require('./controllers/document.controller');

const documentRepo = new DocumentRepository(db);
const documentService = new DocumentService(documentRepo);
const documentController = new DocumentController(documentService);

module.exports = {
  scholarshipRepo,
  scholarshipService,
  scholarshipController,
  profileRepo,
  profileService,
  profileController,
  applicationService,
  documentRepo,
  documentService,
  documentController,
};
