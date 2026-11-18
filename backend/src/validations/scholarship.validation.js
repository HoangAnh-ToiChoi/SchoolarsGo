const { z } = require('zod');

const DEGREES = ['Bachelor', 'Master', 'PhD', 'Any'];

const LANGUAGES = [
  'English',
  'Vietnamese',
  'Korean',
  'Japanese',
  'Chinese',
  'German',
  'French',
  'Spanish',
  'Other',
];

const COVERAGES = ['Full', 'Partial', 'Tuition', 'Stipend', 'Accommodation'];

const scholarshipQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  country: z.string().max(100).optional(),
  scope: z.enum(['domestic', 'international']).optional(),
  degree: z
    .string()
    .refine(v => !v || DEGREES.includes(v), {
      message: `degree phải là một trong: ${DEGREES.join(', ')}`,
    })
    .optional(),
  field: z.string().max(255).optional(),
  language: z
    .string()
    .refine(v => !v || LANGUAGES.includes(v), { message: `language không hợp lệ` })
    .optional(),
  min_gpa: z.coerce.number().min(0).max(4).optional(),
  min_ielts: z.coerce.number().min(0).max(9).optional(),
  deadline_from: z.string().datetime().optional(),
  deadline_to: z.string().datetime().optional(),
  amount_min: z.coerce.number().min(0).optional(),
  coverage: z
    .string()
    .refine(v => !v || COVERAGES.includes(v), {
      message: `coverage phải là một trong: ${COVERAGES.join(', ')}`,
    })
    .optional(),
  featured: z.enum(['true', 'false']).optional(),
  search: z.string().max(255).optional(),
});

module.exports = {
  scholarshipQuerySchema,
  DEGREES,
};
