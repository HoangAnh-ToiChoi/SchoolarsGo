/**
 * SavedRepository — VÙNG 2 (Controller → Service → Repository → DB)
 *
 * Quy tắc:
 * - extends BaseRepository
 * - Toàn bộ SQL nằm ở đây — KHÔNG nơi nào khác được viết SQL
 * - Nhận `db` qua constructor, KHÔNG tự require db
 * - Ném lỗi với mã cụ thể (UPPER_SNAKE) để Service/Controller bắt và xử lý
 */
const BaseRepository = require('./base.repository');

class SavedRepository extends BaseRepository {
  constructor(db) {
    super(db, 'saved_scholarships');
    this.db = db;
  }

  /**
   * Lấy danh sách scholarships đã lưu của user (kèm scholarship details)
   */
  async findAllByUser(userId) {
    const result = await this.db.query(
      `SELECT ss.id, ss.note, ss.created_at,
              s.id as scholarship_id, s.title, s.provider, s.country, s.degree,
              s.amount, s.currency, s.deadline, s.image_url, s.is_featured
       FROM saved_scholarships ss
       JOIN scholarships s ON ss.scholarship_id = s.id
       WHERE ss.user_id = $1
       ORDER BY ss.created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  /**
   * Tìm record saved cụ thể theo user + scholarship
   */
  async findByUserAndScholarship(userId, scholarshipId) {
    return this.db.queryOne(
      `SELECT * FROM saved_scholarships WHERE user_id = $1 AND scholarship_id = $2`,
      [userId, scholarshipId]
    );
  }

  /**
   * Tạo record saved mới
   * Bắt lỗi UNIQUE constraint — ném 'SCHOLARSHIP_ALREADY_SAVED'
   */
  async create({ userId, scholarshipId, note }) {
    try {
      const result = await this.db.queryOne(
        `INSERT INTO saved_scholarships (user_id, scholarship_id, note)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [userId, scholarshipId, note || null]
      );
      return result;
    } catch (err) {
      if (err.code === '23505' || err.constraint === 'saved_scholarships_user_id_scholarship_id_key') {
        const error = new Error('SCHOLARSHIP_ALREADY_SAVED');
        error.isOperational = true;
        throw error;
      }
      throw err;
    }
  }

  /**
   * Xóa record saved theo user + scholarship
   * Trả về số dòng bị ảnh hưởng
   */
  async deleteByUserAndScholarship(userId, scholarshipId) {
    const result = await this.db.query(
      `DELETE FROM saved_scholarships WHERE user_id = $1 AND scholarship_id = $2 RETURNING id`,
      [userId, scholarshipId]
    );
    return result.rowCount;
  }

  /**
   * Kiểm tra scholarship có tồn tại không
   */
  async scholarshipExists(scholarshipId) {
    const result = await this.db.queryOne(
      `SELECT id FROM scholarships WHERE id = $1`,
      [scholarshipId]
    );
    return result !== null;
  }

  /**
   * Lấy scholarship details (dùng sau khi create saved)
   */
  async getScholarshipDetails(scholarshipId) {
    return this.db.queryOne(
      `SELECT id as scholarship_id, title, provider, country, degree, amount, currency, deadline, image_url, is_featured
       FROM scholarships WHERE id = $1`,
      [scholarshipId]
    );
  }
}

module.exports = SavedRepository;
