/**
 * ApplicationRepository — VÙNG 2 (Controller → Service → Repository → DB)
 *
 * Quy tắc:
 * - extends BaseRepository
 * - Toàn bộ SQL nằm ở đây — KHÔNG nơi nào khác được viết SQL
 * - Nhận `db` qua constructor, KHÔNG tự require db
 * - Ném lỗi với mã cụ thể (UPPER_SNAKE) để Service/Controller bắt và xử lý
 */
const BaseRepository = require('./base.repository');

const APPLICATION_STATUSES = ['draft', 'submitted', 'under_review', 'interview', 'accepted', 'rejected', 'withdrawn'];

class ApplicationRepository extends BaseRepository {
  constructor(db) {
    super(db, 'applications');
    this.db = db;
  }

  /**
   * Lấy danh sách đơn của user (kèm phân trang, lọc theo status)
   */
  async findAllByUser(userId, { page = 1, limit = 20, status = null } = {}) {
    const offset = (page - 1) * limit;
    const params = [userId];
    let idx = 2;
    const conditions = ['a.user_id = $1'];

    if (status) {
      conditions.push(`a.status = $${idx++}`);
      params.push(status);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const countResult = await this.db.queryOne(
      `SELECT COUNT(*) AS total FROM applications a ${where}`,
      params
    );
    const total = parseInt(countResult.total, 10);

    params.push(limit, offset);
    const data = await this.db.query(
      `SELECT a.id, a.status, a.applied_at, a.notes, a.checklist,
              a.documents_used, a.result, a.created_at, a.updated_at,
              s.id AS scholarship_id, s.title AS scholarship_title,
              s.country, s.deadline, s.amount, s.image_url
       FROM applications a
       JOIN scholarships s ON a.scholarship_id = s.id
       ${where}
       ORDER BY a.created_at DESC
       LIMIT $${idx++} OFFSET $${idx}`,
      params
    );

    return {
      rows: data.rows,
      total,
    };
  }

  /**
   * Tạo đơn ứng tuyển mới (mặc định status = 'draft').
   * Bắt lỗi UNIQUE(user_id, scholarship_id) từ DB — ném 'APPLICATION_ALREADY_EXISTS'.
   */
  async create(userId, { scholarshipId, checklist, notes }) {
    const defaultChecklist = [
      { item: 'CV', done: false },
      { item: 'SOP', done: false },
      { item: 'Bảng điểm', done: false },
      { item: 'Thư giới thiệu', done: false },
      { item: 'IELTS Certificate', done: false },
      { item: 'Hộ chiếu', done: false },
    ];

    const payload = [userId, scholarshipId];
    const cols = 'user_id, scholarship_id, checklist, notes, status';
    const vals = '$1, $2, $3, $4, $5';
    const params = [
      userId,
      scholarshipId,
      JSON.stringify(checklist || defaultChecklist),
      notes || null,
      'draft',
    ];

    try {
      const result = await this.db.queryOne(
        `INSERT INTO applications (${cols}) VALUES (${vals}) RETURNING *`,
        params
      );
      return result;
    } catch (err) {
      if (err.code === '23505' || err.constraint === 'applications_user_id_scholarship_id_key') {
        const error = new Error('APPLICATION_ALREADY_EXISTS');
        error.isOperational = true;
        throw error;
      }
      throw err;
    }
  }

  /**
   * Tìm đơn theo id và user_id (bảo mật — chỉ user sở hữu mới xem được).
   */
  async findByIdAndUser(applicationId, userId) {
    return this.db.queryOne(
      `SELECT a.*,
              s.id AS scholarship_id, s.title AS scholarship_title,
              s.country, s.deadline, s.amount, s.image_url
       FROM applications a
       JOIN scholarships s ON a.scholarship_id = s.id
       WHERE a.id = $1 AND a.user_id = $2`,
      [applicationId, userId]
    );
  }

  /**
   * Cập nhật đơn (chỉ cập nhật các trường được truyền).
   * KHÔNG validate status ở tầng này — Service loại bỏ.
   */
  async updateByIdAndUser(applicationId, userId, updates) {
    const allowedFields = ['status', 'notes', 'checklist', 'documents_used', 'result', 'applied_at'];
    const fields = [];
    const values = [];
    let idx = 1;

    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        fields.push(`${key} = $${idx++}`);
        values.push(
          typeof updates[key] === 'object' ? JSON.stringify(updates[key]) : updates[key]
        );
      }
    }

    if (fields.length === 0) {
      return this.findByIdAndUser(applicationId, userId);
    }

    fields.push(`updated_at = now()`);
    values.push(applicationId, userId);

    return this.db.queryOne(
      `UPDATE applications SET ${fields.join(', ')}
       WHERE id = $${idx++} AND user_id = $${idx}
       RETURNING *`,
      values
    );
  }

  /**
   * Xóa đơn (kèm điều kiện user_id để bảo mật).
   * Trả về số dòng bị ảnh hưởng.
   */
  async deleteByIdAndUser(applicationId, userId) {
    const result = await this.db.query(
      `DELETE FROM applications WHERE id = $1 AND user_id = $2 RETURNING id`,
      [applicationId, userId]
    );
    return result.rowCount;
  }

  /**
   * Kiểm tra học bổng có tồn tại không (dùng trong Service để validate trước khi tạo).
   */
  async scholarshipExists(scholarshipId) {
    const result = await this.db.queryOne(
      `SELECT id FROM scholarships WHERE id = $1`,
      [scholarshipId]
    );
    return result !== null;
  }
}

module.exports = ApplicationRepository;
