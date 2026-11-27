import getSupabase from '~/configs/supabase.js';

class SavedModel {
  async findAllByUser(userId) {
    const { data, error } = await getSupabase()
      .from('saved_scholarships')
      .select('id, note, created_at, scholarships(id, slug, title, provider, country, degree, amount, currency, deadline, image_url, is_featured)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    // Trải cột học bổng trước để `id` là id bản ghi đã lưu, không bị id học bổng ghi đè
    return (data || []).map(r => ({
      ...r.scholarships,
      id: r.id, note: r.note, created_at: r.created_at,
      scholarship_id: r.scholarships?.id,
    }));
  }

  async findByUserAndScholarship(userId, scholarshipId) {
    const { data, error } = await getSupabase()
      .from('saved_scholarships').select('*')
      .eq('user_id', userId).eq('scholarship_id', scholarshipId).maybeSingle();
    if (error) throw error;
    return data;
  }

  async create({ userId, scholarshipId, note }) {
    const { data, error } = await getSupabase()
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
    const { error, count } = await getSupabase()
      .from('saved_scholarships')
      .delete({ count: 'exact' })
      .eq('user_id', userId).eq('scholarship_id', scholarshipId);
    if (error) throw error;
    return count;
  }

  async scholarshipExists(scholarshipId) {
    const { data, error } = await getSupabase().from('scholarships').select('id').eq('id', scholarshipId).maybeSingle();
    if (error) throw error;
    return !!data;
  }

  async getScholarshipDetails(scholarshipId) {
    const { data, error } = await getSupabase()
      .from('scholarships')
      .select('id, title, provider, country, degree, amount, currency, deadline, image_url, is_featured')
      .eq('id', scholarshipId).maybeSingle();
    if (error) throw error;
    return data;
  }
}

export default new SavedModel();