import getSupabase from '~/configs/supabase.js';

class ProfileModel {
  async findByUserId(userId) {
    let { data: profile } = await getSupabase().from('profiles').select('*').eq('user_id', userId).maybeSingle();

    if (!profile) {
      const { data } = await getSupabase().from('profiles').upsert({ user_id: userId }, { onConflict: 'user_id' }).select('*').single();
      profile = data;
    }

    const { data: docs } = await getSupabase().from('documents').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    return { ...profile, documents: docs || [] };
  }

  async upsertProfile(userId, updates) {
    const allowedFields = ['bio', 'gpa', 'gpa_scale', 'english_level', 'target_country', 'target_major', 'target_degree', 'target_intake'];
    const filtered = Object.fromEntries(allowedFields.filter(k => updates[k] !== undefined).map(k => [k, updates[k]]));

    const payload = { user_id: userId, ...filtered, updated_at: new Date().toISOString() };
    const { data, error } = await getSupabase().from('profiles').upsert(payload, { onConflict: 'user_id' }).select('*').single();
    if (error) throw error;

    if (updates.full_name) {
      await getSupabase().from('users').update({ full_name: updates.full_name, updated_at: new Date().toISOString() }).eq('id', userId);
    }

    return data;
  }
}

export default new ProfileModel();