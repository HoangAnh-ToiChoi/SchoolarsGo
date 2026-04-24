/**
 * ProfileRepository — VÙNG 2 (Controller → Service → Repository → DB)
 *
 * Lớp này CHỨA TOÀN BỘ SQL của module Profile.
 * KHÔNG viết SQL ở bất kỳ tầng nào khác (Service/Controller).
 *
 * Public methods — Service gọi:
 *   findByUserId(userId)      → profile object kèm documents
 *   upsertProfile(userId, updates) → profile đã upsert
 *
 * Private helpers — nội bộ:
 *   #buildProfileUpdateSets(updates) → { cols[], values[] }
 */
const BaseRepository = require('./base.repository');

class ProfileRepository extends BaseRepository {
  constructor(db) {
    super(db, 'profiles');
  }

  // ─── PUBLIC — Service gọi ────────────────────────────────────────────────

  /**
   * Lấy profile kèm danh sách documents
   * Nếu chưa có → tạo mới bằng upsert
   */
  async findByUserId(userId) {
    let profile = await this.db.queryOne(
      'SELECT * FROM profiles WHERE user_id = $1',
      [userId]
    );

    if (!profile) {
      profile = await this.db.queryOne(
        `INSERT INTO profiles (user_id)
         VALUES ($1)
         ON CONFLICT (user_id) DO UPDATE SET user_id = $1
         RETURNING *`,
        [userId]
      );
    }

    const docsResult = await this.db.query(
      'SELECT * FROM documents WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    return { ...profile, documents: docsResult.rows };
  }

  /**
   * Upsert profile (hỗ trợ cả tạo mới và cập nhật)
   * Trả về profile đã upsert.
   * Side effect: cập nhật full_name trong bảng users nếu có trong updates.
   */
  async upsertProfile(userId, updates) {
    const { cols, values } = this.#buildProfileUpdateSets(updates);

    if (cols.length === 0) {
      let profile = await this.db.queryOne(
        'SELECT * FROM profiles WHERE user_id = $1',
        [userId]
      );
      if (!profile) {
        profile = await this.db.queryOne(
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
    // $1 = user_id, $2..$n = các giá trị field
    const insertPlaceholders = [`$${1}`, ...values.map((_, i) => `$${i + 2}`)];
    const insertValues = [userId, ...values];

    const profile = await this.db.queryOne(
      `INSERT INTO profiles (${insertCols.join(', ')})
       VALUES (${insertPlaceholders.join(', ')})
       ON CONFLICT (user_id) DO UPDATE SET ${setClauses.join(', ')}
       RETURNING *`,
      insertValues
    );

    if (updates.full_name) {
      await this.db.query(
        'UPDATE users SET full_name = $1, updated_at = now() WHERE id = $2',
        [updates.full_name, userId]
      );
    }

    return profile;
  }

  // ─── PRIVATE ─────────────────────────────────────────────────────────────

  /**
   * Xây whitelist fields + extract values từ updates object
   */
  #buildProfileUpdateSets(updates) {
    const allowedFields = [
      'bio', 'gpa', 'gpa_scale', 'english_level',
      'target_country', 'target_major', 'target_degree', 'target_intake',
    ];
    const cols = allowedFields.filter(k => updates[k] !== undefined);
    const values = cols.map(k => updates[k]);
    return { cols, values };
  }
}

module.exports = ProfileRepository;
