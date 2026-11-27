import getSupabase from '~/configs/supabase.js';

// file_url chỉ còn ở bản ghi trước migration 013 (URL công khai cũ), service dùng để suy ra storage_path
const DOCUMENT_COLUMNS = 'id, type, file_name, file_size, mime_type, is_verified, created_at, storage_path, file_url';

class DocumentModel {
  async findAllByUserId(userId) {
    const { data, error } = await getSupabase()
      .from('documents')
      .select(DOCUMENT_COLUMNS)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async findByIdAndUserId(id, userId) {
    const { data, error } = await getSupabase()
      .from('documents')
      .select(DOCUMENT_COLUMNS)
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async insertDocument({ userId, docType, fileName, storagePath, fileSize, mimeType }) {
    const row = { user_id: userId, type: docType, file_name: fileName, storage_path: storagePath, file_size: fileSize, mime_type: mimeType };
    const { data, error } = await getSupabase().from('documents').insert(row).select(DOCUMENT_COLUMNS).single();
    if (error) throw error;
    return data;
  }

  async deleteByIdAndUserId(id, userId) {
    const { error } = await getSupabase().from('documents').delete().eq('id', id).eq('user_id', userId);
    if (error) throw error;
  }
}

export default new DocumentModel();
