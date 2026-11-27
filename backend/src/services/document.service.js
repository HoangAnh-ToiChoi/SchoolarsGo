import crypto from 'node:crypto';
import { fileTypeFromBuffer } from 'file-type';
import { AppError, document as documentErrors } from '~/constants/errors.js';
import documentModel from '~/models/document.model.js';
import documentStorageModel from '~/models/documentStorage.model.js';
import {
  DOCUMENT_VALID_TYPES,
  DOCUMENT_ALLOWED_MIME_BY_TYPE,
  DOCUMENT_DETECTED_MIME_ALIAS,
  DOCUMENT_PUBLIC_URL_PATH,
} from '~/constants/document.js';

class DocumentService {
  #guardFound(item) {
    if (!item) throw new AppError(documentErrors.NOT_FOUND);
  }

  #validateType(docType) {
    if (!DOCUMENT_VALID_TYPES.includes(docType))
      throw new AppError(documentErrors.INVALID_TYPE);
  }

  #ensureFile(file) {
    if (!file) throw new AppError(documentErrors.NO_FILE);
  }

  // Loại file thật đọc từ byte đầu, không tin đuôi file hay MIME client gửi (HTML đổi đuôi .pdf là XSS khi mở link)
  async #detectMime(docType, buffer) {
    const detected = await fileTypeFromBuffer(buffer);
    const mime = DOCUMENT_DETECTED_MIME_ALIAS[detected?.mime] ?? detected?.mime;
    const allowed = DOCUMENT_ALLOWED_MIME_BY_TYPE[docType];
    if (!allowed.includes(mime)) throw new AppError(documentErrors.CONTENT_MISMATCH);
    return mime;
  }

  /**
   * Chuẩn hóa tên file trước khi lên Storage: bỏ dấu tiếng Việt, chỉ giữ chữ Latin/số/gạch ngang, tối đa 200 ký tự.
   * "[CMP376] Giáo trình HP (1).pdf" → "cmp376-giao-trinh-hp-1.pdf"
   */
  #slugifyFileName(fileName) {
    const lastDot = fileName.lastIndexOf('.');
    const hasExtension = lastDot > 0 && lastDot < fileName.length - 1;
    const ext = hasExtension ? fileName.slice(lastDot + 1).toLowerCase() : '';
    const body = hasExtension ? fileName.slice(0, lastDot) : fileName;
    // NFD tách dấu khỏi chữ: "Giáo" → "Giao"; riêng "đ" không tách được nên đổi tay
    const unaccented = body.normalize('NFD').replace(/[̀-ͯ]/g, '');
    const normalized = unaccented.replace(/đ/g, 'd').replace(/Đ/g, 'D');
    const sanitized = normalized.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
    const collapsed = sanitized.replace(/-+/g, '-').replace(/^-+|-+$/g, '');
    // Cắt ngắn để đường dẫn không vượt giới hạn 1024 byte của Supabase
    const base = collapsed.slice(0, 200) || 'file';
    return { base, ext: ext.replace(/[^a-z0-9]/g, '') };
  }

  // {user_id}/{type}/{tên}_{8 ký tự ngẫu nhiên}.{đuôi}: không trùng, không thoát khỏi thư mục của người dùng
  #buildStoragePath(userId, docType, originalName) {
    const { base, ext } = this.#slugifyFileName(originalName);
    const suffix = crypto.randomUUID().slice(0, 8);
    const fileName = ext ? `${base}_${suffix}.${ext}` : `${base}_${suffix}`;
    return `${userId}/${docType}/${fileName}`;
  }

  // Bản ghi trước migration 013 chỉ có URL công khai: lấy phần sau "/object/public/documents/" (không kèm tên bucket)
  #storagePathOf(doc) {
    if (doc.storage_path) return doc.storage_path;
    const match = doc.file_url?.match(DOCUMENT_PUBLIC_URL_PATH);
    return match ? match[1] : null;
  }

  // Bucket private: trả file_url là link ký có hạn để FE giữ nguyên cách mở / tải file
  async #withSignedUrls(docs) {
    const paths = docs.map((doc) => this.#storagePathOf(doc)).filter(Boolean);
    const urls = paths.length ? await documentStorageModel.createSignedUrls(paths) : new Map();
    return docs.map((doc) => this.#toResponse(doc, urls));
  }

  #toResponse(doc, urls) {
    const { storage_path: _storagePath, file_url: _publicUrl, ...rest } = doc;
    const path = this.#storagePathOf(doc);
    return { ...rest, file_url: urls.get(path) ?? null };
  }

  // Lưu DB lỗi thì gỡ file vừa đưa lên; gỡ cũng lỗi thì chỉ ghi log, vẫn báo lỗi lưu DB cho người dùng
  async #rollbackUpload(storagePath) {
    try {
      await documentStorageModel.remove(storagePath);
    } catch (err) {
      console.warn(`[Storage] Không gỡ được file ${storagePath}:`, err.message);
    }
  }

  async getAll(userId) {
    const docs = await documentModel.findAllByUserId(userId);
    return this.#withSignedUrls(docs);
  }

  async upload(userId, docType, file) {
    this.#validateType(docType);
    this.#ensureFile(file);
    const mimeType = await this.#detectMime(docType, file.buffer);
    const targetPath = this.#buildStoragePath(userId, docType, file.originalname);
    const storagePath = await documentStorageModel.upload(targetPath, file.buffer, mimeType);

    let doc;
    try {
      doc = await documentModel.insertDocument({
        userId,
        docType,
        fileName: file.originalname,
        storagePath,
        fileSize: file.size,
        mimeType,
      });
    } catch (dbErr) {
      await this.#rollbackUpload(storagePath);
      throw new AppError(documentErrors.insertFailed(dbErr.message));
    }
    const [signed] = await this.#withSignedUrls([doc]);
    return signed;
  }

  // Xóa file trước: Storage lỗi thì bản ghi còn lại để người dùng xóa lại, không để file mồ côi
  async remove(userId, documentId) {
    const doc = await documentModel.findByIdAndUserId(documentId, userId);
    this.#guardFound(doc);

    const path = this.#storagePathOf(doc);
    if (path) await documentStorageModel.remove(path);

    await documentModel.deleteByIdAndUserId(documentId, userId);
  }
}

export default new DocumentService();
