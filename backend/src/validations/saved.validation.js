import { z } from 'zod';
import { SAVED_NOTE_MAX_LENGTH } from '~/constants/saved.js';

const savedParamsSchema = z.object({
  scholarshipId: z.string().uuid('scholarshipId phải là UUID hợp lệ'),
});

const savedCreateSchema = z.object({
  note: z.string().max(SAVED_NOTE_MAX_LENGTH, `Ghi chú tối đa ${SAVED_NOTE_MAX_LENGTH} ký tự`).optional(),
});

export { savedParamsSchema, savedCreateSchema };
