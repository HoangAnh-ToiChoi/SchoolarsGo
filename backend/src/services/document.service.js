const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

class DocumentService {
  #repo;
  #eventBus;
  #storage;

  static #VALID_TYPES = ['cv', 'sop', 'transcript', 'recommendation_letter', 'other'];

  constructor(documentRepository, eventBus, storageService) {
    this.#repo = documentRepository;
    this.#eventBus = eventBus;
    this.#storage = storageService;
  }

  #guardFound(item, message = 'Không tìm thấy document hoặc bạn không có quyền xóa') {
    if (!item) throw new AppError(message, 404, 'DOCUMENT_NOT_FOUND');
  }

  #validateType(docType) {
    if (!DocumentService.#VALID_TYPES.includes(docType))
      throw new AppError(
        `Loại document không hợp lệ. Chỉ chấp nhận: ${DocumentService.#VALID_TYPES.join(', ')}`,
        400,
        'INVALID_DOC_TYPE'
      );
  }

  #ensureFile(file) {
    if (!file) throw new AppError('Không có file được upload', 400, 'NO_FILE');
  }

  #parseStoragePath(publicUrl) {
    if (!publicUrl) return null;
    if (!String(publicUrl).startsWith('http')) {
      return String(publicUrl).replace(/^documents\//, '');
    }
    const match = publicUrl.match(/\/documents\/(.+)/);
    return match ? match[1] : null;
  }

  async #uploadToStorage(userId, docType, file) {
    try {
      return await this.#storage.uploadFile(
        userId,
        docType,
        file.buffer,
        file.originalname,
        file.mimetype
      );
    } catch (err) {
      throw new AppError(`Upload file thất bại: ${err.message}`, 500, 'UPLOAD_FAILED');
    }
  }

  getAll = async userId => {
    const documents = await this.#repo.findAllByUserId(userId);
    return Promise.all(documents.map(async (doc) => {
      const storagePath = this.#parseStoragePath(doc.file_url);
      const url = storagePath
        ? await this.#storage.createSignedUrl(storagePath)
        : null;
      return {
        ...doc,
        storage_path: storagePath,
        url,
      };
    }));
  };

  upload = async (userId, docType, file) => {
    this.#validateType(docType);
    this.#ensureFile(file);

    const uploadResult = await this.#uploadToStorage(userId, docType, file);

    try {
      const doc = await this.#repo.insertDocument({
        userId,
        docType,
        fileName: file.originalname,
        fileUrl: uploadResult.storagePath,
        fileSize: file.size,
        mimeType: file.mimetype,
      });

      try {
        this.#eventBus.emit('document.uploaded', {
          userId,
          documentId: doc.id,
          docType,
          fileSize: file.size,
          fileName: file.originalname,
        });
      } catch (emitErr) {
        logger.error({ err: emitErr, documentId: doc.id, userId }, 'Failed to emit document.uploaded');
      }

      return {
        ...doc,
        storage_path: uploadResult.storagePath,
        url: await this.#storage.createSignedUrl(uploadResult.storagePath),
      };
    } catch (dbErr) {
      await this.#storage.deleteFile(uploadResult.storagePath);
      throw new AppError(`Lưu metadata thất bại, file đã được gỡ: ${dbErr.message}`, 500, 'DB_INSERT_FAILED');
    }
  };

  remove = async (userId, documentId) => {
    const doc = await this.#repo.findByIdAndUserId(documentId, userId);
    this.#guardFound(doc);

    if (doc.file_url) {
      const path = this.#parseStoragePath(doc.file_url);
      if (path) await this.#storage.deleteFile(path);
    }

    await this.#repo.deleteByIdAndUserId(documentId, userId);

    try {
      this.#eventBus.emit('document.deleted', {
        userId,
        documentId,
        fileSize: doc.file_size,
      });
    } catch (emitErr) {
      logger.error({ err: emitErr, documentId, userId }, 'Failed to emit document.deleted');
    }
  };
}

module.exports = DocumentService;
