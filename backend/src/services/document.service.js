const getSupabase = require('../utils/supabase');
const { uploadFile, deleteFile } = require('./storage.service');

const VALID_TYPES = ['cv', 'sop', 'transcript', 'recommendation_letter', 'other'];

const getAll = async (userId) => {
  const { data, error } = await getSupabase().from('documents')
    .select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
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

  let uploadResult;
  try {
    uploadResult = await uploadFile(userId, docType, file.buffer, file.originalname, file.mimetype);
  } catch (storageErr) {
    const err = new Error(`Upload file thất bại: ${storageErr.message}`);
    err.statusCode = 500;
    err.isOperational = true;
    throw err;
  }

  const { data: doc, error } = await getSupabase().from('documents')
    .insert({ user_id: userId, type: docType, file_name: file.originalname, file_url: uploadResult.publicUrl, file_size: file.size, mime_type: file.mimetype })
    .select().single();

  if (error) {
    await deleteFile(uploadResult.storagePath);
    const err = new Error(`Lưu metadata thất bại, file đã được gỡ: ${error.message}`);
    err.statusCode = 500;
    err.isOperational = true;
    throw err;
  }

  return doc;
};

const remove = async (userId, documentId) => {
  const sb = getSupabase();

  const { data: doc } = await sb.from('documents')
    .select('*').eq('id', documentId).eq('user_id', userId).maybeSingle();

  if (!doc) {
    const err = new Error('Không tìm thấy document hoặc bạn không có quyền xóa');
    err.statusCode = 404;
    err.isOperational = true;
    throw err;
  }

  const match = doc.file_url?.match(/\/documents\/(.+)/);
  if (match) await deleteFile(`documents/${match[1]}`);

  const { error } = await sb.from('documents').delete().eq('id', documentId).eq('user_id', userId);
  if (error) throw error;
};

module.exports = { getAll, upload, remove };
