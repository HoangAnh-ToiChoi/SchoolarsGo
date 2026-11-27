import { z } from 'zod';
import { DEGREES } from './scholarship.validation.js';
import {
  PROFILE_CURRENT_DEGREES, PROFILE_MAJOR_MAX, PROFILE_EXPERIENCE_MAX,
  PROFILE_BIRTH_YEAR_MIN, PROFILE_BIRTH_YEAR_MAX, PROFILE_NATIONALITY_PATTERN,
  PROFILE_MAX_CERTIFICATES, PROFILE_CERTIFICATE_TYPE_MAX, PROFILE_CERTIFICATE_LEVEL_MAX, PROFILE_CERTIFICATE_SCORE_MAX,
  PROFILE_IELTS_NAME, PROFILE_IELTS_MAX_SCORE, PROFILE_GPA_SCALES, PROFILE_GPA_MAX_INPUT,
} from '~/constants/profile.js';

const toUpperCase = value => value.toUpperCase();

const hasScoreOrLevel = certificate => certificate.score !== undefined || certificate.level !== undefined;

// IELTS luôn phải có điểm từ 0 đến 9; chứng chỉ khác chỉ cần có điểm hoặc mức
function hasValidIeltsScore(certificate) {
  const isIelts = certificate.type.toLowerCase() === PROFILE_IELTS_NAME;
  if (!isIelts) return true;
  if (certificate.score === undefined) return false;
  return certificate.score <= PROFILE_IELTS_MAX_SCORE;
}

// Chứng chỉ có điểm ({ IELTS, 7.0 }) hoặc chỉ có mức ({ CEFR, B1 })
const certificateSchema = z.object({
  type: z.string().min(1).max(PROFILE_CERTIFICATE_TYPE_MAX),
  score: z.number().min(0).max(PROFILE_CERTIFICATE_SCORE_MAX).optional(),
  level: z.string().min(1).max(PROFILE_CERTIFICATE_LEVEL_MAX).optional(),
})
  .refine(hasScoreOrLevel, { message: 'Chứng chỉ cần có điểm hoặc mức' })
  .refine(hasValidIeltsScore, { message: `IELTS phải có điểm từ 0 đến ${PROFILE_IELTS_MAX_SCORE}` });

const profileUpdateSchema = z.object({
  bio: z.string().max(2000).optional(),
  gpa: z.coerce.number().min(0).max(PROFILE_GPA_MAX_INPUT).optional(),
  // Form cũ gửi "4.0" (chuỗi); thang khác 4 / 5 / 10 thì từ chối
  gpa_scale: z.coerce
    .number()
    .refine(v => PROFILE_GPA_SCALES.includes(v), { message: `gpa_scale phải là một trong: ${PROFILE_GPA_SCALES.join(', ')}` })
    .optional(),
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
  current_degree: z.enum(PROFILE_CURRENT_DEGREES).optional(),
  major: z.string().max(PROFILE_MAJOR_MAX).optional(),
  nationality: z.string().regex(PROFILE_NATIONALITY_PATTERN, 'nationality là mã quốc gia 2 chữ cái, ví dụ VN').transform(toUpperCase).optional(),
  birth_year: z.coerce.number().int().min(PROFILE_BIRTH_YEAR_MIN).max(PROFILE_BIRTH_YEAR_MAX).optional(),
  experience: z.string().max(PROFILE_EXPERIENCE_MAX).optional(),
  certificates: z.array(certificateSchema).max(PROFILE_MAX_CERTIFICATES).optional(),
});

export { profileUpdateSchema };
