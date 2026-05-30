class RecommendRepository {
  #sb;

  constructor(sb) {
    this.#sb = sb;
  }

  async findProfileByUserId(userId) {
    const { data } = await this.#sb.from('profiles').select('*').eq('user_id', userId).maybeSingle();
    return data;
  }

  async findActiveScholarships(limit = 200) {
    const { data, error } = await this.#sb
      .from('scholarships')
      .select('*')
      .eq('is_active', true)
      .gte('deadline', new Date().toISOString())
      .order('deadline', { ascending: true })
      .limit(limit);
    if (error) throw error;
    return data || [];
  }
}

module.exports = RecommendRepository;
