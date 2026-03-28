const { z } = require('zod');

const VALID_DOCUMENT_TYPES = ['cv', 'sop', 'transcript', 'recommendation_letter', 'other'];
const APPLICATION_STATUSES = ['draft', 'submitted', 'under_review', 'interview', 'accepted', 'rejected', 'withdrawn'];
const DEGREES = ['Bachelor', 'Master', 'PhD', 'Any'];
const LANGUAGES = ['English', 'Vietnamese', 'Korean', 'Japanese', 'Chinese', 'German', 'French', 'Spanish', 'Other'];
const COVERAGES = ['Full', 'Partial', 'Tuition', 'Stipend', 'Accommodation'];

const registerSchema = z.object({
  email: z.string().email('Email không hợp lệ').max(255),
  password: z.string().min(8, 'Mật khẩu phải có ít nhất 8 ký tự').max(128),
  full_name: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự').max(255),
});

const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(1, 'Mật khẩu không được để trống'),
});

const scholarshipQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  country: z.string().max(100).optional(),
  degree: z.string().refine((v) => !v || DEGREES.includes(v), { message: `degree phải là một trong: ${DEGREES.join(', ')}` }).optional(),
  field: z.string().max(255).optional(),
  language: z.string().refine((v) => !v || LANGUAGES.includes(v), { message: `language không hợp lệ` }).optional(),
  min_gpa: z.coerce.number().min(0).max(4).optional(),
  min_ielts: z.coerce.number().min(0).max(9).optional(),
  deadline_from: z.string().datetime().optional(),
  deadline_to: z.string().datetime().optional(),
  amount_min: z.coerce.number().min(0).optional(),
  coverage: z.string().refine((v) => !v || COVERAGES.includes(v), { message: `coverage phải là một trong: ${COVERAGES.join(', ')}` }).optional(),
  featured: z.enum(['true', 'false']).optional(),
  search: z.string().max(255).optional(),
});

const profileUpdateSchema = z.object({
  bio: z.string().max(2000).optional(),
  gpa: z.coerce.number().min(0).max(4).optional(),
  gpa_scale: z.string().max(10).optional(),
  english_level: z.string().max(50).optional(),
  target_country: z.string().max(100).optional(),
  target_major: z.string().max(255).optional(),
  target_degree: z.string().refine((v) => !v || DEGREES.includes(v), { message: `target_degree phải là một trong: ${DEGREES.join(', ')}` }).optional(),
  target_intake: z.string().max(50).optional(),
  full_name: z.string().min(2).max(255).optional(),
});

const applicationCreateSchema = z.object({
  scholarship_id: z.string().uuid('scholarship_id phải là UUID hợp lệ'),
  checklist: z.array(z.object({
    item: z.string(),
    done: z.boolean(),
    document_id: z.string().uuid().nullable().optional(),
  })).optional(),
  notes: z.string().max(5000).optional(),
});

const applicationUpdateSchema = z.object({
  status: z.string().refine((v) => !v || APPLICATION_STATUSES.includes(v), { message: `status không hợp lệ` }).optional(),
  checklist: z.array(z.object({
    item: z.string(),
    done: z.boolean(),
    document_id: z.string().uuid().nullable().optional(),
  })).optional(),
  notes: z.string().max(5000).optional(),
  documents_used: z.array(z.string().uuid()).optional(),
  result: z.string().max(5000).optional(),
});

const applicationQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  status: z.string().refine((v) => !v || APPLICATION_STATUSES.includes(v), { message: `status không hợp lệ` }).optional(),
});

const recommendSchema = z.object({
  top_n: z.coerce.number().int().min(1).max(50).optional().default(10),
});

module.exports = {
  registerSchema,
  loginSchema,
  scholarshipQuerySchema,
  profileUpdateSchema,
  applicationCreateSchema,
  applicationUpdateSchema,
  applicationQuerySchema,
  recommendSchema,
};
