const getSupabase = require('../utils/supabase');

const getAll = async (userId) => {
  const { data, error } = await getSupabase().from('saved_scholarships')
    .select(`id, note, created_at,
             scholarships ( id, title, provider, country, degree, amount, currency, deadline, image_url, is_featured )`)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((row) => ({
    id: row.id,
    note: row.note,
    created_at: row.created_at,
    scholarship: row.scholarships,
  }));
};

const save = async (userId, scholarshipId, note) => {
  const sb = getSupabase();

  const { data: scholarship } = await sb.from('scholarships')
    .select('id, title').eq('id', scholarshipId).maybeSingle();

  if (!scholarship) {
    const err = new Error('Không tìm thấy học bổng');
    err.statusCode = 404;
    err.isOperational = true;
    throw err;
  }

  const { data: existing } = await sb.from('saved_scholarships')
    .select('id').eq('user_id', userId).eq('scholarship_id', scholarshipId).maybeSingle();

  if (existing) {
    const err = new Error(`Bạn đã lưu học bổng "${scholarship.title}" rồi`);
    err.statusCode = 409;
    err.isOperational = true;
    throw err;
  }

  const { data: saved, error } = await sb.from('saved_scholarships')
    .insert({ user_id: userId, scholarship_id: scholarshipId, note: note || null })
    .select().single();

  if (error) throw error;

  const { data: details } = await sb.from('scholarships')
    .select('id, title, provider, country, degree, amount, currency, deadline, image_url, is_featured')
    .eq('id', scholarshipId).single();

  return { ...saved, scholarship: details };
};

const remove = async (userId, scholarshipId) => {
  const sb = getSupabase();

  const { data: existing } = await sb.from('saved_scholarships')
    .select('id').eq('user_id', userId).eq('scholarship_id', scholarshipId).maybeSingle();

  if (!existing) {
    const err = new Error('Không tìm thấy scholarship trong danh sách đã lưu');
    err.statusCode = 404;
    err.isOperational = true;
    throw err;
  }

  const { error } = await sb.from('saved_scholarships')
    .delete().eq('user_id', userId).eq('scholarship_id', scholarshipId);

  if (error) throw error;
};

module.exports = { getAll, save, remove };
