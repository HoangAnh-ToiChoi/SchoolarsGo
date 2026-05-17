const BaseRepository = require('./base.repository');

class RecommendRepository extends BaseRepository {
  #db;

  constructor(db) {
    super(db, 'profiles');
    this.#db = db;
  }

  #query(sql, params) {
    return this.#db.query(sql, params);
  }

  #queryOne(sql, params) {
    return this.#db.queryOne(sql, params);
  }

  async findProfileByUserId(userId) {
    return this.#queryOne('SELECT * FROM profiles WHERE user_id = $1', [userId]);
  }

  async findActiveScholarships(limit = 200) {
    const result = await this.#query(
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
