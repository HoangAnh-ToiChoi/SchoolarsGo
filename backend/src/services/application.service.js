const { supabase } = require('./supabase');
const APPLICATION_STATUSES = ['draft', 'submitted', 'under_review', 'interview', 'accepted', 'rejected', 'withdrawn'];
const VALID_STATUS_TRANSITIONS = {
  draft: ['submitted', 'withdrawn'],
  submitted: ['under_review', 'rejected', 'withdrawn'],
  under_review: ['interview', 'rejected', 'withdrawn'],
  interview: ['accepted', 'rejected', 'withdrawn'],
  accepted: [],
  rejected: [],
  withdrawn: [],
};

const getAll = async (userId, filters) => {
  const page = Math.max(1, Number(filters.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(filters.limit) || 20));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('applications')
    .select('*, scholarship:scholarships(id, title, country, deadline, amount, image_url)', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    data,
    meta: { page, limit, total: count || 0 },
  };
};

const create = async (userId, payload) => {
  const { scholarship_id, checklist, notes } = payload;

  // Kiểm tra scholarship tồn tại
  const { data: scholarship, error: schError } = await supabase
    .from('scholarships')
    .select('id, title')
    .eq('id', scholarship_id)
    .single();

  if (schError || !scholarship) {
    const err = new Error('Không tìm thấy học bổng');
    err.statusCode = 404;
    err.isOperational = true;
    throw err;
  }

  // Kiểm tra đã ứng tuyển chưa
  const { data: existing } = await supabase
    .from('applications')
    .select('id')
    .eq('user_id', userId)
    .eq('scholarship_id', scholarship_id)
    .single();

  if (existing) {
    const err = new Error(`Bạn đã ứng tuyển học bổng "${scholarship.title}" rồi`);
    err.statusCode = 409;
    err.isOperational = true;
    throw err;
  }

  // Tạo default checklist nếu không truyền
  const defaultChecklist = [
    { item: 'CV', done: false },
    { item: 'SOP', done: false },
    { item: 'Bảng điểm', done: false },
    { item: 'Thư giới thiệu', done: false },
    { item: 'IELTS Certificate', done: false },
    { item: 'Hộ chiếu', done: false },
  ];

  const { data, error } = await supabase
    .from('applications')
    .insert({
      user_id: userId,
      scholarship_id,
      checklist: checklist || defaultChecklist,
      notes: notes || null,
      status: 'draft',
    })
    .select('*, scholarship:scholarships(id, title, country, deadline, amount, image_url)')
    .single();

  if (error) throw error;
  return data;
};

const getById = async (userId, applicationId) => {
  const { data, error } = await supabase
    .from('applications')
    .select('*, scholarship:scholarships(*), documents_used')
    .eq('id', applicationId)
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    const err = new Error('Không tìm thấy application');
    err.statusCode = 404;
    err.isOperational = true;
    throw err;
  }

  return data;
};

const update = async (userId, applicationId, updates) => {
  // Kiểm tra application thuộc về user
  const { data: existing } = await supabase
    .from('applications')
    .select('status')
    .eq('id', applicationId)
    .eq('user_id', userId)
    .single();

  if (!existing) {
    const err = new Error('Không tìm thấy application hoặc bạn không có quyền');
    err.statusCode = 404;
    err.isOperational = true;
    throw err;
  }

  // Validate status transition
  if (updates.status) {
    const allowed = VALID_STATUS_TRANSITIONS[existing.status] || [];
    if (!allowed.includes(updates.status)) {
      const err = new Error(`Không thể chuyển từ "${existing.status}" sang "${updates.status}"`);
      err.statusCode = 400;
      err.isOperational = true;
      throw err;
    }

    // Nếu chuyển sang submitted, set applied_at
    if (updates.status === 'submitted' && existing.status === 'draft') {
      updates.applied_at = new Date().toISOString();
    }
  }

  const { data, error } = await supabase
    .from('applications')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', applicationId)
    .select('*, scholarship:scholarships(id, title, country, deadline, amount, image_url)')
    .single();

  if (error) throw error;
  return data;
};

const remove = async (userId, applicationId) => {
  const { data: existing } = await supabase
    .from('applications')
    .select('id, status')
    .eq('id', applicationId)
    .eq('user_id', userId)
    .single();

  if (!existing) {
    const err = new Error('Không tìm thấy application hoặc bạn không có quyền');
    err.statusCode = 404;
    err.isOperational = true;
    throw err;
  }

  // Warning: đã submitted rồi
  if (existing.status === 'submitted' || existing.status === 'under_review') {
    const err = new Error('Không thể xóa application đã nộp. Hãy rút đơn thay vì xóa.');
    err.statusCode = 400;
    err.isOperational = true;
    throw err;
  }

  const { error } = await supabase
    .from('applications')
    .delete()
    .eq('id', applicationId);

  if (error) throw error;
};

module.exports = { getAll, create, getById, update, remove };
