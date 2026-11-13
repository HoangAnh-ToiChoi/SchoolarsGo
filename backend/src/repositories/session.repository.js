class SessionRepository {
  #db;

  constructor(db) {
    this.#db = db;
  }

  async createWithLimit({ userId, refreshTokenHash, expiresAt, deviceName }) {
    const client = await this.#db.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT id FROM users WHERE id = $1 FOR UPDATE', [userId]);
      await client.query(
        `UPDATE user_sessions SET revoked_at = now(), revoked_reason = 'device_limit'
         WHERE id IN (SELECT id FROM user_sessions WHERE user_id = $1 AND revoked_at IS NULL
         AND expires_at > now() ORDER BY last_used_at DESC OFFSET 2)`,
        [userId]
      );
      const { rows } = await client.query(
        `INSERT INTO user_sessions (user_id, refresh_token_hash, expires_at, device_name)
         VALUES ($1, $2, $3, $4) RETURNING id, user_id, refresh_token_hash, expires_at`,
        [userId, refreshTokenHash, expiresAt, deviceName]
      );
      await client.query('COMMIT');
      return rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  findById(id) {
    return this.#db.queryOne('SELECT * FROM user_sessions WHERE id = $1', [id]);
  }

  async rotate(id, { refreshTokenHash, previousTokenHash, expiresAt }) {
    return this.#db.queryOne(
      `UPDATE user_sessions SET refresh_token_hash = $2, previous_token_hash = $3,
       rotated_at = now(), expires_at = $4, last_used_at = now()
       WHERE id = $1 AND revoked_at IS NULL RETURNING *`,
      [id, refreshTokenHash, previousTokenHash, expiresAt]
    );
  }

  revoke(id, reason) {
    return this.#db.queryOne(
      `UPDATE user_sessions SET revoked_at = now(), revoked_reason = $2
       WHERE id = $1 AND revoked_at IS NULL RETURNING id`,
      [id, reason]
    );
  }

  async revokeAllForUser(userId, reason) {
    const result = await this.#db.query(
      `UPDATE user_sessions SET revoked_at = now(), revoked_reason = $2
       WHERE user_id = $1 AND revoked_at IS NULL`,
      [userId, reason]
    );
    return result.rowCount;
  }

  listActive(userId) {
    return this.#db.query(
      `SELECT id, device_name, last_used_at, created_at FROM user_sessions
       WHERE user_id = $1 AND revoked_at IS NULL AND expires_at > now()
       ORDER BY last_used_at DESC LIMIT 3`,
      [userId]
    ).then(result => result.rows);
  }

  async deleteOld() {
    const result = await this.#db.query(
      `DELETE FROM user_sessions WHERE expires_at < now() OR revoked_at < now() - interval '7 days'`
    );
    return result.rowCount;
  }
}

module.exports = SessionRepository;
