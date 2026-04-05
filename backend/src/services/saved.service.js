const { query, queryOne } = require('../utils/db');

const getAll = async (userId) => {
  const data = await query(
    `SELECT ss.id, ss.note, ss.created_at,
            s.id as scholarship_id, s.title, s.provider, s.country, s.degree,
            s.amount, s.currency, s.deadline, s.image_url, s.is_featured
     FROM saved_scholarships ss
     JOIN scholarships s ON ss.scholarship_id = s.id
     WHERE ss.user_id = $1
     ORDER BY ss.created_at DESC`,
    [userId]
  );
  return data.rows;
};

const save = async (userId, scholarshipId, note) => {
  const scholarship = await queryOne(
    'SELECT id, title FROM scholarships WHERE id = $1',
    [scholarshipId]
  );

  if (!scholarship) {
    const err = new Error('Không tìm thấy học bổng');
    err.statusCode = 404;
    err.isOperational = true;
    throw err;
  }

  const existing = await queryOne(
    'SELECT id FROM saved_scholarships WHERE user_id = $1 AND scholarship_id = $2',
    [userId, scholarshipId]
  );

  if (existing) {
    const err = new Error(`Bạn đã lưu học bổng "${scholarship.title}" rồi`);
    err.statusCode = 409;
    err.isOperational = true;
    throw err;
  }

  const saved = await queryOne(
    `INSERT INTO saved_scholarships (user_id, scholarship_id, note)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [userId, scholarshipId, note || null]
  );

  // Lấy scholarship details
  const scholarshipDetails = await queryOne(
    `SELECT id as scholarship_id, title, provider, country, degree, amount, currency, deadline, image_url, is_featured
     FROM scholarships WHERE id = $1`,
    [scholarshipId]
  );

  return { ...saved, scholarship: scholarshipDetails };
};

const remove = async (userId, scholarshipId) => {
  const existing = await queryOne(
    'SELECT id FROM saved_scholarships WHERE user_id = $1 AND scholarship_id = $2',
    [userId, scholarshipId]
  );

  if (!existing) {
    const err = new Error('Không tìm thấy scholarship trong danh sách đã lưu');
    err.statusCode = 404;
    err.isOperational = true;
    throw err;
  }

  await query('DELETE FROM saved_scholarships WHERE user_id = $1 AND scholarship_id = $2', [userId, scholarshipId]);
};

module.exports = { getAll, save, remove };
