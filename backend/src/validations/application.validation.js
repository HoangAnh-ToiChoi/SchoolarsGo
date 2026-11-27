import { z } from 'zod';
import {
  APPLICATION_STATUSES,
  APPLICATION_CHECKLIST_MAX_ITEMS,
  APPLICATION_CHECKLIST_ITEM_MAX_LENGTH,
  APPLICATION_NOTES_MAX_LENGTH,
  APPLICATION_DOCUMENTS_USED_MAX,
} from '~/constants/application.js';

const checklistSchema = z
  .array(
    z.object({
      item: z.string().max(APPLICATION_CHECKLIST_ITEM_MAX_LENGTH),
      done: z.boolean(),
      document_id: z.string().uuid().nullable().optional(),
    })
  )
  .max(APPLICATION_CHECKLIST_MAX_ITEMS, `Checklist tối đa ${APPLICATION_CHECKLIST_MAX_ITEMS} mục`);

const statusSchema = z
  .string()
  .refine(v => !v || APPLICATION_STATUSES.includes(v), { message: `status không hợp lệ` });

const applicationCreateSchema = z.object({
  scholarship_id: z.string().uuid('scholarship_id phải là UUID hợp lệ'),
  checklist: checklistSchema.optional(),
  notes: z.string().max(APPLICATION_NOTES_MAX_LENGTH).optional(),
});

const applicationUpdateSchema = z.object({
  status: statusSchema.optional(),
  checklist: checklistSchema.optional(),
  notes: z.string().max(APPLICATION_NOTES_MAX_LENGTH).optional(),
  documents_used: z.array(z.string().uuid()).max(APPLICATION_DOCUMENTS_USED_MAX).optional(),
  result: z.string().max(APPLICATION_NOTES_MAX_LENGTH).optional(),
});

const applicationQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  status: statusSchema.optional(),
});

export { applicationCreateSchema, applicationUpdateSchema, applicationQuerySchema };
