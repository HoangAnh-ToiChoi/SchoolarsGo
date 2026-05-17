const BaseRepository = require('./base.repository');

class SavedRepository extends BaseRepository {
  #db;

  constructor(db) {
    super(db, 'saved_scholarships');
    this.#db = db;
  }

  #query(sql, params) {
    return this.#db.query(sql, params);
  }

  #queryOne(sql, params) {
    return this.#db.queryOne(sql, params);
  }

  async findAllByUser(userId) {
    const result = await this.#query(
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

  async findByUserAndScholarship(userId, scholarshipId) {
    return this.#queryOne(
      `SELECT * FROM saved_scholarships WHERE user_id = $1 AND scholarship_id = $2`,
      [userId, scholarshipId]
    );
  }

  async create({ userId, scholarshipId, note }) {
    try {
      return await this.#queryOne(
        `INSERT INTO saved_scholarships (user_id, scholarship_id, note)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [userId, scholarshipId, note || null]
      );
    } catch (err) {
      if (err.code === '23505' || err.constraint === 'saved_scholarships_user_id_scholarship_id_key') {
        const error = new Error('SCHOLARSHIP_ALREADY_SAVED');
        error.isOperational = true;
        throw error;
      }
      throw err;
    }
  }

  async deleteByUserAndScholarship(userId, scholarshipId) {
    const result = await this.#query(
      `DELETE FROM saved_scholarships WHERE user_id = $1 AND scholarship_id = $2 RETURNING id`,
      [userId, scholarshipId]
    );
    return result.rowCount;
  }

  async scholarshipExists(scholarshipId) {
    const result = await this.#queryOne(`SELECT id FROM scholarships WHERE id = $1`, [scholarshipId]);
    return result !== null;
  }

  async getScholarshipDetails(scholarshipId) {
    return this.#queryOne(
      `SELECT id as scholarship_id, title, provider, country, degree, amount, currency, deadline, image_url, is_featured
       FROM scholarships WHERE id = $1`,
      [scholarshipId]
    );
  }
}

module.exports = SavedRepository;
