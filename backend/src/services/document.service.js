/**
 * Document Service — quản lý documents (upload lên Supabase Storage + metadata vào DB)
 *
 * Luồng xử lý Upload:
 *  1. Validate type field (đã done ở upload middleware)
 *  2. Upload file lên Supabase Storage (storage.service.js)
 *  3. INSERT metadata vào DB (documents table)
 *  4. Rollback: Nếu bước 3 thất bại → xóa file vừa upload trên Storage
 *     (ngăn orphaned files — file đã up Storage nhưng chưa ghi DB)
 *
 * Luồng xử lý Delete:
 *  1. SELECT * FROM documents WHERE id = $1 AND user_id = $2 (đảm bảo ownership)
 *  2. Xóa file vật lý trên Supabase Storage
 *  3. DELETE record trong DB
 *
 * Lưu ý bảo mật:
 *  - Luôn dùng AND user_id = $2 trong mọi WHERE để tránh sửa/xóa nhầm file người khác
 */

const { query, queryOne } = require('../utils/db');
const { uploadFile, deleteFile } = require('./storage.service');

// Các loại document được phép
const VALID_TYPES = ['cv', 'sop', 'transcript', 'recommendation_letter', 'other'];

/**
 * Lấy danh sách documents của user
 * @param {string} userId
 * @returns {Promise<any[]>}
 */
const getAll = async (userId) => {
  const data = await query(
    'SELECT * FROM documents WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return data.rows;
};

/**
 * Upload document
 * - Upload file lên Supabase Storage
 * - Lưu metadata vào DB
 * - Rollback nếu DB insert thất bại
 *
 * @param {string} userId
 * @param {string} docType   - Loại document
 * @param {object} file      - File object từ multer (buffer, mimetype, originalname)
 * @returns {Promise<any>} Document record vừa được tạo
 */
const upload = async (userId, docType, file) => {
  // Validate type
  if (!VALID_TYPES.includes(docType)) {
    const err = new Error(`Loại document không hợp lệ. Chỉ chấp nhận: ${VALID_TYPES.join(', ')}`);
    err.statusCode = 400;
    err.isOperational = true;
    throw err;
  }

  if (!file) {
    const err = new Error('Không có file được upload');
    err.statusCode = 400;
    err.isOperational = true;
    throw err;
  }

  // Bước 2: Upload lên Supabase Storage
  let uploadResult;
  try {
    uploadResult = await uploadFile(
      userId,
      docType,
      file.buffer,
      file.originalname,
      file.mimetype
    );
  } catch (storageErr) {
    // Nếu upload Storage thất bại → báo lỗi ngay, không cần rollback
    const err = new Error(`Upload file thất bại: ${storageErr.message}`);
    err.statusCode = 500;
    err.isOperational = true;
    throw err;
  }

  // Bước 3: Lưu metadata vào DB
  // Dùng try/catch để rollback nếu insert DB thất bại
  let doc;
  try {
    doc = await queryOne(
      `INSERT INTO documents (user_id, type, file_name, file_url, file_size, mime_type)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, docType, file.originalname, uploadResult.publicUrl, file.size, file.mimetype]
    );
  } catch (dbErr) {
    // Bước 4: Rollback — xóa file vừa upload trên Storage
    await deleteFile(uploadResult.storagePath);

    // Propagate lỗi để errorHandler middleware xử lý
    const err = new Error(`Lưu metadata thất bại, file đã được gỡ: ${dbErr.message}`);
    err.statusCode = 500;
    err.isOperational = true;
    throw err;
  }

  return doc;
};

/**
 * Xóa document
 * Quy trình 2 bước: (1) Xóa Storage → (2) Xóa DB record
 *
 * @param {string} userId
 * @param {string} documentId
 * @returns {Promise<void>}
 */
const remove = async (userId, documentId) => {
  // Bước 1: Kiểm tra document tồn tại và thuộc về user hiện tại
  // AND user_id = $2 để đảm bảo không xóa nhầm file của người khác
  const doc = await queryOne(
    'SELECT * FROM documents WHERE id = $1 AND user_id = $2',
    [documentId, userId]
  );

  if (!doc) {
    const err = new Error('Không tìm thấy document hoặc bạn không có quyền xóa');
    err.statusCode = 404;
    err.isOperational = true;
    throw err;
  }

  // Bước 2: Xóa file vật lý trên Supabase Storage
  // Extract storage path từ URL (đường dẫn dạng: .../documents/user_id/type/filename)
  const storagePath = extractStoragePath(doc.file_url);
  if (storagePath) {
    await deleteFile(storagePath);
  }

  // Bước 3: Xóa record trong DB
  // Vẫn đảm bảo AND user_id = $2 dù đã check ở trên (phòng trờ tấc công)
  await query(
    'DELETE FROM documents WHERE id = $1 AND user_id = $2',
    [documentId, userId]
  );
};

/**
 * Trích xuất storage path từ public URL của Supabase Storage
 * URL ví dụ: https://xxx.supabase.co/storage/v1/object/public/documents/uuid/cv/xxx.pdf
 * → Trả về: documents/uuid/cv/xxx.pdf
 *
 * @param {string} publicUrl
 * @returns {string|null}
 */
const extractStoragePath = (publicUrl) => {
  if (!publicUrl) return null;

  // Tìm pattern: /documents/ (đây là bucket name cố định)
  const match = publicUrl.match(/\/documents\/(.+)/);
  return match ? `documents/${match[1]}` : null;
};

module.exports = { getAll, upload, remove };
