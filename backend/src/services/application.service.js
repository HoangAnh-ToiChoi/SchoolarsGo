const { query, queryOne } = require('../utils/db');

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
  const offset = (page - 1) * limit;

  const conditions = ['a.user_id = $1'];
  const params = [userId];
  let idx = 2;

  if (filters.status) {
    conditions.push(`a.status = $${idx++}`);
    params.push(filters.status);
  }

  const where = `WHERE ${conditions.join(' AND ')}`;

  const countResult = await queryOne(
    `SELECT COUNT(*) as total FROM applications a ${where}`,
    params
  );
  const total = parseInt(countResult.total, 10);

  const data = await query(
    `SELECT a.id, a.status, a.applied_at, a.notes, a.checklist, a.documents_used, a.result,
            a.created_at, a.updated_at,
            s.id as scholarship_id, s.title as scholarship_title, s.country, s.deadline, s.amount, s.image_url
     FROM applications a
     JOIN scholarships s ON a.scholarship_id = s.id
     ${where}
     ORDER BY a.created_at DESC
     LIMIT $${idx++} OFFSET $${idx}`,
    [...params, limit, offset]
  );

  return {
    data: data.rows.map((row) => ({
      id: row.id,
      status: row.status,
      applied_at: row.applied_at,
      notes: row.notes,
      checklist: row.checklist,
      documents_used: row.documents_used,
      result: row.result,
      created_at: row.created_at,
      updated_at: row.updated_at,
      scholarship: {
        id: row.scholarship_id,
        title: row.scholarship_title,
        country: row.country,
        deadline: row.deadline,
        amount: row.amount,
        image_url: row.image_url,
      },
    })),
    meta: { page, limit, total },
  };
};

const create = async (userId, payload) => {
  const { scholarship_id, checklist, notes } = payload;

  const scholarship = await queryOne(
    'SELECT id, title FROM scholarships WHERE id = $1',
    [scholarship_id]
  );

  if (!scholarship) {
    const err = new Error('Không tìm thấy học bổng');
    err.statusCode = 404;
    err.isOperational = true;
    throw err;
  }

  const existing = await queryOne(
    'SELECT id FROM applications WHERE user_id = $1 AND scholarship_id = $2',
    [userId, scholarship_id]
  );

  if (existing) {
    const err = new Error(`Bạn đã ứng tuyển học bổng "${scholarship.title}" rồi`);
    err.statusCode = 409;
    err.isOperational = true;
    throw err;
  }

  const defaultChecklist = [
    { item: 'CV', done: false },
    { item: 'SOP', done: false },
    { item: 'Bảng điểm', done: false },
    { item: 'Thư giới thiệu', done: false },
    { item: 'IELTS Certificate', done: false },
    { item: 'Hộ chiếu', done: false },
  ];

  const newApp = await queryOne(
    `INSERT INTO applications (user_id, scholarship_id, checklist, notes, status)
     VALUES ($1, $2, $3, $4, 'draft')
     RETURNING *`,
    [userId, scholarship_id, JSON.stringify(checklist || defaultChecklist), notes || null]
  );

  const scholarshipDetails = await queryOne(
    'SELECT id, title, country, deadline, amount, image_url FROM scholarships WHERE id = $1',
    [scholarship_id]
  );

  return { ...newApp, scholarship: scholarshipDetails };
};

const getById = async (userId, applicationId) => {
  const app = await queryOne(
    `SELECT a.*,
            s.id as scholarship_id, s.title as scholarship_title,
            s.country, s.deadline, s.amount, s.image_url
     FROM applications a
     JOIN scholarships s ON a.scholarship_id = s.id
     WHERE a.id = $1 AND a.user_id = $2`,
    [applicationId, userId]
  );

  if (!app) {
    const err = new Error('Không tìm thấy application');
    err.statusCode = 404;
    err.isOperational = true;
    throw err;
  }

  return app;
};

const update = async (userId, applicationId, updates) => {
  const existing = await queryOne(
    'SELECT status FROM applications WHERE id = $1 AND user_id = $2',
    [applicationId, userId]
  );

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

  const fields = [];
  const values = [];
  let idx = 1;

  for (const key of ['status', 'notes', 'checklist', 'documents_used', 'result', 'applied_at']) {
    if (updates[key] !== undefined) {
      fields.push(`${key} = $${idx++}`);
      values.push(typeof updates[key] === 'object' ? JSON.stringify(updates[key]) : updates[key]);
    }
  }

  if (fields.length === 0) return existing;

  fields.push('updated_at = now()');
  values.push(applicationId, userId);

  const updated = await queryOne(
    `UPDATE applications SET ${fields.join(', ')} WHERE id = $${idx++} AND user_id = $${idx} RETURNING *`,
    values
  );

  if (!updated) {
    const err = new Error('Không thể cập nhật application');
    err.statusCode = 500;
    err.isOperational = true;
    throw err;
  }

  return updated;
};

const remove = async (userId, applicationId) => {
  const existing = await queryOne(
    'SELECT id, status FROM applications WHERE id = $1 AND user_id = $2',
    [applicationId, userId]
  );

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

  await query('DELETE FROM applications WHERE id = $1 AND user_id = $2', [applicationId, userId]);
};

module.exports = { getAll, create, getById, update, remove };
