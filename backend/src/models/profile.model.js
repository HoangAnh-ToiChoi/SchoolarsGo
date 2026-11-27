import getSupabase from '~/configs/supabase.js';
import { PROFILE_UPDATABLE_FIELDS } from '~/constants/profile.js';

// Cột trả về cho FE: cột ghi được qua PUT /profile + khóa và mốc thời gian
const PROFILE_COLUMNS = ['id', 'user_id', ...PROFILE_UPDATABLE_FIELDS, 'created_at', 'updated_at'].join(', ');
// Link tải tài liệu lấy qua GET /documents (link ký có hạn), ở đây chỉ cần thông tin tóm tắt
const PROFILE_DOCUMENT_COLUMNS = 'id, type, file_name, file_size, mime_type, is_verified, created_at';

class ProfileModel {
  async findByUserId(userId) {
    const { data: found, error: profileError } = await getSupabase().from('profiles').select(PROFILE_COLUMNS).eq('user_id', userId).maybeSingle();
    if (profileError) throw profileError;

    let profile = found;
    if (!profile) {
      const { data, error } = await getSupabase().from('profiles').upsert({ user_id: userId }, { onConflict: 'user_id' }).select(PROFILE_COLUMNS).single();
      if (error) throw error;
      profile = data;
    }

    const { data: docs, error: docsError } = await getSupabase().from('documents').select(PROFILE_DOCUMENT_COLUMNS).eq('user_id', userId).order('created_at', { ascending: false });
    if (docsError) throw docsError;
    return { ...profile, documents: docs || [] };
  }

  async upsertProfile(userId, updates) {
    const sent = PROFILE_UPDATABLE_FIELDS.filter(key => updates[key] !== undefined);
    const filtered = Object.fromEntries(sent.map(key => [key, updates[key]]));

    const payload = { user_id: userId, ...filtered, updated_at: new Date().toISOString() };
    const { data, error } = await getSupabase().from('profiles').upsert(payload, { onConflict: 'user_id' }).select(PROFILE_COLUMNS).single();
    if (error) throw error;

    if (updates.full_name) {
      const userUpdate = { full_name: updates.full_name, updated_at: new Date().toISOString() };
      const { error: userError } = await getSupabase().from('users').update(userUpdate).eq('id', userId);
      if (userError) throw userError;
    }

    return data;
  }
}

export default new ProfileModel();