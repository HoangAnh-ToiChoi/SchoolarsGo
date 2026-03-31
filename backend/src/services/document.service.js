/**
 * Document Service — lưu metadata documents vào DB (file đã được upload bằng multer disk storage).
 * Không dùng Supabase Storage, chỉ dùng local /uploads folder.
 */

const { query, queryOne } = require('../utils/db');
const path = require('path');
const fs = require('fs');

const VALID_TYPES = ['cv', 'sop', 'transcript', 'recommendation_letter', 'other'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

const getAll = async (userId) => {
  const data = await query(
    'SELECT * FROM documents WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return data.rows;
};

const upload = async (userId, docType, file) => {
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

  if (file.size > MAX_SIZE) {
    const err = new Error('File quá lớn (tối đa 10MB)');
    err.statusCode = 400;
    err.isOperational = true;
    throw err;
  }

  // File đã được lưu bởi multer middleware vào uploads/{userId}/{docType}/
  // file.path sẽ có dạng: uploads/{userId}/{docType}/filename.ext
  // Tạo URL tương đối
  const fileUrl = `/${file.path.replace(/\\/g, '/').replace('uploads/', 'uploads/')}`;

  // Lưu metadata vào DB
  const doc = await queryOne(
    `INSERT INTO documents (user_id, type, file_name, file_url, file_size, mime_type)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [userId, docType, file.originalname, fileUrl, file.size, file.mimetype]
  );

  return doc;
};

const remove = async (userId, documentId) => {
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

  // Xóa file vật lý
  try {
    const filePath = path.join(__dirname, '../../', doc.file_url.replace(/^\//, ''));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (fsErr) {
    console.warn('Warning: could not delete physical file:', fsErr.message);
  }

  // Xóa record trong DB
  await query('DELETE FROM documents WHERE id = $1', [documentId]);
};

module.exports = { getAll, upload, remove };
