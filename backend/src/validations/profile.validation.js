import { z } from 'zod';
import { DEGREES } from './scholarship.validation.js';

const profileUpdateSchema = z.object({
  bio: z.string().max(2000).optional(),
  gpa: z.coerce.number().min(0).max(4).optional(),
  gpa_scale: z.string().max(10).optional(),
  english_level: z.string().max(50).optional(),
  target_country: z.string().max(100).optional(),
  target_major: z.string().max(255).optional(),
  target_degree: z
    .string()
    .refine(v => !v || DEGREES.includes(v), {
      message: `target_degree phải là một trong: ${DEGREES.join(', ')}`,
    })
    .optional(),
  target_intake: z.string().max(50).optional(),
  full_name: z.string().min(2).max(255).optional(),
});

export { profileUpdateSchema };