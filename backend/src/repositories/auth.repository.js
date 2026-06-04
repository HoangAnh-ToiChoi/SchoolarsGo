class AuthRepository {
  #sb;

  constructor(sb) {
    this.#sb = sb;
  }

  async findByEmail(email) {
    const { data } = await this.#sb.from('users').select('id').eq('email', email).maybeSingle();
    return data;
  }

  async findPublicByEmail(email) {
    const { data } = await this.#sb
      .from('users')
      .select('id, email, full_name, avatar_url, phone, date_of_birth, role, created_at')
      .ilike('email', email)
      .maybeSingle();
    return data;
  }

  async findByEmailWithCredentials(email) {
    const { data } = await this.#sb
      .from('users')
      .select('id, email, password_hash, full_name, avatar_url, phone, date_of_birth, role, created_at')
      .eq('email', email)
      .maybeSingle();
    return data;
  }

  async findById(id) {
    const { data } = await this.#sb
      .from('users')
      .select('id, email, full_name, avatar_url, phone, date_of_birth, role, created_at')
      .eq('id', id)
      .maybeSingle();
    return data;
  }

  async createUser({ email, passwordHash, fullName }) {
    const { data, error } = await this.#sb
      .from('users')
      .insert({ email, password_hash: passwordHash, full_name: fullName, role: 'user' })
      .select('id, email, full_name, role, created_at')
      .single();
    if (error) throw error;
    return data;
  }

  async createOAuthUser({ email, passwordHash, fullName, avatarUrl }) {
    const { data, error } = await this.#sb
      .from('users')
      .insert({
        email,
        password_hash: passwordHash,
        full_name: fullName,
        avatar_url: avatarUrl || null,
        role: 'user',
      })
      .select('id, email, full_name, avatar_url, role, created_at')
      .single();
    if (error) throw error;
    return data;
  }

  async updateLastLogin(userId) {
    const { data, error } = await this.#sb
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', userId)
      .select('id, email, full_name, avatar_url, phone, date_of_birth, role')
      .single();
    if (error) throw error;
    return data;
  }

  async saveResetToken(userId, tokenHash, expiresAt) {
    const { error } = await this.#sb
      .from('users')
      .update({ reset_token: tokenHash, reset_token_expires: expiresAt })
      .eq('id', userId);
    if (error) throw error;
  }

  async findByResetToken(tokenHash) {
    const { data } = await this.#sb
      .from('users')
      .select('id, email, reset_token_expires')
      .eq('reset_token', tokenHash)
      .maybeSingle();
    return data;
  }

  async clearResetToken(userId, newPasswordHash) {
    const { error } = await this.#sb
      .from('users')
      .update({ password_hash: newPasswordHash, reset_token: null, reset_token_expires: null })
      .eq('id', userId);
    if (error) throw error;
  }

  async findOAuthIdentity(provider, providerUserId) {
    const { data } = await this.#sb
      .from('user_oauth_identities')
      .select('id, user_id, provider, provider_user_id, provider_email, last_login_at')
      .eq('provider', provider)
      .eq('provider_user_id', providerUserId)
      .maybeSingle();
    return data;
  }

  async createOAuthIdentity({ userId, provider, providerUserId, providerEmail }) {
    const { data, error } = await this.#sb
      .from('user_oauth_identities')
      .insert({
        user_id: userId,
        provider,
        provider_user_id: providerUserId,
        provider_email: providerEmail || null,
        last_login_at: new Date().toISOString(),
      })
      .select('id, user_id, provider, provider_user_id, provider_email, last_login_at')
      .single();
    if (error) throw error;
    return data;
  }

  async touchOAuthIdentity(identityId, providerEmail = null) {
    const updates = {
      updated_at: new Date().toISOString(),
      last_login_at: new Date().toISOString(),
    };
    if (providerEmail) updates.provider_email = providerEmail;

    const { error } = await this.#sb
      .from('user_oauth_identities')
      .update(updates)
      .eq('id', identityId);
    if (error) throw error;
  }
}

module.exports = AuthRepository;
