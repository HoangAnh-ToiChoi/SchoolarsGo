import { z } from 'zod';
import {
  CV_DEGREES, CV_MAX_CERTIFICATES, CV_CERTIFICATE_TYPE_MAX, CV_CERTIFICATE_SCORE_MAX, CV_CERTIFICATE_LEVEL_MAX,
  CV_BIRTH_YEAR_MIN, CV_BIRTH_YEAR_MAX, CV_MAJOR_MAX, CV_EXPERIENCE_MAX,
} from '~/constants/cv.js';

const hasScoreOrLevel = certificate => certificate.score !== undefined || certificate.level !== undefined;

// Chứng chỉ có điểm (IELTS 7.0) hoặc chỉ có mức (CEFR B1); cần ít nhất một trong hai
const certificateSchema = z.object({
  type: z.string().min(1).max(CV_CERTIFICATE_TYPE_MAX),
  score: z.number().min(0).max(CV_CERTIFICATE_SCORE_MAX).optional(),
  level: z.string().min(1).max(CV_CERTIFICATE_LEVEL_MAX).optional(),
}).refine(hasScoreOrLevel);

// Trường nào AI trả sai thì chỉ bỏ riêng trường đó (catch), không làm hỏng cả bản nháp
const cvDraftSchema = z.object({
  gpa: z.number().min(0).optional().catch(undefined),
  gpa_scale: z.number().positive().optional().catch(undefined),
  certificates: z.array(certificateSchema).max(CV_MAX_CERTIFICATES).optional().catch(undefined),
  current_degree: z.enum(CV_DEGREES).optional().catch(undefined),
  birth_year: z.number().int().min(CV_BIRTH_YEAR_MIN).max(CV_BIRTH_YEAR_MAX).optional().catch(undefined),
  major: z.string().max(CV_MAJOR_MAX).optional().catch(undefined),
  experience: z.string().max(CV_EXPERIENCE_MAX).optional().catch(undefined),
});

export { cvDraftSchema };
