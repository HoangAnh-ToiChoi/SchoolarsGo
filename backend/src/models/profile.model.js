import getSupabase from '~/configs/supabase.js';
import { PROFILE_UPDATABLE_FIELDS } from '~/constants/profile.js';

class ProfileModel {
  async findByUserId(userId) {
    const { data: found, error: profileError } = await getSupabase().from('profiles').select('*').eq('user_id', userId).maybeSingle();
    if (profileError) throw profileError;

    let profile = found;
    if (!profile) {
      const { data, error } = await getSupabase().from('profiles').upsert({ user_id: userId }, { onConflict: 'user_id' }).select('*').single();
      if (error) throw error;
      profile = data;
    }

    const { data: docs, error: docsError } = await getSupabase().from('documents').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (docsError) throw docsError;
    return { ...profile, documents: docs || [] };
  }

  async upsertProfile(userId, updates) {
    const sent = PROFILE_UPDATABLE_FIELDS.filter(key => updates[key] !== undefined);
    const filtered = Object.fromEntries(sent.map(key => [key, updates[key]]));

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