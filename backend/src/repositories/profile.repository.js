/**
 * Profile Repository — bóc tách SQL từ profile.service.js
 *
 * Extends BaseRepository.
 * Quy tắc: KHÔNG viết SQL ở tầng Service/Controller.
 *
 * Table: profiles (primary key: user_id)
 * Related: documents (user_id), users (id = user_id)
 */

const BaseRepository = require('./base.repository');

class ProfileRepository extends BaseRepository {
  /**
   * @param {object} db - { query, queryOne, transaction }
   */
  constructor(db) {
    super(db, 'profiles');
  }

  /**
   * Lấy profile + danh sách documents của user.
   * Nếu chưa có profile → tạo mới bằng UPSERT để đảm bảo lúc nào cũng có row.
   *
   * @param {string} userId
   * @returns {Promise<{...profile, documents: any[]}>}
   */
  async getProfile(userId) {
    let profile = await this.db.queryOne(
      'SELECT * FROM profiles WHERE user_id = $1',
      [userId]
    );

    if (!profile) {
      profile = await this.db.queryOne(
        `INSERT INTO profiles (user_id)
         VALUES ($1)
         ON CONFLICT (user_id) DO UPDATE SET user_id = $1
         RETURNING *`,
        [userId]
      );
    }

    const docsResult = await this.db.query(
      'SELECT * FROM documents WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    return { ...profile, documents: docsResult.rows };
  }

  /**
   * Cập nhật profile (UPSERT — hỗ trợ cả tạo mới và cập nhật).
   * Nếu có full_name → cập nhật luôn bảng users.
   *
   * allowedFields đóng vai trò whitelist — ngăn SQL injection và trường không cho phép.
   *
   * @param {string} userId
   * @param {object} updates - các trường muốn cập nhật
   * @returns {Promise<any>} profile đã được cập nhật
   */
  async updateProfile(userId, updates) {
    const allowedFields = [
      'bio', 'gpa', 'gpa_scale', 'english_level',
      'target_country', 'target_major', 'target_degree', 'target_intake',
    ];

    const fieldsToUpdate = allowedFields.filter(k => updates[k] !== undefined);

    if (fieldsToUpdate.length === 0) {
      let profile = await this.db.queryOne(
        'SELECT * FROM profiles WHERE user_id = $1',
        [userId]
      );
      if (!profile) {
        profile = await this.db.queryOne(
          `INSERT INTO profiles (user_id) VALUES ($1)
           ON CONFLICT (user_id) DO UPDATE SET user_id = $1 RETURNING *`,
          [userId]
        );
      }
      return profile;
    }

    const setClauses = fieldsToUpdate.map((k, i) => `${k} = $${i + 2}`);
    const insertCols = ['user_id', ...fieldsToUpdate];
    const insertValues = [userId, ...fieldsToUpdate.map(k => updates[k])];
    const insertPlaceholders = insertValues.map((_, i) => `$${i + 1}`);

    setClauses.push('updated_at = now()');

    const profile = await this.db.queryOne(
      `INSERT INTO profiles (${insertCols.join(', ')})
       VALUES (${insertPlaceholders.join(', ')})
       ON CONFLICT (user_id) DO UPDATE SET ${setClauses.join(', ')}
       RETURNING *`,
      insertValues
    );

    if (updates.full_name) {
      await this.db.query(
        'UPDATE users SET full_name = $1, updated_at = now() WHERE id = $2',
        [updates.full_name, userId]
      );
    }

    return profile;
  }
}

module.exports = ProfileRepository;
