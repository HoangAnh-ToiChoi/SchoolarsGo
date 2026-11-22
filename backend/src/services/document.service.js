import { AppError, document as documentErrors } from '~/constants/errors.js';
import documentModel from '~/models/document.model.js';
import * as storage from './storage.service.js';
import { DOCUMENT_VALID_TYPES } from '~/constants/document.js';

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
      throw new AppError(documentErrors.uploadFailed(err.message));
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
      throw new AppError(documentErrors.insertFailed(dbErr.message));
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