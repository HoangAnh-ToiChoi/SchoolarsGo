const BaseRepository = require('./base.repository');

class AuthRepository extends BaseRepository {
  #db;

  constructor(db) {
    super(db, 'users');
    this.#db = db;
  }

  #query(sql, params) {
    return this.#db.query(sql, params);
  }

  #queryOne(sql, params) {
    return this.#db.queryOne(sql, params);
  }

  async findByEmail(email) {
    return this.#queryOne(`SELECT id FROM users WHERE email = $1`, [email]);
  }

  async findByEmailWithCredentials(email) {
    return this.#queryOne(
      `SELECT id, email, password_hash, full_name, avatar_url, phone,
              date_of_birth, role, created_at
       FROM users WHERE email = $1`,
      [email]
    );
  }

  async findById(id) {
    return this.#queryOne(
      `SELECT id, email, full_name, avatar_url, phone,
              date_of_birth, role, created_at
       FROM users WHERE id = $1`,
      [id]
    );
  }

  async createUser({ email, passwordHash, fullName }) {
    return this.#queryOne(
      `INSERT INTO users (email, password_hash, full_name, role)
       VALUES ($1, $2, $3, 'user')
       RETURNING id, email, full_name, role, created_at`,
      [email, passwordHash, fullName]
    );
  }

  async updateLastLogin(userId) {
    return this.#queryOne(
      `UPDATE users
       SET last_login_at = NOW()
       WHERE id = $1
       RETURNING id, email, full_name, role`,
      [userId]
    );
  }
}

module.exports = AuthRepository;
