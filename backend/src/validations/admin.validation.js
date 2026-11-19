import { z } from 'zod';
import { DEGREES } from './scholarship.validation.js';

const adminCreateScholarshipSchema = z.object({
  title: z.string().min(1, 'Tiêu đề không được để trống').max(500),
  provider: z.string().min(1, 'Tổ chức cấp học bổng không được để trống').max(255),
  country: z.string().max(100).optional(),
  degree: z
    .string()
    .refine(v => !v || DEGREES.includes(v), {
      message: `degree phải là một trong: ${DEGREES.join(', ')}`,
    })
    .optional(),
  field_of_study: z.string().max(255).optional(),
  amount: z.string().max(255).optional(),
  deadline: z.string().datetime({ message: 'deadline phải là ISO 8601' }).optional(),
  min_gpa: z.coerce.number().min(0).max(4).optional(),
  min_ielts: z.coerce.number().min(0).max(9).optional(),
  is_featured: z.boolean().optional().default(false),
  is_active: z.boolean().optional().default(true),
});

const adminUpdateScholarshipSchema = adminCreateScholarshipSchema.partial();

const adminUpdateUserRoleSchema = z.object({
  role: z.enum(['user', 'admin'], { message: 'Role phải là "user" hoặc "admin"' }),
});

const adminUpdateUserStatusSchema = z.object({
  isActive: z.boolean({ required_error: 'isActive là bắt buộc' }),
});

const adminUpdateScholarshipFeaturedSchema = z.object({
  isFeatured: z.boolean({ required_error: 'isFeatured là bắt buộc' }),
});

const adminUserQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  role: z.enum(['user', 'admin']).optional(),
  search: z.string().max(255).optional(),
});

export { adminCreateScholarshipSchema, adminUpdateScholarshipSchema, adminUpdateUserRoleSchema, adminUpdateUserStatusSchema, adminUpdateScholarshipFeaturedSchema, adminUserQuerySchema };