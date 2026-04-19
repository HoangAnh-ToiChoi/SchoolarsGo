const { query, queryOne } = require('../utils/db');

const PAGE_SIZE = 20;
const MAX_LIMIT = 50;

const getAll = async (filters, userId) => {
  const page = Math.max(1, Number(filters.page) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(filters.limit) || PAGE_SIZE));
  const offset = (page - 1) * limit;

  const conditions = ['is_active = true', 'deadline > NOW()'];
  const params = [];
  let idx = 1;

  if (filters.country) {
    conditions.push(`country ILIKE $${idx++}`);
    params.push(`%${filters.country}%`);
  }
  if (filters.degree) {
    conditions.push(`degree = $${idx++}`);
    params.push(filters.degree);
  }
  if (filters.field) {
    conditions.push(`field_of_study ILIKE $${idx++}`);
    params.push(`%${filters.field}%`);
  }
  if (filters.language) {
    conditions.push(`language = $${idx++}`);
    params.push(filters.language);
  }
  if (filters.min_gpa) {
    conditions.push(`min_gpa <= $${idx++}`);
    params.push(Number(filters.min_gpa));
  }
  if (filters.min_ielts) {
    conditions.push(`min_ielts <= $${idx++}`);
    params.push(Number(filters.min_ielts));
  }
  if (filters.deadline_from) {
    conditions.push(`deadline >= $${idx++}`);
    params.push(filters.deadline_from);
  }
  if (filters.deadline_to) {
    conditions.push(`deadline <= $${idx++}`);
    params.push(filters.deadline_to);
  }
  if (filters.amount_min) {
    conditions.push(`amount >= $${idx++}`);
    params.push(Number(filters.amount_min));
  }
  if (filters.coverage) {
    conditions.push(`coverage = $${idx++}`);
    params.push(filters.coverage);
  }
  if (filters.featured === 'true' || filters.featured === true) {
    conditions.push(`is_featured = true`);
  }
  if (filters.search) {
    conditions.push(`(title ILIKE $${idx} OR provider ILIKE $${idx})`);
    params.push(`%${filters.search}%`);
    idx++;
  }

  const where = `WHERE ${conditions.join(' AND ')}`;

  // Count total
  const countResult = await queryOne(
    `SELECT COUNT(*) as total FROM scholarships ${where}`,
    params
  );
  const total = parseInt(countResult.total, 10);
  const totalPages = Math.ceil(total / limit);

  // Fetch data
  const selectCols = [
    'id', 'title', 'provider', 'country', 'degree', 'amount', 'currency',
    'coverage', 'deadline', 'language', 'min_gpa', 'image_url', 'is_featured',
  ].join(', ');

  const data = await query(
    `SELECT ${selectCols} FROM scholarships ${where} ORDER BY deadline ASC LIMIT $${idx++} OFFSET $${idx}`,
    [...params, limit, offset]
  );

  let rows = data.rows;

  if (userId && rows.length > 0) {
    const savedRows = await query(
      `SELECT scholarship_id
       FROM saved_scholarships
       WHERE user_id = $1 AND scholarship_id = ANY($2::uuid[])`,
      [userId, rows.map((row) => row.id)]
    );
    const savedIds = new Set(savedRows.rows.map((row) => row.scholarship_id));
    rows = rows.map((row) => ({ ...row, is_saved: savedIds.has(row.id) }));
  } else {
    rows = rows.map((row) => ({ ...row, is_saved: false }));
  }

  return {
    data: rows,
    meta: { page, limit, total, totalPages },
  };
};

const getFeatured = async () => {
  const data = await query(
    `SELECT id, title, provider, country, degree, amount, currency, deadline, image_url, is_featured
     FROM scholarships
     WHERE is_active = true AND deadline >= now() AND is_featured = true
     ORDER BY deadline ASC
     LIMIT 6`
  );
  return data.rows;
};

const getCountries = async () => {
  const data = await query(
    `SELECT DISTINCT country FROM scholarships
     WHERE is_active = true AND country IS NOT NULL
     ORDER BY country ASC`
  );
  return data.rows.map((r) => r.country);
};

const getById = async (id, userId) => {
  const scholarship = await queryOne(
    'SELECT * FROM scholarships WHERE id = $1 AND is_active = true AND deadline > NOW()',
    [id]
  );

  if (!scholarship) {
    const err = new Error('Không tìm thấy học bổng');
    err.statusCode = 404;
    err.isOperational = true;
    throw err;
  }

  let isSaved = false;
  if (userId) {
    const saved = await queryOne(
      'SELECT id FROM saved_scholarships WHERE user_id = $1 AND scholarship_id = $2',
      [userId, id]
    );
    isSaved = !!saved;
  }

  return { ...scholarship, is_saved: isSaved };
};

module.exports = { getAll, getFeatured, getCountries, getById };
