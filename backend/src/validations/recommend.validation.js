import { z } from 'zod';

const recommendSchema = z.object({
  top_n: z.coerce.number().int().min(1).max(50).optional().default(10),
});

export { recommendSchema };