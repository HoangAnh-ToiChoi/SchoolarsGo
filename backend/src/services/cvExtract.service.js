import AppError from '~/utils/AppError.js';
import { getClient } from '~/services/gemini.service.js';
import cvTextService from '~/services/cvText.service.js';
import removeContactInfo from '~/utils/removeContactInfo.js';
import withTimeout from '~/utils/withTimeout.js';
import { CV_PROMPT } from '~/constants/cvPrompt.js';
import { cvDraftSchema } from '~/validations/cvDraft.validation.js';

const AI_TIMEOUT_MS = 20000;
const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-flash-lite-latest';
const GENERATION_CONFIG = { responseMimeType: 'application/json', temperature: 0 };

// Bỏ thẻ <cv> trong chữ CV để người viết CV không đóng thẻ sớm rồi chèn hướng dẫn
function buildPrompt(text) {
  const withoutOpen = text.replaceAll('<cv>', '');
  const content = withoutOpen.replaceAll('</cv>', '');
  return `${CV_PROMPT}\n<cv>\n${content}\n</cv>`;
}

async function askGemini(prompt) {
  const client = getClient();
  if (!client) throw new AppError('Dịch vụ AI chưa sẵn sàng', 503, 'AI_UNAVAILABLE');
  const model = client.getGenerativeModel({ model: MODEL_NAME, generationConfig: GENERATION_CONFIG });
  try {
    const result = await withTimeout(model.generateContent(prompt), AI_TIMEOUT_MS, 'AI_TIMEOUT');
    return result.response.text();
  } catch (error) {
    if (error.statusCode) throw error;
    throw new AppError('AI không phản hồi', 502, 'AI_FAILED');
  }
}

function parseDraft(raw) {
  try {
    return cvDraftSchema.parse(JSON.parse(raw));
  } catch {
    throw new AppError('AI trả về dữ liệu không đọc được', 502, 'AI_BAD_RESPONSE');
  }
}

// GPA quy về thang 4. Lớn hơn thang ghi trong CV là sai nên bỏ.
function toGpa4(gpa, scale = 4) {
  if (gpa === undefined || gpa > scale) return undefined;
  const converted = (gpa / scale) * 4;
  return Number(converted.toFixed(2));
}

function hasValidScore(certificate) {
  const isIelts = certificate.type.toLowerCase() === 'ielts';
  return !isIelts || certificate.score <= 9;
}

function toDraft(parsed) {
  return {
    gpa: toGpa4(parsed.gpa, parsed.gpa_scale),
    certificates: parsed.certificates?.filter(hasValidScore),
    current_degree: parsed.current_degree,
    major: parsed.major,
    experience: parsed.experience,
  };
}

class CvExtractService {
  /** Đọc CV thành bản nháp hồ sơ. Không ghi DB: người dùng xác nhận rồi mới lưu qua PUT /profile. */
  async extract(file) {
    if (!file) throw AppError.badRequest('Thiếu file CV', 'CV_MISSING_FILE');
    const text = await cvTextService.extract(file.buffer);
    const safeText = removeContactInfo(text);
    const raw = await askGemini(buildPrompt(safeText));
    return toDraft(parseDraft(raw));
  }
}

export default new CvExtractService();
