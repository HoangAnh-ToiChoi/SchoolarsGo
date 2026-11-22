import { getClient } from '~/services/gemini.service.js';
import cvTextService from '~/services/cvText.service.js';
import removeContactInfo from '~/utils/removeContactInfo.js';
import withTimeout from '~/utils/withTimeout.js';
import { CV_PROMPT } from '~/constants/cvPrompt.js';
import {
  CV_AI_TIMEOUT_MS, CV_GENERATION_CONFIG, CV_TAG_OPEN, CV_TAG_CLOSE,
  CV_IELTS_NAME, CV_IELTS_MAX_SCORE, GPA_TARGET_SCALE, GPA_DECIMALS,
} from '~/constants/cv.js';
import { AppError, cv as cvErrors } from '~/constants/errors.js';
import { getGeminiModel } from '~/configs/gemini.config.js';
import { cvDraftSchema } from '~/validations/cvDraft.validation.js';

class CvExtractService {
  /** Đọc CV thành bản nháp hồ sơ. Không ghi DB: người dùng xác nhận rồi mới lưu qua PUT /profile. */
  async extract(file) {
    if (!file) throw new AppError(cvErrors.MISSING_FILE);
    const text = await cvTextService.extract(file.buffer);
    const safeText = removeContactInfo(text);
    const raw = await this.#askGemini(this.#buildPrompt(safeText));
    return this.#toDraft(this.#parseDraft(raw));
  }

  // Bỏ thẻ <cv> trong chữ CV để người viết CV không đóng thẻ sớm rồi chèn hướng dẫn
  #buildPrompt(text) {
    const withoutOpen = text.replaceAll(CV_TAG_OPEN, '');
    const content = withoutOpen.replaceAll(CV_TAG_CLOSE, '');
    return `${CV_PROMPT}\n${CV_TAG_OPEN}\n${content}\n${CV_TAG_CLOSE}`;
  }

  async #askGemini(prompt) {
    const client = getClient();
    if (!client) throw new AppError(cvErrors.AI_UNAVAILABLE);
    const model = client.getGenerativeModel({ model: getGeminiModel(), generationConfig: CV_GENERATION_CONFIG });
    const result = await withTimeout(model.generateContent(prompt), CV_AI_TIMEOUT_MS, cvErrors.AI_TIMEOUT);
    return result.response.text();
  }

  // JSON hỏng → SyntaxError, errorHandle.controller (#aiBadResponseError) đổi thành 502. Sai khuôn thì ném thẳng AppError
  #parseDraft(raw) {
    const parsed = cvDraftSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) throw new AppError(cvErrors.AI_BAD_RESPONSE);
    return parsed.data;
  }

  // GPA quy về thang 4. Lớn hơn thang ghi trong CV là sai nên bỏ.
  #toGpa4(gpa, scale = GPA_TARGET_SCALE) {
    if (gpa === undefined || gpa > scale) return undefined;
    const converted = (gpa / scale) * GPA_TARGET_SCALE;
    return Number(converted.toFixed(GPA_DECIMALS));
  }

  #hasValidScore(certificate) {
    const isIelts = certificate.type.toLowerCase() === CV_IELTS_NAME;
    return !isIelts || certificate.score <= CV_IELTS_MAX_SCORE;
  }

  #toDraft(parsed) {
    return {
      gpa: this.#toGpa4(parsed.gpa, parsed.gpa_scale),
      certificates: parsed.certificates?.filter(certificate => this.#hasValidScore(certificate)),
      current_degree: parsed.current_degree,
      major: parsed.major,
      experience: parsed.experience,
    };
  }
}

export default new CvExtractService();
