import { z } from 'zod';

const notificationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional().default(30),
});

const notificationIdSchema = z.object({
  id: z.string().uuid('id thông báo không hợp lệ'),
});

export { notificationQuerySchema, notificationIdSchema };