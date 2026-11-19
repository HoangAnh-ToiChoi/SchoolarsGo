import AppError from '~/utils/AppError.js';
import documentModel from '~/models/document.model.js';
import * as storage from './storage.service.js';

class DocumentService {
  static #VALID_TYPES = ['cv', 'sop', 'transcript', 'recommendation_letter', 'other'];

  #guardFound(item, message = 'Không tìm thấy document hoặc bạn không có quyền xóa') {
    if (!item) throw AppError.notFound(message, 'DOCUMENT_NOT_FOUND');
  }

  #validateType(docType) {
    if (!DocumentService.#VALID_TYPES.includes(docType))
      throw AppError.badRequest(
        `Loại document không hợp lệ. Chỉ chấp nhận: ${DocumentService.#VALID_TYPES.join(', ')}`,
        'INVALID_DOC_TYPE'
      );
  }

  #ensureFile(file) {
    if (!file) throw AppError.badRequest('Không có file được upload', 'NO_FILE');
  }

  #parseStoragePath(publicUrl) {
    if (!publicUrl) return null;
    const match = publicUrl.match(/\/documents\/(.+)/);
    return match ? `documents/${match[1]}` : null;
  }

  async #uploadToStorage(userId, docType, file) {
    try {
      return await storage.uploadFile(
        userId,
        docType,
        file.buffer,
        file.originalname,
        file.mimetype
      );
    } catch (err) {
      throw AppError.internal(`Upload file thất bại: ${err.message}`, 'UPLOAD_FAILED');
    }
  }

  async getAll(userId) {
    return documentModel.findAllByUserId(userId);
  }

  async upload(userId, docType, file) {
    this.#validateType(docType);
    this.#ensureFile(file);

    const uploadResult = await this.#uploadToStorage(userId, docType, file);

    try {
      const doc = await documentModel.insertDocument({
        userId,
        docType,
        fileName: file.originalname,
        fileUrl: uploadResult.publicUrl,
        fileSize: file.size,
        mimeType: file.mimetype,
      });

      return doc;
    } catch (dbErr) {
      await storage.deleteFile(uploadResult.storagePath);
      throw AppError.internal(`Lưu metadata thất bại, file đã được gỡ: ${dbErr.message}`, 'DB_INSERT_FAILED');
    }
  }

  async remove(userId, documentId) {
    const doc = await documentModel.findByIdAndUserId(documentId, userId);
    this.#guardFound(doc);

    if (doc.file_url) {
      const path = this.#parseStoragePath(doc.file_url);
      if (path) await storage.deleteFile(path);
    }

    await documentModel.deleteByIdAndUserId(documentId, userId);
  }
}

export default new DocumentService();