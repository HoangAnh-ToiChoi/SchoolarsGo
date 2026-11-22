import { fileTypeFromBuffer } from 'file-type';
import { extractText, getDocumentProxy } from 'unpdf';
import mammoth from 'mammoth';

import withTimeout from '~/utils/withTimeout.js';
import {
  CV_MIME,
  CV_READ_TIMEOUT_MS,
  CV_MIN_TEXT_LENGTH,
  CV_MAX_TEXT_LENGTH,
} from '~/constants/cv.js';
import { AppError, cv as cvErrors } from '~/constants/errors.js';

class CvTextService {
  async extract(buffer) {
    const kind = await this.#detectKind(buffer);
    const text = await withTimeout(
      this.#readText(kind, buffer),
      CV_READ_TIMEOUT_MS,
      cvErrors.READ_TIMEOUT
    );
    return this.#clean(text);
  }

  // Loại file thật đọc từ byte đầu, không tin đuôi file hay MIME do client gửi
  async #detectKind(buffer) {
    const type = await fileTypeFromBuffer(buffer);
    if (type?.mime === CV_MIME.PDF) return 'pdf';
    if (type?.mime === CV_MIME.DOCX) return 'docx';
    throw new AppError(cvErrors.INVALID_FILE);
  }

  async #readPdf(buffer) {
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const result = await extractText(pdf, { mergePages: true });
    return result.text;
  }

  async #readDocx(buffer) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  // File hỏng: thư viện ném lỗi, errorHandle.controller (#cvFileError) đổi thành 400
  async #readText(kind, buffer) {
    if (kind === 'pdf') return this.#readPdf(buffer);
    return this.#readDocx(buffer);
  }

  // Không lấy được chữ nghĩa là CV dạng ảnh scan (dự án không dùng OCR)
  #clean(text) {
    const trimmed = text.trim();
    if (trimmed.length < CV_MIN_TEXT_LENGTH) throw new AppError(cvErrors.SCANNED);
    return trimmed.slice(0, CV_MAX_TEXT_LENGTH);
  }
}

export default new CvTextService();
