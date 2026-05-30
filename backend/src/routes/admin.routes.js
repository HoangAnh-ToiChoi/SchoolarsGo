/**
 * admin.routes.js — TẦNG ROUTE: Mount endpoints Admin
 *
 * Tiêu chí OOP:
 * [2] DI — Controller được import từ container (đã được inject).
 */
const express = require('express');
const router = express.Router();

const { auth } = require('../middlewares/auth');
const requireRole = require('../middlewares/requireRole');
const validate = require('../middlewares/validate');
const {
  adminCreateScholarshipSchema,
  adminUpdateScholarshipSchema,
  adminUpdateUserRoleSchema,
  adminUpdateUserStatusSchema,
  adminUpdateScholarshipFeaturedSchema,
  adminUserQuerySchema,
} = require('../utils/validators');

// Import controller từ container (đã được inject dependencies)
const { adminController } = require('../container');

// ═══════════════════════════════════════════════════════════
// MOUNT — auth → requireRole (middleware chạy theo thứ tự)
// ═══════════════════════════════════════════════════════════
router.use(auth, requireRole('admin'));

// ═══════════════════════════════════════════════════════════
// DASHBOARD STATS
// ═══════════════════════════════════════════════════════════

/**
 * GET /api/admin/stats
 */
router.get('/stats', adminController.getStats);

/**
 * GET /api/admin/stats/chart
 */
router.get('/stats/chart', adminController.getChartStats);

// ═══════════════════════════════════════════════════════════
// USER MANAGEMENT
// ═══════════════════════════════════════════════════════════

/**
 * GET /api/admin/users
 */
router.get('/users', validate(adminUserQuerySchema, 'query'), adminController.getUsers);

/**
 * GET /api/admin/users/:id
 */
router.get('/users/:id', adminController.getUserById);

/**
 * PATCH /api/admin/users/:id/role
 */
router.patch('/users/:id/role', validate(adminUpdateUserRoleSchema), adminController.updateUserRole);

/**
 * PATCH /api/admin/users/:id/status
 */
router.patch('/users/:id/status', validate(adminUpdateUserStatusSchema), adminController.updateUserStatus);

// ═══════════════════════════════════════════════════════════
// SCHOLARSHIP MANAGEMENT
// ═══════════════════════════════════════════════════════════

/**
 * POST /api/admin/scholarships
 */
router.post('/scholarships', validate(adminCreateScholarshipSchema), adminController.createScholarship);

/**
 * PATCH /api/admin/scholarships/:id
 */
router.patch('/scholarships/:id', validate(adminUpdateScholarshipSchema), adminController.updateScholarship);

/**
 * PATCH /api/admin/scholarships/:id/featured
 */
router.patch('/scholarships/:id/featured', validate(adminUpdateScholarshipFeaturedSchema), adminController.updateScholarshipFeatured);

/**
 * DELETE /api/admin/scholarships/:id
 */
router.delete('/scholarships/:id', adminController.deleteScholarship);

module.exports = router;
