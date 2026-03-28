const { supabase, supabaseAdmin } = require('./supabase');
const path = require('path');
const VALID_TYPES = ['cv', 'sop', 'transcript', 'recommendation_letter', 'other'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

const getAll = async (userId) => {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
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

  // Upload lên Supabase Storage
  const ext = path.extname(file.originalname);
  const storagePath = `${userId}/${docType}/${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;

  const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
    .from('documents')
    .upload(storagePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (uploadError) throw uploadError;

  // Lấy public URL
  const { data: urlData } = supabaseAdmin.storage.from('documents').getPublicUrl(storagePath);

  // Lưu metadata vào DB
  const { data: doc, error: dbError } = await supabase
    .from('documents')
    .insert({
      user_id: userId,
      type: docType,
      file_name: file.originalname,
      file_url: urlData.publicUrl,
      file_size: file.size,
      mime_type: file.mimetype,
    })
    .select()
    .single();

  if (dbError) {
    // Rollback: xóa file đã upload
    await supabaseAdmin.storage.from('documents').remove([storagePath]);
    throw dbError;
  }

  return doc;
};

const remove = async (userId, documentId) => {
  // Lấy thông tin document
  const { data: doc, error: fetchError } = await supabase
    .from('documents')
    .select('*')
    .eq('id', documentId)
    .eq('user_id', userId)
    .single();

  if (fetchError || !doc) {
    const err = new Error('Không tìm thấy document hoặc bạn không có quyền xóa');
    err.statusCode = 404;
    err.isOperational = true;
    throw err;
  }

  // Xóa file khỏi storage
  // Extract storage path từ URL (cắt bỏ phần domain)
  const urlObj = new URL(doc.file_url);
  const storagePath = urlObj.pathname.replace('/storage/v1/object/public/documents/', '');

  await supabaseAdmin.storage.from('documents').remove([storagePath]);

  // Xóa record trong DB
  const { error: deleteError } = await supabase
    .from('documents')
    .delete()
    .eq('id', documentId);

  if (deleteError) throw deleteError;
};

module.exports = { getAll, upload, remove };
