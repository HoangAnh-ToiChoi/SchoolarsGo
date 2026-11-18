import getSupabase from '#configs/supabase.js';

class DocumentModel {
  async findAllByUserId(userId) {
    const { data, error } = await getSupabase().from('documents').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async findByIdAndUserId(id, userId) {
    const { data } = await getSupabase().from('documents').select('*').eq('id', id).eq('user_id', userId).maybeSingle();
    return data;
  }

  async insertDocument({ userId, docType, fileName, fileUrl, fileSize, mimeType }) {
    const { data, error } = await getSupabase()
      .from('documents')
      .insert({ user_id: userId, type: docType, file_name: fileName, file_url: fileUrl, file_size: fileSize, mime_type: mimeType })
      .select('*').single();
    if (error) throw error;
    return data;
  }

  async deleteByIdAndUserId(id, userId) {
    const { error } = await getSupabase().from('documents').delete().eq('id', id).eq('user_id', userId);
    if (error) throw error;
  }
}

export default new DocumentModel();