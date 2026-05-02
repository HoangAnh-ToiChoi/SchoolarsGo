/**
 * SavedScholarshipRepository — Bước 4: Refactor Saved Scholarships (Tầng Repository)
 *
 * Kế thừa BaseRepository, nhận db qua constructor.
 * Toàn bộ SQL liên quan đến saved_scholarships.
 */
const BaseRepository = require('./base.repository');

class SavedScholarshipRepository extends BaseRepository {
  /**
   * @param {object} db - { query, queryOne, transaction } từ utils/db.js
   */
  constructor(db) {
    super(db, 'saved_scholarships');
  }

  // ─── PUBLIC ─── (Service gọi)

  /**
   * Lấy danh sách scholarships đã lưu của user.
   * @param {string} userId
   * @returns {Promise<Array>}
   */
  async findAllByUser(userId) {
    return this.db.query(
      `SELECT ss.id, ss.note, ss.created_at,
              s.id AS scholarship_id, s.title, s.provider, s.country, s.degree,
              s.amount, s.currency, s.deadline, s.image_url, s.is_featured
       FROM saved_scholarships ss
       JOIN scholarships s ON ss.scholarship_id = s.id
       WHERE ss.user_id = $1
       ORDER BY ss.created_at DESC`,
      [userId]
    );
  }

  /**
   * Tạo mới 1 saved scholarship.
   * @param {string} userId
   * @param {string} scholarshipId
   * @param {string|null} note
   * @returns {Promise<object>} - row vừa insert
   */
  async create(userId, scholarshipId, note) {
    return this.db.queryOne(
      `INSERT INTO saved_scholarships (user_id, scholarship_id, note)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, scholarshipId, note || null]
    );
  }

  /**
   * Xóa 1 saved scholarship.
   * @param {string} userId
   * @param {string} scholarshipId
   */
  async deleteByUserAndScholarship(userId, scholarshipId) {
    return this.db.query(
      `DELETE FROM saved_scholarships
       WHERE user_id = $1 AND scholarship_id = $2`,
      [userId, scholarshipId]
    );
  }

  // ─── PUBLIC ─── (Service gọi)

  /**
   * Kiểm tra scholarship có tồn tại không.
   * @param {string} scholarshipId
   * @returns {Promise<object|null>}
   */
  findScholarshipById(scholarshipId) {
    return this.db.queryOne(
      `SELECT id, title FROM scholarships WHERE id = $1`,
      [scholarshipId]
    );
  }

  /**
   * Kiểm tra đã saved chưa.
   * @param {string} userId
   * @param {string} scholarshipId
   * @returns {Promise<object|null>}
   */
  findExisting(userId, scholarshipId) {
    return this.db.queryOne(
      `SELECT id FROM saved_scholarships WHERE user_id = $1 AND scholarship_id = $2`,
      [userId, scholarshipId]
    );
  }

  /**
   * Lấy chi tiết scholarship (dùng sau khi insert).
   * @param {string} scholarshipId
   * @returns {Promise<object|null>}
   */
  getScholarshipDetails(scholarshipId) {
    return this.db.queryOne(
      `SELECT id AS scholarship_id, title, provider, country, degree,
              amount, currency, deadline, image_url, is_featured
       FROM scholarships WHERE id = $1`,
      [scholarshipId]
    );
  }
}

module.exports = SavedScholarshipRepository;
