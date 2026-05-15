const BaseRepository = require('./base.repository');

class ScholarshipRepository extends BaseRepository {
  #db;

  constructor(db) {
    super(db, 'scholarships');
    this.#db = db;
  }

  #query(sql, params) {
    return this.#db.query(sql, params);
  }

  #queryOne(sql, params) {
    return this.#db.queryOne(sql, params);
  }

  async findAll(filters = {}, limit, offset, userId = null) {
    const { conditions, params } = this.#buildWhereClause(filters);
    const where = `WHERE ${conditions.join(' AND ')}`;

    const countResult = await this.#queryOne(
      `SELECT COUNT(*) as total FROM scholarships ${where}`,
      params
    );
    const total = parseInt(countResult.total, 10);

    const selectCols = [
      'id',
      'title',
      'provider',
      'country',
      'degree',
      'amount',
      'currency',
      'coverage',
      'deadline',
      'language',
      'min_gpa',
      'image_url',
      'is_featured',
    ].join(', ');

    const paramIdx = params.length + 1;
    const data = await this.#query(
      `SELECT ${selectCols} FROM scholarships ${where} ORDER BY deadline ASC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, limit, offset]
    );

    const rows = await this.#attachSavedStatus(data.rows, userId);
    return { data: rows, total };
  }

  async findFeatured() {
    const data = await this.#query(
      `SELECT id, title, provider, country, degree, amount, currency, deadline, image_url, is_featured
       FROM scholarships
       WHERE is_active = true AND deadline >= NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh' AND is_featured = true
       ORDER BY deadline ASC
       LIMIT 6`
    );
    return data.rows;
  }

  async findCountries() {
    const data = await this.#query(
      `SELECT DISTINCT country FROM scholarships
       WHERE is_active = true AND country IS NOT NULL
       ORDER BY country ASC`
    );
    return data.rows.map(r => r.country);
  }

  async findById(id, userId = null) {
    const scholarship = await this.#queryOne(
      `SELECT * FROM scholarships WHERE id = $1 AND is_active = true AND deadline > NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh'`,
      [id]
    );

    if (!scholarship) return null;

    const isSaved = await this.#checkSavedStatus(userId, id);
    return { ...scholarship, is_saved: isSaved };
  }

  #buildWhereClause(filters) {
    const conditions = ['is_active = true', `deadline > NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh'`];
    const params = [];
    let idx = 1;

    if (filters.country) {
      conditions.push(`country ILIKE $${idx++}`);
      params.push(`%${filters.country}%`);
    }
    if (filters.degree) {
      conditions.push(`degree = $${idx++}`);
      params.push(filters.degree);
    }
    if (filters.field) {
      conditions.push(`field_of_study ILIKE $${idx++}`);
      params.push(`%${filters.field}%`);
    }
    if (filters.language) {
      conditions.push(`language = $${idx++}`);
      params.push(filters.language);
    }
    if (filters.min_gpa) {
      conditions.push(`min_gpa <= $${idx++}`);
      params.push(Number(filters.min_gpa));
    }
    if (filters.min_ielts) {
      conditions.push(`min_ielts <= $${idx++}`);
      params.push(Number(filters.min_ielts));
    }
    if (filters.deadline_from) {
      conditions.push(`deadline >= $${idx++}`);
      params.push(filters.deadline_from);
    }
    if (filters.deadline_to) {
      conditions.push(`deadline <= $${idx++}`);
      params.push(filters.deadline_to);
    }
    if (filters.amount_min) {
      conditions.push(`amount >= $${idx++}`);
      params.push(Number(filters.amount_min));
    }
    if (filters.coverage) {
      conditions.push(`coverage = $${idx++}`);
      params.push(filters.coverage);
    }
    if (filters.featured === 'true' || filters.featured === true) {
      conditions.push(`is_featured = true`);
    }
    if (filters.search) {
      conditions.push(`(title ILIKE $${idx} OR provider ILIKE $${idx})`);
      params.push(`%${filters.search}%`);
    }

    return { conditions, params };
  }

  async #attachSavedStatus(rows, userId) {
    if (!userId || rows.length === 0) {
      return rows.map(row => ({ ...row, is_saved: false }));
    }

    const savedRows = await this.#query(
      `SELECT scholarship_id
       FROM saved_scholarships
       WHERE user_id = $1 AND scholarship_id = ANY($2::uuid[])`,
      [userId, rows.map(row => row.id)]
    );
    const savedIds = new Set(savedRows.rows.map(row => row.scholarship_id));
    return rows.map(row => ({ ...row, is_saved: savedIds.has(row.id) }));
  }

  async #checkSavedStatus(userId, scholarshipId) {
    if (!userId) return false;
    const saved = await this.#queryOne(
      'SELECT id FROM saved_scholarships WHERE user_id = $1 AND scholarship_id = $2',
      [userId, scholarshipId]
    );
    return !!saved;
  }
}

module.exports = ScholarshipRepository;
