const BaseRepository = require('./base.repository');

class ProfileRepository extends BaseRepository {
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

  async findByUserId(userId) {
    let profile = await this.#queryOne('SELECT * FROM profiles WHERE user_id = $1', [userId]);

    if (!profile) {
      profile = await this.#queryOne(
        `INSERT INTO profiles (user_id)
         VALUES ($1)
         ON CONFLICT (user_id) DO UPDATE SET user_id = $1
         RETURNING *`,
        [userId]
      );
    }

    const docsResult = await this.#query(
      'SELECT * FROM documents WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    return { ...profile, documents: docsResult.rows };
  }

  async upsertProfile(userId, updates) {
    const { cols, values } = this.#buildProfileUpdateSets(updates);

    if (cols.length === 0) {
      let profile = await this.#queryOne('SELECT * FROM profiles WHERE user_id = $1', [userId]);
      if (!profile) {
        profile = await this.#queryOne(
          `INSERT INTO profiles (user_id) VALUES ($1)
           ON CONFLICT (user_id) DO UPDATE SET user_id = $1 RETURNING *`,
          [userId]
        );
      }
      return profile;
    }

    const setClauses = cols.map((c, i) => `${c} = $${i + 2}`);
    setClauses.push('updated_at = now()');

    const insertCols = ['user_id', ...cols];
    const insertPlaceholders = [`$1`, ...values.map((_, i) => `$${i + 2}`)];
    const insertValues = [userId, ...values];

    const profile = await this.#queryOne(
      `INSERT INTO profiles (${insertCols.join(', ')})
       VALUES (${insertPlaceholders.join(', ')})
       ON CONFLICT (user_id) DO UPDATE SET ${setClauses.join(', ')}
       RETURNING *`,
      insertValues
    );

    if (updates.full_name) {
      await this.#query('UPDATE users SET full_name = $1, updated_at = now() WHERE id = $2', [
        updates.full_name,
        userId,
      ]);
    }

    return profile;
  }

  #buildProfileUpdateSets(updates) {
    const allowedFields = [
      'bio',
      'gpa',
      'gpa_scale',
      'english_level',
      'target_country',
      'target_major',
      'target_degree',
      'target_intake',
    ];
    const cols = allowedFields.filter(k => updates[k] !== undefined);
    const values = cols.map(k => updates[k]);
    return { cols, values };
  }
}

module.exports = ProfileRepository;
