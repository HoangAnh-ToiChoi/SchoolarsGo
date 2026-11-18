import express from 'express';

const router = express.Router();

import { auth } from '#middlewares/auth.js';
import requireRole from '#middlewares/requireRole.js';
import validate from '#middlewares/validate.js';
import { adminCreateScholarshipSchema, adminUpdateScholarshipSchema, adminUpdateUserRoleSchema, adminUpdateUserStatusSchema, adminUpdateScholarshipFeaturedSchema, adminUserQuerySchema } from '#validations/admin.validation.js';

import adminController from '#controllers/admin.controller.js';

router.use(auth, requireRole('admin'));

router.get('/stats', adminController.getStats);

router.get('/stats/chart', adminController.getChartStats);

router.get('/users', validate(adminUserQuerySchema, 'query'), adminController.getUsers);

router.get('/users/:id', adminController.getUserById);

router.patch('/users/:id/role', validate(adminUpdateUserRoleSchema), adminController.updateUserRole);

router.patch('/users/:id/status', validate(adminUpdateUserStatusSchema), adminController.updateUserStatus);

router.post('/scholarships', validate(adminCreateScholarshipSchema), adminController.createScholarship);

router.patch('/scholarships/:id', validate(adminUpdateScholarshipSchema), adminController.updateScholarship);

router.patch('/scholarships/:id/featured', validate(adminUpdateScholarshipFeaturedSchema), adminController.updateScholarshipFeatured);

router.delete('/scholarships/:id', adminController.deleteScholarship);

export default router;