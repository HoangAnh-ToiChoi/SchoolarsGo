/**
 * BaseRepository — class cha dùng chung cho VÙNG 2 (Controller → Service → Repository → DB)
 *
 * Quy tắc:
 * - Nhận `db` (object chứa { query, queryOne, transaction }) qua constructor — KHÔNG tự require db
 * - Toàn bộ SQL chỉ nằm trong các file repository con (extends BaseRepository)
 * - KHÔNG viết SQL ở bất kỳ tầng nào khác
 */
class BaseRepository {
  /**
   * @param {object} db - { query, queryOne, transaction } từ utils/db.js
   * @param {string} tableName - Tên bảng để query
   */
  constructor(db, tableName) {
    this.db = db;
    this.table = tableName;
  }

  async findAll(conditions = '', params = []) {
    const sql = conditions
      ? `SELECT * FROM ${this.table} WHERE ${conditions}`
      : `SELECT * FROM ${this.table}`;
    const result = await this.db.query(sql, params);
    return result.rows;
  }

  async findById(id) {
    return this.db.queryOne(`SELECT * FROM ${this.table} WHERE id = $1`, [id]);
  }

  async count(conditions = '', params = []) {
    const sql = conditions
      ? `SELECT COUNT(*) as total FROM ${this.table} WHERE ${conditions}`
      : `SELECT COUNT(*) as total FROM ${this.table}`;
    const result = await this.db.queryOne(sql, params);
    return parseInt(result.total, 10);
  }

  async create(data, returning = '*') {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const cols = keys.map((_, i) => `$${i + 1}`).join(', ');
    const fields = keys.join(', ');
    const sql = `INSERT INTO ${this.table} (${fields}) VALUES (${cols}) RETURNING ${returning}`;
    return this.db.queryOne(sql, values);
  }

  async update(id, data, conditions = '', returning = '*') {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    const offset = keys.length + 1;
    let sql = `UPDATE ${this.table} SET ${setClause} WHERE id = $${offset}`;
    if (conditions) sql += ` AND ${conditions}`;
    sql += ` RETURNING ${returning}`;
    return this.db.queryOne(sql, [...values, id]);
  }

  async delete(id, conditions = '', returning = 'id') {
    let sql = `DELETE FROM ${this.table} WHERE id = $1`;
    if (conditions) sql += ` AND ${conditions}`;
    sql += ` RETURNING ${returning}`;
    return this.db.queryOne(sql, [id]);
  }
}

module.exports = BaseRepository;
