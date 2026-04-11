/**
 * Profile Service — dùng Raw SQL (pg pool) thay vì Supabase SDK
 * Chỉ dùng pg pool để query, bỏ qua RLS (pg pool dùng tài khoản admin)
 *
 * GET:  SELECT * FROM profiles WHERE user_id = $1
 * PUT:  INSERT ... ON CONFLICT (user_id) DO UPDATE (UPSERT)
 */

const { query, queryOne } = require('../utils/db');

/**
 * Lấy profile của user kèm danh sách documents
 * Nếu chưa có profile → tạo mới bằng UPSERT (upsert vào để đảm bảo lúc nào cũng có row)
 * @param {string} userId
 * @returns {Promise<{profile, documents: any[]}>}
 */
const getProfile = async (userId) => {
  let profile = await queryOne(
    'SELECT * FROM profiles WHERE user_id = $1',
    [userId]
  );

  // Nếu chưa có profile → tạo mới bằng upsert
  if (!profile) {
    profile = await queryOne(
      `INSERT INTO profiles (user_id)
       VALUES ($1)
       ON CONFLICT (user_id) DO UPDATE SET user_id = $1
       RETURNING *`,
      [userId]
    );
  }

  // Lấy danh sách documents
  const documents = await query(
    'SELECT * FROM documents WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );

  return { ...profile, documents: documents.rows };
};

/**
 * Cập nhật profile (UPSERT — hỗ trợ cả tạo mới và cập nhật)
 * Logic: INSERT ... ON CONFLICT (user_id) DO UPDATE
 *
 * @param {string} userId
 * @param {object} updates - các trường muốn cập nhật (chỉ những trường có trong body mới được xử lý)
 * @returns {Promise<any>} profile đã được cập nhật
 */
const updateProfile = async (userId, updates) => {
  // Chỉ lấy các trường THỰC SỰ có trong request body
  // allowedFields đóng vai trò whitelist — ngăn chặn SQL injection và trường không cho phép
  const allowedFields = [
    'bio', 'gpa', 'gpa_scale', 'english_level',
    'target_country', 'target_major', 'target_degree', 'target_intake',
  ];

  // Lọc ra chỉ các trường vừa nằm trong whitelist VỪA có giá trị trong updates
  const fieldsToUpdate = allowedFields.filter(k => updates[k] !== undefined);

  // Nếu không có trường nào thay đổi → upsert row rỗng (đảm bảo profile tồn tại)
  if (fieldsToUpdate.length === 0) {
    let profile = await queryOne('SELECT * FROM profiles WHERE user_id = $1', [userId]);
    if (!profile) {
      profile = await queryOne(
        `INSERT INTO profiles (user_id) VALUES ($1) ON CONFLICT (user_id) DO UPDATE SET user_id = $1 RETURNING *`,
        [userId]
      );
    }
    return profile;
  }

  // build SET clause cho ON CONFLICT DO UPDATE
  const setClauses = fieldsToUpdate.map((k, i) => `${k} = $${i + 2}`);

  // build danh sách cột INSERT — chỉ gồm user_id và các trường thực sự có trong updates
  const insertCols = ['user_id', ...fieldsToUpdate];

  // build mảng VALUES — thứ tự khớp hoàn toàn với insertCols
  // $1 = user_id, $2..$n = các giá trị field theo đúng thứ tự insertCols
  const insertValues = [userId, ...fieldsToUpdate.map(k => updates[k])];

  // build placeholders cho INSERT: $1, $2, $3...
  const insertPlaceholders = insertValues.map((_, i) => `$${i + 1}`);

  // Thêm updated_at vào SET clause (luôn cập nhật timestamp)
  setClauses.push(`updated_at = now()`);

  const profile = await queryOne(
    `INSERT INTO profiles (${insertCols.join(', ')})
     VALUES (${insertPlaceholders.join(', ')})
     ON CONFLICT (user_id) DO UPDATE SET ${setClauses.join(', ')}
     RETURNING *`,
    insertValues
  );

  // Cập nhật full_name trong bảng users nếu có trong body
  if (updates.full_name) {
    await query(
      'UPDATE users SET full_name = $1, updated_at = now() WHERE id = $2',
      [updates.full_name, userId]
    );
  }

  return profile;
};

module.exports = { getProfile, updateProfile };
