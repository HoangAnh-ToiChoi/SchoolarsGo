import getSupabase from '#configs/supabase.js';

class RecommendModel {
  async findProfileByUserId(userId) {
    const { data: profile } = await getSupabase().from('profiles').select('*').eq('user_id', userId).maybeSingle();
    if (!profile) return null;

    const { data: documents } = await getSupabase()
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
    const { data, error } = await getSupabase()
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

export default new RecommendModel();