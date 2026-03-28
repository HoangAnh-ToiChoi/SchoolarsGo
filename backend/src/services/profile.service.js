const { supabase, supabaseAdmin } = require('./supabase');

const getProfile = async (userId) => {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*, documents(*)')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  // Nếu chưa có profile, tạo mới
  if (!profile) {
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert({ user_id: userId })
      .select('*, documents(*)')
      .single();

    if (createError) throw createError;
    return newProfile;
  }

  return profile;
};

const updateProfile = async (userId, updates) => {
  const { data: profile, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;

  // Nếu user update full_name (thuộc bảng users)
  if (updates.full_name) {
    await supabaseAdmin
      .from('users')
      .update({ full_name: updates.full_name, updated_at: new Date().toISOString() })
      .eq('id', userId);
  }

  return profile;
};

module.exports = { getProfile, updateProfile };
