/**
 * RecommendRepository — VÙNG 2 (Repository → DB)
 *
 * Quy tắc:
 * - Kế thừa BaseRepository, nhận db qua constructor
 * - CHỈ có SQL — không có business logic
 * - Dùng Parameterized Queries ($1, $2...)
 */
const BaseRepository = require('./base.repository');

class RecommendRepository extends BaseRepository {
  constructor(db) {
    super(db, 'profiles');
  }

  /**
   * Lấy profile của user theo userId
   * @param {string|number} userId
   * @returns {Promise<object|null>}
   */
  async findProfileByUserId(userId) {
    return this.db.queryOne(
      'SELECT * FROM profiles WHERE user_id = $1',
      [userId]
    );
  }

  /**
   * Lấy danh sách scholarships đang active và chưa hết hạn
   * @param {number} limit
   * @returns {Promise<object[]>}
   */
  async findActiveScholarships(limit = 200) {
    const result = await this.db.query(
      `SELECT * FROM scholarships
       WHERE is_active = true AND deadline >= now()
       ORDER BY deadline ASC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  }
}

module.exports = RecommendRepository;
