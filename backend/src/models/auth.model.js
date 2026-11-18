import getSupabase from '~/configs/supabase.js';

class AuthModel {
  async findByEmail(email) {
    const { data } = await getSupabase().from('users').select('id').eq('email', email).maybeSingle();
    return data;
  }

  async findByEmailWithCredentials(email) {
    const { data } = await getSupabase()
      .from('users')
      .select('id, email, password_hash, full_name, avatar_url, phone, date_of_birth, role, is_active, created_at')
      .eq('email', email)
      .maybeSingle();
    return data;
  }

  async findById(id) {
    const { data } = await getSupabase()
      .from('users')
      .select('id, email, full_name, avatar_url, phone, date_of_birth, role, created_at')
      .eq('id', id)
      .maybeSingle();
    return data;
  }

  async findSessionUserById(id) {
    const { data } = await getSupabase()
      .from('users')
      .select('id, email, full_name, avatar_url, phone, date_of_birth, role, is_active')
      .eq('id', id)
      .maybeSingle();
    return data;
  }

  async createUser({ email, passwordHash, fullName }) {
    const { data, error } = await getSupabase()
      .from('users')
      .insert({ email, password_hash: passwordHash, full_name: fullName, role: 'user' })
      .select('id, email, full_name, role, created_at')
      .single();
    if (error) throw error;
    return data;
  }

  async updateLastLogin(userId) {
    const { data, error } = await getSupabase()
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', userId)
      .select('id, email, full_name, role')
      .single();
    if (error) throw error;
    return data;
  }

  async saveResetToken(userId, tokenHash, expiresAt) {
    const { error } = await getSupabase()
      .from('users')
      .update({ reset_token: tokenHash, reset_token_expires: expiresAt })
      .eq('id', userId);
    if (error) throw error;
  }

  async findByResetToken(tokenHash) {
    const { data } = await getSupabase()
      .from('users')
      .select('id, email, reset_token_expires')
      .eq('reset_token', tokenHash)
      .maybeSingle();
    return data;
  }

  async clearResetToken(userId, newPasswordHash) {
    const { error } = await getSupabase()
      .from('users')
      .update({ password_hash: newPasswordHash, reset_token: null, reset_token_expires: null })
      .eq('id', userId);
    if (error) throw error;
  }
}

export default new AuthModel();