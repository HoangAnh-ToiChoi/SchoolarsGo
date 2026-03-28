const { supabase } = require('./supabase');

const getAll = async (userId) => {
  const { data, error } = await supabase
    .from('saved_scholarships')
    .select('*, scholarship:scholarships(id, title, provider, country, degree, amount, currency, deadline, image_url, is_featured)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

const save = async (userId, scholarshipId, note) => {
  // Kiểm tra scholarship tồn tại
  const { data: scholarship, error: schError } = await supabase
    .from('scholarships')
    .select('id, title')
    .eq('id', scholarshipId)
    .single();

  if (schError || !scholarship) {
    const err = new Error('Không tìm thấy học bổng');
    err.statusCode = 404;
    err.isOperational = true;
    throw err;
  }

  // Kiểm tra đã save chưa
  const { data: existing } = await supabase
    .from('saved_scholarships')
    .select('id')
    .eq('user_id', userId)
    .eq('scholarship_id', scholarshipId)
    .single();

  if (existing) {
    const err = new Error(`Bạn đã lưu học bổng "${scholarship.title}" rồi`);
    err.statusCode = 409;
    err.isOperational = true;
    throw err;
  }

  const { data, error } = await supabase
    .from('saved_scholarships')
    .insert({ user_id: userId, scholarship_id: scholarshipId, note: note || null })
    .select('*, scholarship:scholarships(id, title, provider, country, degree, amount, currency, deadline, image_url, is_featured)')
    .single();

  if (error) throw error;
  return data;
};

const remove = async (userId, scholarshipId) => {
  const { error } = await supabase
    .from('saved_scholarships')
    .delete()
    .eq('user_id', userId)
    .eq('scholarship_id', scholarshipId);

  if (error) throw error;
};

module.exports = { getAll, save, remove };
