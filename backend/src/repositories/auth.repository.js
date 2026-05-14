/**
 * AuthRepository — TẦNG 1: Repository Pattern
 *
 * Mục đích: Tách toàn bộ Raw SQL ra khỏi Service
 * Quy tắc: KHÔNG chứa logic HTTP, KHÔNG import req/res
 *
 * DB Schema: users (id, email, password_hash, full_name, role, last_login_at, ...)
 */

const BaseRepository = require('./base.repository');

class AuthRepository extends BaseRepository {
  /**
   * @param {object} db - { query, queryOne, transaction } từ utils/db.js
   */
  constructor(db) {
    super(db, 'users');
  }

  /**
   * Tìm user theo email — chỉ lấy id (check duplicate)
   * @param {string} email
   * @returns {Promise<object|null>}
   */
  async findByEmail(email) {
    return this.db.queryOne(
      `SELECT id FROM users WHERE email = $1`,
      [email]
    );
  }

  /**
   * Tìm user theo email — lấy đầy đủ fields (dùng trong login)
   * @param {string} email
   * @returns {Promise<object|null>}
   */
  async findByEmailWithCredentials(email) {
    return this.db.queryOne(
      `SELECT id, email, password_hash, full_name, avatar_url, phone,
              date_of_birth, role, created_at
       FROM users WHERE email = $1`,
      [email]
    );
  }

  /**
   * Tìm user theo id — lấy đầy đủ public fields
   * @param {number} id
   * @returns {Promise<object|null>}
   */
  async findById(id) {
    return this.db.queryOne(
      `SELECT id, email, full_name, avatar_url, phone,
              date_of_birth, role, created_at
       FROM users WHERE id = $1`,
      [id]
    );
  }

  /**
   * Tạo user mới — mặc định role = 'user'
   * @param {object} data - { email, passwordHash, fullName }
   * @returns {Promise<object|null>}
   */
  async createUser({ email, passwordHash, fullName }) {
    return this.db.queryOne(
      `INSERT INTO users (email, password_hash, full_name, role)
       VALUES ($1, $2, $3, 'user')
       RETURNING id, email, full_name, role, created_at`,
      [email, passwordHash, fullName]
    );
  }

  /**
   * Cập nhật last_login_at = NOW() khi user đăng nhập thành công
   * @param {number} userId
   * @returns {Promise<object|null>}
   */
  async updateLastLogin(userId) {
    return this.db.queryOne(
      `UPDATE users
       SET last_login_at = NOW()
       WHERE id = $1
       RETURNING id, email, full_name, role`,
      [userId]
    );
  }
}

module.exports = AuthRepository;
