const getSupabase = require('../utils/supabase');

const VALID_STATUS_TRANSITIONS = {
  draft: ['submitted', 'withdrawn'],
  submitted: ['under_review', 'rejected', 'withdrawn'],
  under_review: ['interview', 'rejected', 'withdrawn'],
  interview: ['accepted', 'rejected', 'withdrawn'],
  accepted: [],
  rejected: [],
  withdrawn: [],
};

const DEFAULT_CHECKLIST = [
  { item: 'CV', done: false },
  { item: 'SOP', done: false },
  { item: 'Bảng điểm', done: false },
  { item: 'Thư giới thiệu', done: false },
  { item: 'IELTS Certificate', done: false },
  { item: 'Hộ chiếu', done: false },
];

const shapeRow = (row) => ({
  id: row.id,
  status: row.status,
  applied_at: row.applied_at,
  notes: row.notes,
  checklist: row.checklist,
  documents_used: row.documents_used,
  result: row.result,
  created_at: row.created_at,
  updated_at: row.updated_at,
  scholarship: row.scholarships
    ? { id: row.scholarships.id, title: row.scholarships.title, country: row.scholarships.country, deadline: row.scholarships.deadline, amount: row.scholarships.amount, image_url: row.scholarships.image_url }
    : null,
});

const getAll = async (userId, filters) => {
  const sb = getSupabase();
  const page = Math.max(1, Number(filters.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(filters.limit) || 20));
  const offset = (page - 1) * limit;

  let q = sb.from('applications')
    .select('*, scholarships ( id, title, country, deadline, amount, image_url )', { count: 'exact' })
    .eq('user_id', userId);

  if (filters.status) q = q.eq('status', filters.status);

  const { data, count, error } = await q.order('created_at', { ascending: false }).range(offset, offset + limit - 1);
  if (error) throw error;

  return {
    data: (data || []).map(shapeRow),
    meta: { page, limit, total: count ?? 0 },
  };
};

const create = async (userId, payload) => {
  const sb = getSupabase();
  const { scholarship_id, checklist, notes } = payload;

  const { data: scholarship } = await sb.from('scholarships').select('id, title').eq('id', scholarship_id).maybeSingle();
  if (!scholarship) {
    const err = new Error('Không tìm thấy học bổng');
    err.statusCode = 404;
    err.isOperational = true;
    throw err;
  }

  const { data: existing } = await sb.from('applications')
    .select('id').eq('user_id', userId).eq('scholarship_id', scholarship_id).maybeSingle();
  if (existing) {
    const err = new Error(`Bạn đã ứng tuyển học bổng "${scholarship.title}" rồi`);
    err.statusCode = 409;
    err.isOperational = true;
    throw err;
  }

  const { data: newApp, error } = await sb.from('applications')
    .insert({ user_id: userId, scholarship_id, checklist: checklist || DEFAULT_CHECKLIST, notes: notes || null, status: 'draft' })
    .select('*, scholarships ( id, title, country, deadline, amount, image_url )')
    .single();

  if (error) throw error;
  return shapeRow(newApp);
};

const getById = async (userId, applicationId) => {
  const { data: app, error } = await getSupabase().from('applications')
    .select('*, scholarships ( id, title, country, deadline, amount, image_url )')
    .eq('id', applicationId).eq('user_id', userId).maybeSingle();

  if (error) throw error;
  if (!app) {
    const err = new Error('Không tìm thấy application');
    err.statusCode = 404;
    err.isOperational = true;
    throw err;
  }
  return shapeRow(app);
};

const update = async (userId, applicationId, updates) => {
  const sb = getSupabase();

  const { data: existing } = await sb.from('applications')
    .select('status').eq('id', applicationId).eq('user_id', userId).maybeSingle();

  if (!existing) {
    const err = new Error('Không tìm thấy application hoặc bạn không có quyền');
    err.statusCode = 404;
    err.isOperational = true;
    throw err;
  }

  if (updates.status) {
    const allowed = VALID_STATUS_TRANSITIONS[existing.status] || [];
    if (!allowed.includes(updates.status)) {
      const err = new Error(`Không thể chuyển từ "${existing.status}" sang "${updates.status}"`);
      err.statusCode = 400;
      err.isOperational = true;
      throw err;
    }
    if (updates.status === 'submitted' && existing.status === 'draft') {
      updates.applied_at = new Date().toISOString();
    }
  }

  const UPDATABLE = ['status', 'notes', 'checklist', 'documents_used', 'result', 'applied_at'];
  const patch = UPDATABLE.reduce((acc, k) => { if (updates[k] !== undefined) acc[k] = updates[k]; return acc; }, {});
  if (Object.keys(patch).length === 0) return existing;

  patch.updated_at = new Date().toISOString();

  const { data: updated, error } = await sb.from('applications')
    .update(patch).eq('id', applicationId).eq('user_id', userId).select().single();

  if (error) throw error;
  return updated;
};

const remove = async (userId, applicationId) => {
  const sb = getSupabase();

  const { data: existing } = await sb.from('applications')
    .select('id, status').eq('id', applicationId).eq('user_id', userId).maybeSingle();

  if (!existing) {
    const err = new Error('Không tìm thấy application hoặc bạn không có quyền');
    err.statusCode = 404;
    err.isOperational = true;
    throw err;
  }

  if (existing.status === 'submitted' || existing.status === 'under_review') {
    const err = new Error('Không thể xóa application đã nộp. Hãy rút đơn thay vì xóa.');
    err.statusCode = 400;
    err.isOperational = true;
    throw err;
  }

  const { error } = await sb.from('applications').delete().eq('id', applicationId).eq('user_id', userId);
  if (error) throw error;
};

module.exports = { getAll, create, getById, update, remove };
