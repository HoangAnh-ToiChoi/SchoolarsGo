class RecommendRepository {
  #sb;

  constructor(sb) {
    this.#sb = sb;
  }

  async findProfileByUserId(userId) {
    const { data: profile } = await this.#sb.from('profiles').select('*').eq('user_id', userId).maybeSingle();
    if (!profile) return null;

    const { data: documents } = await this.#sb
      .from('documents')
      .select('id, type')
      .eq('user_id', userId);

    return {
      ...profile,
      document_count: documents?.length || 0,
      document_types: [...new Set((documents || []).map((doc) => doc.type).filter(Boolean))],
    };
  }

  async findActiveScholarships(limit = 200) {
    const { data, error } = await this.#sb
      .from('scholarships')
      .select('*')
      .eq('is_active', true)
      .or(`deadline.is.null,deadline.gte.${new Date().toISOString()}`)
      .order('relevance_score', { ascending: false })
      .order('deadline', { ascending: true, nullsFirst: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  }
}

module.exports = RecommendRepository;
