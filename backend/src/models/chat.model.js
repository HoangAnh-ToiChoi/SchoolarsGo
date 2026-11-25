import getSupabase from '~/configs/supabase.js';

const PROFILE_COLUMNS = 'gpa, english_level, target_country, target_degree';
const SCHOLARSHIP_COLUMNS =
  'title, slug, provider, country, degree, amount, currency, deadline, min_gpa, min_ielts, application_url';

class ChatModel {
  async findProfile(userId) {
    const { data, error } = await getSupabase()
      .from('profiles')
      .select(PROFILE_COLUMNS)
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  /** Học bổng còn hạn (hạn chưa rõ vẫn tính là còn) khớp bộ lọc; hạn gần nhất lên trước. */
  async findScholarships(filters, limit) {
    const nowIso = new Date().toISOString();
    let query = getSupabase()
      .from('scholarships')
      .select(SCHOLARSHIP_COLUMNS)
      .eq('is_active', true)
      .or(`deadline.is.null,deadline.gte.${nowIso}`);

    if (filters.country) query = query.ilike('country', `%${filters.country}%`);
    if (filters.degree) query = query.or(`degree.eq.${filters.degree},degree.eq.Any`);
    if (filters.min_gpa) query = query.or(`min_gpa.is.null,min_gpa.lte.${filters.min_gpa}`);
    if (filters.min_ielts) query = query.or(`min_ielts.is.null,min_ielts.lte.${filters.min_ielts}`);

    const ordered = query.order('deadline', { ascending: true, nullsFirst: false });
    const { data, error } = await ordered.limit(limit);
    if (error) throw error;
    return data || [];
  }

  async insertMessages(rows) {
    const { error } = await getSupabase().from('chat_messages').insert(rows);
    if (error) throw error;
  }

  async findHistory(userId, limit) {
    const { data, error } = await getSupabase()
      .from('chat_messages')
      .select('role, content, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  }
}

export default new ChatModel();
