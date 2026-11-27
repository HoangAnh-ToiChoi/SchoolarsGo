import getSupabase from '~/configs/supabase.js';

const DEFAULT_CHECKLIST = [
  { item: 'CV', done: false },
  { item: 'SOP', done: false },
  { item: 'Bảng điểm', done: false },
  { item: 'Thư giới thiệu', done: false },
  { item: 'IELTS Certificate', done: false },
  { item: 'Hộ chiếu', done: false },
];

class ApplicationModel {
  async findAllByUser(userId, { page = 1, limit = 20, status = null } = {}) {
    const offset = (page - 1) * limit;
    let q = getSupabase()
      .from('applications')
      .select('id, status, applied_at, notes, checklist, documents_used, result, created_at, updated_at, scholarships(id, slug, title, provider, country, deadline, amount, image_url)', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) q = q.eq('status', status);

    const { data, count, error } = await q;
    if (error) throw error;
    const rows = (data || []).map(r => ({
      ...r,
      scholarship_id: r.scholarships?.id,
      scholarship_slug: r.scholarships?.slug,
      scholarship_title: r.scholarships?.title,
      country: r.scholarships?.country,
      deadline: r.scholarships?.deadline,
      amount: r.scholarships?.amount,
      image_url: r.scholarships?.image_url,
    }));
    return { rows, total: count || 0 };
  }

  async create(userId, { scholarshipId, checklist, notes }) {
    const { data, error } = await getSupabase()
      .from('applications')
      .insert({ user_id: userId, scholarship_id: scholarshipId, checklist: checklist || DEFAULT_CHECKLIST, notes: notes || null, status: 'draft' })
      .select('*').single();
    if (error) {
      if (error.code === '23505') {
        const err = new Error('APPLICATION_ALREADY_EXISTS');
        err.isOperational = true;
        throw err;
      }
      throw error;
    }
    return data;
  }

  async findByIdAndUser(applicationId, userId) {
    const { data, error } = await getSupabase()
      .from('applications')
      .select('*, scholarships(id, slug, title, provider, country, deadline, amount, image_url)')
      .eq('id', applicationId).eq('user_id', userId).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return { ...data, scholarship_id: data.scholarships?.id, scholarship_slug: data.scholarships?.slug, scholarship_title: data.scholarships?.title, country: data.scholarships?.country, deadline: data.scholarships?.deadline, amount: data.scholarships?.amount, image_url: data.scholarships?.image_url };
  }

  async updateByIdAndUser(applicationId, userId, updates) {
    const allowed = ['status', 'notes', 'checklist', 'documents_used', 'result', 'applied_at'];
    const payload = Object.fromEntries(allowed.filter(k => updates[k] !== undefined).map(k => [k, updates[k]]));
    if (Object.keys(payload).length === 0) return this.findByIdAndUser(applicationId, userId);
    payload.updated_at = new Date().toISOString();
    const { data, error } = await getSupabase().from('applications').update(payload).eq('id', applicationId).eq('user_id', userId).select('*').single();
    if (error) throw error;
    return data;
  }

  async deleteByIdAndUser(applicationId, userId) {
    const { error, count } = await getSupabase().from('applications').delete({ count: 'exact' }).eq('id', applicationId).eq('user_id', userId);
    if (error) throw error;
    return count;
  }

  /** Học bổng còn mở nhận đơn (có và chưa bị tắt). */
  async isScholarshipOpen(scholarshipId) {
    const { data, error } = await getSupabase().from('scholarships').select('id').eq('id', scholarshipId).eq('is_active', true).maybeSingle();
    if (error) throw error;
    return !!data;
  }

  /** Số tài liệu trong `documentIds` thuộc về người dùng (kiểm documents_used / checklist không trỏ sang tài liệu người khác). */
  async countOwnedDocuments(userId, documentIds) {
    const { count, error } = await getSupabase()
      .from('documents')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .in('id', documentIds);
    if (error) throw error;
    return count || 0;
  }
}

export default new ApplicationModel();