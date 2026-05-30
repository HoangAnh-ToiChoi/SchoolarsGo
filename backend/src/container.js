/**
 * container.js — VÙNG 2 (Controller → Service → Repository → DB)
 *
 * QUY TẮC TUYỆT ĐỐI:
 * - File DUY NHẤT được tạo instance của Repository, Service và Controller
 * - CHỈ THÊM VÀO — không sửa, không xóa dòng cũ
 * - Là Singleton: Node.js cache module, mọi nơi import đều dùng cùng instance
 *
 * Tiêu chí OOP:
 * [2] Dependency Injection — mọi dependency được truyền qua constructor().
 *     KHÔNG hard-import Service/Repository bên trong class.
 *
 * Wiring: db → AdminRepository → AdminService → AdminController
 */
const getSupabase = require('./utils/supabase');
const sb = getSupabase();
const db = require('./utils/db');

// ── EventBus ────────────────────────────────────────────────
const eventBus = require('./events/eventBus');

// ── Shared Services (SRP: tách riêng hash + token) ──────────
const HashService = require('./services/hash.service');
const TokenService = require('./services/token.service');

const hashService = new HashService();
const tokenService = new TokenService();

// ── Admin Module ──────────────────────────────────────────
const AdminRepository = require('./repositories/admin.repository');
const AdminService = require('./services/admin.service');
const AdminController = require('./controllers/admin.controller');

const adminRepo = new AdminRepository(db);
const adminService = new AdminService(adminRepo);
const adminController = new AdminController(adminService);

// ── Scholarship Module ─────────────────────────────────────
const ScholarshipRepository = require('./repositories/scholarship.repository');
const ScholarshipService = require('./services/scholarship.service');
const ScholarshipController = require('./controllers/scholarship.controller');

const scholarshipRepo = new ScholarshipRepository(sb);
const scholarshipService = new ScholarshipService(scholarshipRepo);
const scholarshipController = new ScholarshipController(scholarshipService);

// ── Profile Module ──────────────────────────────────────────
const ProfileRepository = require('./repositories/profile.repository');
const ProfileService = require('./services/profile.service');
const ProfileController = require('./controllers/profile.controller');

const profileRepo = new ProfileRepository(sb);
const profileService = new ProfileService(profileRepo);
const profileController = new ProfileController(profileService);

// ── Application Module ──────────────────────────────────────
const ApplicationRepository = require('./repositories/application.repository');
const ApplicationService = require('./services/application.service');

const applicationRepo = new ApplicationRepository(sb);
const applicationService = new ApplicationService(applicationRepo);
const ApplicationController = require('./controllers/application.controller');
const applicationController = new ApplicationController(applicationService);

// ── Document Module ─────────────────────────────────────────
const DocumentRepository = require('./repositories/document.repository');
const DocumentService = require('./services/document.service');
const DocumentController = require('./controllers/document.controller');

const documentRepo = new DocumentRepository(sb);
const storageService = require('./services/storage.service');
const documentService = new DocumentService(documentRepo, eventBus, storageService);
const documentController = new DocumentController(documentService);

// ── Saved Module ──────────────────────────────────────────
const SavedRepository = require('./repositories/saved.repository');
const SavedService = require('./services/saved.service');
const SavedController = require('./controllers/saved.controller');

const savedRepo = new SavedRepository(sb);
const savedService = new SavedService(savedRepo);
const savedController = new SavedController(savedService);

// ── Auth Module (SRP: inject hashService + tokenService) ───
const AuthRepository = require('./repositories/auth.repository');
const AuthService = require('./services/auth.service');
const AuthController = require('./controllers/auth.controller');

const authRepo = new AuthRepository(sb);
const authService = new AuthService(authRepo, eventBus, hashService, tokenService);
const authController = new AuthController(authService);

// ── Recommend Module (DIP: inject geminiService) ────────────
const RecommendRepository = require('./repositories/recommend.repository');
const RecommendService = require('./services/recommend.service');
const RecommendController = require('./controllers/recommend.controller');
const geminiService = require('./services/gemini.service');

const recommendRepo = new RecommendRepository(sb);
const recommendService = new RecommendService(recommendRepo, geminiService);
const recommendController = new RecommendController(recommendService);

// ── News Module (DIP: chuyển sang class, inject qua container) ──
const NewsService = require('./services/news.service');
const NewsController = require('./controllers/news.controller');

const newsService = new NewsService();
const newsController = new NewsController(newsService);

// ── Chat Module (DIP: controller nhận chatService qua constructor) ──
const chatService = require('./services/chat.service');
const ChatController = require('./controllers/chat.controller');

const chatController = new ChatController(chatService);

module.exports = {
  // Admin
  adminRepo,
  adminService,
  adminController,
  // Existing modules
  scholarshipRepo,
  scholarshipService,
  scholarshipController,
  profileRepo,
  profileService,
  profileController,
  applicationService,
  applicationController,
  documentRepo,
  documentService,
  documentController,
  savedService,
  savedController,
  authRepo,
  authService,
  authController,
  recommendRepo,
  recommendService,
  recommendController,
  // Newly wired modules
  newsService,
  newsController,
  chatController,
};

// ── Event Listeners ─────────────────────────────────────────
const { registerStorageListeners } = require('./events/listeners/storage.listener');
const { registerAuthListeners } = require('./events/listeners/auth.listener');

registerStorageListeners();
registerAuthListeners();
