import { z } from 'zod';

const APPLICATION_STATUSES = [
  'draft',
  'submitted',
  'under_review',
  'interview',
  'accepted',
  'rejected',
  'withdrawn',
];

const applicationCreateSchema = z.object({
  scholarship_id: z.string().uuid('scholarship_id phải là UUID hợp lệ'),
  checklist: z
    .array(
      z.object({
        item: z.string(),
        done: z.boolean(),
        document_id: z.string().uuid().nullable().optional(),
      })
    )
    .optional(),
  notes: z.string().max(5000).optional(),
});

const applicationUpdateSchema = z.object({
  status: z
    .string()
    .refine(v => !v || APPLICATION_STATUSES.includes(v), { message: `status không hợp lệ` })
    .optional(),
  checklist: z
    .array(
      z.object({
        item: z.string(),
        done: z.boolean(),
        document_id: z.string().uuid().nullable().optional(),
      })
    )
    .optional(),
  notes: z.string().max(5000).optional(),
  documents_used: z.array(z.string().uuid()).optional(),
  result: z.string().max(5000).optional(),
});

const applicationQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  status: z
    .string()
    .refine(v => !v || APPLICATION_STATUSES.includes(v), { message: `status không hợp lệ` })
    .optional(),
});

export { applicationCreateSchema, applicationUpdateSchema, applicationQuerySchema };