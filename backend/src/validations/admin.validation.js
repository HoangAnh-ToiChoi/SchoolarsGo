import { z } from 'zod';
import { DEGREES } from './scholarship.validation.js';

// Cột amount DECIMAL(12,2)
const MAX_AMOUNT = 9999999999.99;
const MAX_LONG_TEXT = 5000;

const NUMERIC_TEXT = /^\d+(\.\d+)?$/;

// Chỉ nhận số hoặc chuỗi số (coerce sẽ đổi false, [], "  " thành 0). Chuỗi rỗng là "không gửi", null là xóa giá trị
const emptyToUndefined = (value) => (value === '' ? undefined : value);
const toNumber = (value) => (typeof value === 'string' && NUMERIC_TEXT.test(value.trim()) ? Number(value.trim()) : value);
const parseAmount = (value) => toNumber(emptyToUndefined(value));
const amountField = z.preprocess(parseAmount, z.number().min(0).max(MAX_AMOUNT).nullable().optional());
// Ô ngày của trình duyệt gửi YYYY-MM-DD (đã là ngày lịch); client khác gửi ISO có giờ
const deadlineField = z
  .union([z.iso.date(), z.iso.datetime()], { message: 'deadline phải là YYYY-MM-DD hoặc ISO 8601' })
  .nullable()
  .optional();

// Trường chung của tạo và sửa học bổng, KHÔNG có giá trị mặc định: zod 4 áp default cả trong .partial(),
// nên PATCH chỉ đổi tiêu đề sẽ ghi is_featured = false (gỡ nổi bật) nếu default nằm ở đây
const scholarshipFields = z.object({
  title: z.string().min(1, 'Tiêu đề không được để trống').max(500),
  provider: z.string().min(1, 'Tổ chức cấp học bổng không được để trống').max(255),
  country: z.string().max(100).optional(),
  degree: z.enum(DEGREES, { message: `degree phải là một trong: ${DEGREES.join(', ')}` }).optional(),
  field_of_study: z.string().max(255).optional(),
  amount: amountField,
  deadline: deadlineField,
  language: z.string().max(50).optional(),
  coverage: z.string().max(255).optional(),
  summary: z.string().max(MAX_LONG_TEXT).optional(),
  requirements: z.string().max(MAX_LONG_TEXT).optional(),
  min_gpa: z.coerce.number().min(0).max(4).optional(),
  min_ielts: z.coerce.number().min(0).max(9).optional(),
  is_featured: z.boolean().optional(),
  is_active: z.boolean().optional(),
});

// country, degree NOT NULL trong DB: thiếu thì báo 400 ở đây thay vì để Postgres ném lỗi 500
const adminCreateScholarshipSchema = scholarshipFields.extend({
  country: z.string().min(1, 'Quốc gia không được để trống').max(100),
  degree: z.enum(DEGREES, { message: `degree phải là một trong: ${DEGREES.join(', ')}` }),
  is_featured: z.boolean().optional().default(false),
  is_active: z.boolean().optional().default(true),
});

// Trường "không gửi" vẫn còn khóa với giá trị undefined: để nguyên thì SQL ghi NULL vào cột đó
const dropUndefined = (data) => Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));

// Body rỗng (hoặc chỉ có trường lạ, zod bỏ đi) thì SQL thành "SET , updated_at" → 500: chặn bằng 400
const adminUpdateScholarshipSchema = scholarshipFields
  .partial()
  .transform(dropUndefined)
  .refine((data) => Object.keys(data).length > 0, { message: 'Cần ít nhất một trường để cập nhật' });

const adminUpdateUserRoleSchema = z.object({
  role: z.enum(['user', 'admin'], { message: 'Role phải là "user" hoặc "admin"' }),
});

const adminUpdateUserStatusSchema = z.object({
  isActive: z.boolean({ message: 'isActive là bắt buộc' }),
});

const adminUpdateScholarshipFeaturedSchema = z.object({
  isFeatured: z.boolean({ message: 'isFeatured là bắt buộc' }),
});

const adminUserQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  role: z.enum(['user', 'admin']).optional(),
  // Thiếu ở schema thì validate bỏ đi, bộ lọc trạng thái trên trang admin không có tác dụng
  status: z.enum(['active', 'inactive']).optional(),
  search: z.string().max(255).optional(),
});

export { adminCreateScholarshipSchema, adminUpdateScholarshipSchema, adminUpdateUserRoleSchema, adminUpdateUserStatusSchema, adminUpdateScholarshipFeaturedSchema, adminUserQuerySchema };