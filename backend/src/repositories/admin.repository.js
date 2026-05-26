/**
 * AdminRepository — TẦNG 3: Database Access (Raw SQL)
 *
 * Mục đích: Tất cả SQL của Admin Module. KHÔNG chứa business logic.
 *
 * Tiêu chí OOP:
 * [1] Phân tách tầng — chỉ chứa SQL, không logic.
 * [5] An toàn SQL — 100% parameterized queries ($1, $2...). KHÔNG string interpolation.
 * [6] Abstraction — bên trong Repository dùng gì, Service không cần biết.
 *
 * Lưu ý: AdminRepository KHÔNG kế thừa BaseRepository vì không tái sử dụng
 * bất kỳ method chung nào (findAll, findById, create...).
 * Việc giữ extends chỉ tạo ra coupling thừa thãi.
 */

class AdminRepository {
  /**
   * @param {object} db - Database driver instance (pg pool hoặc tương đương)
   */
  constructor(db) {
    this.#db = db;
  }


  // ═══════════════════════════════════════════════════════════
  // DASHBOARD STATS
  // ═══════════════════════════════════════════════════════════

  async countTotalUsers() {
    const sql = 'SELECT COUNT(*) AS total FROM users';
    const result = await this.#queryOne(sql);
    return parseInt(result.total, 10);
  }

  async countNewUsersThisWeek() {
    const sql = `
      SELECT COUNT(*) AS total FROM users
      WHERE created_at >= DATE_TRUNC('week', NOW())
    `;
    const result = await this.#queryOne(sql);
    return parseInt(result.total, 10);
  }

  async countTotalScholarships() {
    const sql = 'SELECT COUNT(*) AS total FROM scholarships WHERE is_active = true';
    const result = await this.#queryOne(sql);
    return parseInt(result.total, 10);
  }

  async countActiveScholarships() {
    const sql = `
      SELECT COUNT(*) AS total FROM scholarships
      WHERE is_active = true AND deadline > NOW()
    `;
    const result = await this.#queryOne(sql);
    return parseInt(result.total, 10);
  }

  async countTotalApplications() {
    const sql = 'SELECT COUNT(*) AS total FROM applications';
    const result = await this.#queryOne(sql);
    return parseInt(result.total, 10);
  }

  async countApplicationsByStatus() {
    const sql = `
      SELECT status, COUNT(*) AS count
      FROM applications
      GROUP BY status
    `;
    return (await this.#query(sql)).rows;
  }

  async getUserRegistrationsByWeek() {
    const sql = `
      SELECT TO_CHAR(DATE_TRUNC('week', created_at), 'YYYY-"W"IW') AS week,
             COUNT(*) AS count
      FROM users
      WHERE created_at >= NOW() - INTERVAL '12 weeks'
      GROUP BY DATE_TRUNC('week', created_at)
      ORDER BY DATE_TRUNC('week', created_at)
    `;
    return (await this.#query(sql)).rows;
  }

  async getApplicationsByStatusChart() {
    const sql = `
      SELECT status, COUNT(*) AS count
      FROM applications
      GROUP BY status
    `;
    return (await this.#query(sql)).rows;
  }

  // ═══════════════════════════════════════════════════════════
  // USER MANAGEMENT
  // ═══════════════════════════════════════════════════════════

  async findUsers(filters) {
    const { page = 1, limit = 20, role, search, status } = filters;
    const params = [];
    const conditions = [];
    let idx = 1;

    // status filter xác định is_active; mặc định hiển thị tất cả users
    if (status !== undefined) {
      conditions.push(`is_active = $${idx++}`);
      params.push(status === 'active');
    }
    // No else — show all users by default

    if (role) {
      conditions.push(`role = $${idx++}`);
      params.push(role);
    }
    if (search) {
      conditions.push(`(email ILIKE $${idx} OR full_name ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await this.#queryOne(
      `SELECT COUNT(*) AS total FROM users ${whereClause}`,
      params
    );
    const total = parseInt(countResult.total, 10);

    params.push(limit, (page - 1) * limit);
    const users = await this.#query(
      `SELECT id, email, full_name, role, is_active, avatar_url, phone,
              date_of_birth, last_login_at, created_at, updated_at
       FROM users
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${idx++} OFFSET $${idx}`,
      params
    );

    return { users: users.rows, total };
  }

  async findUserById(id) {
    const sql = `
      SELECT id, email, full_name, role, is_active, avatar_url, phone,
             date_of_birth, last_login_at, created_at, updated_at
      FROM users
      WHERE id = $1
    `;
    return this.#queryOne(sql, [id]);
  }

  async updateUserRole(id, role) {
    const sql = `
      UPDATE users
      SET role = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, email, full_name, role, created_at
    `;
    return this.#queryOne(sql, [role, id]);
  }

  async updateUserStatus(id, isActive) {
    const sql = `
      UPDATE users
      SET is_active = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, email, full_name, role, is_active, created_at
    `;
    return this.#queryOne(sql, [isActive, id]);
  }

  // ═══════════════════════════════════════════════════════════
  // SCHOLARSHIP MANAGEMENT
  // ═══════════════════════════════════════════════════════════

  async createScholarship(data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');

    const sql = `
      INSERT INTO scholarships (${keys.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;
    return this.#queryOne(sql, values);
  }

  async updateScholarship(id, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');

    const sql = `
      UPDATE scholarships
      SET ${setClause}, updated_at = NOW()
      WHERE id = $${keys.length + 1} AND is_active = true
      RETURNING *
    `;
    return this.#queryOne(sql, [...values, id]);
  }

  async updateScholarshipFeatured(id, isFeatured) {
    const sql = `
      UPDATE scholarships
      SET is_featured = $1, updated_at = NOW()
      WHERE id = $2 AND is_active = true
      RETURNING id, title, is_featured, updated_at
    `;
    return this.#queryOne(sql, [isFeatured, id]);
  }

  async softDeleteScholarship(id) {
    const sql = `
      UPDATE scholarships
      SET is_active = false, updated_at = NOW()
      WHERE id = $1 AND is_active = true
      RETURNING id, title
    `;
    return this.#queryOne(sql, [id]);
  }

  // ═══════════════════════════════════════════════════════════
  // PRIVATE — Encapsulation (Tiêu chí 3)
  // ═══════════════════════════════════════════════════════════

  /**
   * @param {string} sql
   * @param {unknown[]} [params]
   */
  async #query(sql, params = []) {
    return this.#db.query(sql, params);
  }

  /**
   * @param {string} sql
   * @param {unknown[]} [params]
   */
  async #queryOne(sql, params = []) {
    return this.#db.queryOne(sql, params);
  }

  /** @type {object} */
  #db;
}

module.exports = AdminRepository;
