'use strict';

// Cột được ghi khi thêm học bổng mới (thứ tự cố định để ghép placeholder $1, $2...)
const INSERT_COLUMNS = [
  'title', 'provider', 'country', 'degree', 'coverage', 'deadline', 'language',
  'min_gpa', 'min_ielts', 'summary', 'source', 'source_url', 'source_priority',
  'published_at', 'relevance_score', 'dedup_key', 'is_active', 'is_featured',
];
const INSERT_CHUNK = 100;

/**
 * Toàn bộ SQL của module ingestion nằm ở đây (đúng quy tắc: SQL chỉ nằm trong repository).
 * Nhận `db` = { query } qua constructor, giống các repository khác của dự án.
 */
class IngestionRepository {
  #db;

  constructor(db) {
    this.#db = db;
  }

  /** Tìm các học bổng đã có (trùng khoá chống trùng hoặc trùng link bài). */
  async findExisting({ dedupKeys, sourceUrls }) {
    if (dedupKeys.length === 0 && sourceUrls.length === 0) return [];
    const { rows } = await this.#db.query(
      `SELECT id, dedup_key, source_url FROM scholarships
        WHERE dedup_key = ANY($1::text[]) OR source_url = ANY($2::text[])`,
      [dedupKeys, sourceUrls]
    );
    return rows;
  }

  /** Thêm học bổng mới; trùng khoá duy nhất nào thì bỏ qua. @returns số dòng thực sự được thêm */
  async insertMany(rows) {
    let inserted = 0;
    for (let i = 0; i < rows.length; i += INSERT_CHUNK) {
      const chunk = rows.slice(i, i + INSERT_CHUNK);
      const params = [];
      const tuples = chunk.map((row) => {
        const placeholders = INSERT_COLUMNS.map((column) => {
          params.push(row[column] ?? null);
          return `$${params.length}`;
        });
        return `(${placeholders.join(', ')})`;
      });
      const result = await this.#db.query(
        `INSERT INTO scholarships (${INSERT_COLUMNS.join(', ')})
         VALUES ${tuples.join(', ')}
         ON CONFLICT DO NOTHING`,
        params
      );
      inserted += result.rowCount;
    }
    return inserted;
  }

  /** Làm mới các học bổng đã có từ cùng bài đăng (hạn nộp, điểm, trạng thái). */
  async updateMany(rows) {
    let updated = 0;
    for (const row of rows) {
      const result = await this.#db.query(
        `UPDATE scholarships
            SET deadline = $2, relevance_score = $3, is_active = $4, summary = $5, updated_at = now()
          WHERE id = $1`,
        [row.id, row.deadline, row.relevance_score, row.is_active, row.summary]
      );
      updated += result.rowCount;
    }
    return updated;
  }

  /** Tắt (không xoá) học bổng đã quá hạn. */
  async deactivateExpired() {
    const result = await this.#db.query(
      `UPDATE scholarships SET is_active = false, updated_at = now()
        WHERE is_active = true AND deadline IS NOT NULL AND deadline < now()`
    );
    return result.rowCount;
  }

  async recordRun(run) {
    await this.#db.query(
      `INSERT INTO ingestion_runs (source, dry_run, started_at, finished_at, fetched, rejected, inserted, updated, skipped, error)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10)`,
      [
        run.source, run.dryRun, run.startedAt, run.finishedAt, run.fetched,
        JSON.stringify(run.rejected), run.inserted, run.updated, run.skipped, run.error ?? null,
      ]
    );
  }
}

module.exports = IngestionRepository;
