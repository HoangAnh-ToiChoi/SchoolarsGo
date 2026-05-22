class SavedRepository {
  #sb;

  constructor(sb) {
    this.#sb = sb;
  }

  async findAllByUser(userId) {
    const { data, error } = await this.#sb
      .from('saved_scholarships')
      .select('id, note, created_at, scholarships(id, title, provider, country, degree, amount, currency, deadline, image_url, is_featured)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(r => ({
      id: r.id, note: r.note, created_at: r.created_at,
      scholarship_id: r.scholarships?.id, ...r.scholarships,
    }));
  }

  async findByUserAndScholarship(userId, scholarshipId) {
    const { data } = await this.#sb
      .from('saved_scholarships').select('*')
      .eq('user_id', userId).eq('scholarship_id', scholarshipId).maybeSingle();
    return data;
  }

  async create({ userId, scholarshipId, note }) {
    const { data, error } = await this.#sb
      .from('saved_scholarships')
      .insert({ user_id: userId, scholarship_id: scholarshipId, note: note || null })
      .select('*').single();
    if (error) {
      if (error.code === '23505') {
        const err = new Error('SCHOLARSHIP_ALREADY_SAVED');
        err.isOperational = true;
        throw err;
      }
      throw error;
    }
    return data;
  }

  async deleteByUserAndScholarship(userId, scholarshipId) {
    const { error, count } = await this.#sb
      .from('saved_scholarships')
      .delete({ count: 'exact' })
      .eq('user_id', userId).eq('scholarship_id', scholarshipId);
    if (error) throw error;
    return count;
  }

  async scholarshipExists(scholarshipId) {
    const { data } = await this.#sb.from('scholarships').select('id').eq('id', scholarshipId).maybeSingle();
    return !!data;
  }

  async getScholarshipDetails(scholarshipId) {
    const { data } = await this.#sb
      .from('scholarships')
      .select('id, title, provider, country, degree, amount, currency, deadline, image_url, is_featured')
      .eq('id', scholarshipId).maybeSingle();
    return data;
  }
}

module.exports = SavedRepository;
