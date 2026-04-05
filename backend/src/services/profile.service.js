const { query, queryOne } = require('../utils/db');

const getProfile = async (userId) => {
  const profile = await queryOne(
    'SELECT * FROM profiles WHERE user_id = $1',
    [userId]
  );

  if (!profile) {
    // Tạo mới profile nếu chưa có
    const newProfile = await queryOne(
      `INSERT INTO profiles (user_id)
       VALUES ($1)
       RETURNING *`,
      [userId]
    );
    // Lấy luôn documents
    const documents = await query(
      'SELECT * FROM documents WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return { ...newProfile, documents: documents.rows };
  }

  // Lấy documents
  const documents = await query(
    'SELECT * FROM documents WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );

  return { ...profile, documents: documents.rows };
};

const updateProfile = async (userId, updates) => {
  // Xây dựng dynamic UPDATE
  const fields = [];
  const values = [];
  let idx = 1;

  const allowedFields = [
    'bio', 'gpa', 'gpa_scale', 'english_level',
    'target_country', 'target_major', 'target_degree', 'target_intake',
  ];

  for (const key of allowedFields) {
    if (updates[key] !== undefined) {
      fields.push(`${key} = $${idx}`);
      values.push(updates[key]);
      idx++;
    }
  }

  if (fields.length === 0) {
    const profile = await queryOne('SELECT * FROM profiles WHERE user_id = $1', [userId]);
    return profile;
  }

  fields.push(`updated_at = now()`);
  values.push(userId);

  const profile = await queryOne(
    `UPDATE profiles SET ${fields.join(', ')} WHERE user_id = $${idx} RETURNING *`,
    values
  );

  // Cập nhật full_name trong bảng users nếu có
  if (updates.full_name) {
    await query(
      'UPDATE users SET full_name = $1, updated_at = now() WHERE id = $2',
      [updates.full_name, userId]
    );
  }

  return profile;
};

module.exports = { getProfile, updateProfile };
