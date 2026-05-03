/**
 * DocumentService — VÙNG 2 (Controller → Service → Repository → DB)
 *
 * Lớp này CHỨA BUSINESS LOGIC, KHÔNG có SQL.
 * SQL nằm trong DocumentRepository — Service chỉ gọi repo methods.
 *
 * Storage (uploadFile, deleteFile) vẫn ở đây vì KHÔNG phải SQL.
 * Rollback logic khi DB insert thất bại cũng ở đây.
 *
 * Inject: documentRepo qua constructor
 *
 * Public methods — Controller gọi:
 *   getAll(userId)      → documents[]
 *   upload(userId, docType, file) → document record
 *   remove(userId, documentId)   → void
 */
const { uploadFile, deleteFile } = require('./storage.service');

class DocumentService {
  static VALID_TYPES = ['cv', 'sop', 'transcript', 'recommendation_letter', 'other'];

  constructor(documentRepository) {
    this.repo = documentRepository;
  }

  // ─── PUBLIC — Controller gọi ─────────────────────────────────────────────

  getAll = async (userId) => {
    return this.repo.findAllByUserId(userId);
  };

  upload = async (userId, docType, file) => {
    this.#validateType(docType);
    this.#ensureFile(file);

    const uploadResult = await this.#uploadToStorage(userId, docType, file);

    try {
      const doc = await this.repo.insertDocument({
        userId,
        docType,
        fileName: file.originalname,
        fileUrl: uploadResult.publicUrl,
        fileSize: file.size,
        mimeType: file.mimetype,
      });
      return doc;
    } catch (dbErr) {
      await deleteFile(uploadResult.storagePath);
      this.#throwError(`Lưu metadata thất bại, file đã được gỡ: ${dbErr.message}`, 500);
    }
  };

  remove = async (userId, documentId) => {
    const doc = await this.repo.findByIdAndUserId(documentId, userId);
    this.#ensureFound(doc, 'Không tìm thấy document hoặc bạn không có quyền xóa');

    if (doc.file_url) {
      const path = this.#parseStoragePath(doc.file_url);
      if (path) await deleteFile(path);
    }

    await this.repo.deleteByIdAndUserId(documentId, userId);
  };

  // ─── PRIVATE — Storage helpers ────────────────────────────────────────────

  #uploadToStorage = async (userId, docType, file) => {
    try {
      return await uploadFile(userId, docType, file.buffer, file.originalname, file.mimetype);
    } catch (err) {
      this.#throwError(`Upload file thất bại: ${err.message}`, 500);
    }
  };

  /**
   * Trích xuất storage path từ public URL
   * URL: https://xxx.supabase.co/storage/v1/object/public/documents/userId/type/file.ext
   * → documents/userId/type/file.ext
   */
  #parseStoragePath = (publicUrl) => {
    if (!publicUrl) return null;
    const match = publicUrl.match(/\/documents\/(.+)/);
    return match ? `documents/${match[1]}` : null;
  };

  // ─── PRIVATE — validation & error helpers ────────────────────────────────

  #throwError(message, statusCode = 500) {
    const err = new Error(message);
    err.statusCode = statusCode;
    err.isOperational = true;
    throw err;
  }

  #ensureFound(item, message) {
    if (!item) this.#throwError(message, 404);
  }

  #validateType(docType) {
    if (!DocumentService.VALID_TYPES.includes(docType)) {
      this.#throwError(
        `Loại document không hợp lệ. Chỉ chấp nhận: ${DocumentService.VALID_TYPES.join(', ')}`,
        400
      );
    }
  }

  #ensureFile(file) {
    if (!file) this.#throwError('Không có file được upload', 400);
  }
}

module.exports = DocumentService;
