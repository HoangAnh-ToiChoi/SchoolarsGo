const getSupabase = require('../utils/supabase');

const ALLOWED_FIELDS = [
  'bio', 'gpa', 'gpa_scale', 'english_level',
  'target_country', 'target_major', 'target_degree', 'target_intake',
];

const getProfile = async (userId) => {
  const sb = getSupabase();

  let { data: profile } = await sb.from('profiles').select('*').eq('user_id', userId).maybeSingle();

  if (!profile) {
    const { data: created } = await sb.from('profiles')
      .upsert({ user_id: userId }, { onConflict: 'user_id' })
      .select().single();
    profile = created;
  }

  const { data: documents } = await sb.from('documents')
    .select('*').eq('user_id', userId).order('created_at', { ascending: false });

  return { ...profile, documents: documents || [] };
};

const updateProfile = async (userId, updates) => {
  const sb = getSupabase();
  const fieldsToUpdate = ALLOWED_FIELDS.reduce((acc, k) => {
    if (updates[k] !== undefined) acc[k] = updates[k];
    return acc;
  }, {});

  const { data: profile, error } = await sb.from('profiles')
    .upsert({ user_id: userId, ...fieldsToUpdate, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    .select().single();

  if (error) throw error;

  if (updates.full_name) {
    await sb.from('users')
      .update({ full_name: updates.full_name, updated_at: new Date().toISOString() })
      .eq('id', userId);
  }

  return profile;
};

module.exports = { getProfile, updateProfile };
