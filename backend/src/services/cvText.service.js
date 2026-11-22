import { fileTypeFromBuffer } from 'file-type';
import { extractText, getDocumentProxy } from 'unpdf';
import mammoth from 'mammoth';
import AppError from '~/utils/AppError.js';
import withTimeout from '~/utils/withTimeout.js';

const PDF_MIME = 'application/pdf';
const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const READ_TIMEOUT_MS = 10000;
const MIN_TEXT_LENGTH = 50;
const MAX_TEXT_LENGTH = 20000;

// Loại file thật đọc từ byte đầu, không tin đuôi file hay MIME do client gửi
async function detectKind(buffer) {
  const type = await fileTypeFromBuffer(buffer);
  if (type?.mime === PDF_MIME) return 'pdf';
  if (type?.mime === DOCX_MIME) return 'docx';
  throw AppError.badRequest('File không phải PDF hoặc DOCX hợp lệ', 'CV_INVALID_FILE');
}

async function readPdf(buffer) {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const result = await extractText(pdf, { mergePages: true });
  return result.text;
}

async function readDocx(buffer) {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

// File hỏng làm thư viện ném lỗi lạ: đổi thành lỗi 400 rõ ràng
async function readText(kind, buffer) {
  try {
    if (kind === 'pdf') return await readPdf(buffer);
    return await readDocx(buffer);
  } catch {
    throw AppError.badRequest('Không đọc được nội dung file', 'CV_INVALID_FILE');
  }
}

class CvTextService {
  async extract(buffer) {
    const kind = await detectKind(buffer);
    const text = await withTimeout(readText(kind, buffer), READ_TIMEOUT_MS, 'CV_READ_TIMEOUT');
    return this.#clean(text);
  }

  // Không lấy được chữ nghĩa là CV dạng ảnh scan (dự án không dùng OCR)
  #clean(text) {
    const trimmed = text.trim();
    if (trimmed.length < MIN_TEXT_LENGTH) throw new AppError('CV dạng ảnh scan, không đọc được chữ', 422, 'CV_SCANNED');
    return trimmed.slice(0, MAX_TEXT_LENGTH);
  }
}

export default new CvTextService();
