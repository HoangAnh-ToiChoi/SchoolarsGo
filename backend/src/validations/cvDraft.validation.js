import { z } from 'zod';

const DEGREES = ['Bachelor', 'Master', 'PhD'];

const certificateSchema = z.object({
  type: z.string().min(1).max(20),
  score: z.number().min(0).max(120),
});

// Trường nào AI trả sai thì chỉ bỏ riêng trường đó (catch), không làm hỏng cả bản nháp
const cvDraftSchema = z.object({
  gpa: z.number().min(0).optional().catch(undefined),
  gpa_scale: z.number().positive().optional().catch(undefined),
  certificates: z.array(certificateSchema).max(10).optional().catch(undefined),
  current_degree: z.enum(DEGREES).optional().catch(undefined),
  major: z.string().max(100).optional().catch(undefined),
  experience: z.string().max(2000).optional().catch(undefined),
});

export { cvDraftSchema };
