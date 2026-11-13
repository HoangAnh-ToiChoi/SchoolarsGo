'use strict';

/**
 * BƯỚC 7 — Ghi vào bảng `scholarships`.
 *
 *   saveRows(store, rows)  quyết định từng dòng:
 *                            đã có bài cùng link        → LÀM MỚI (hạn nộp, điểm, trạng thái)
 *                            đã có học bổng cùng khoá   → BỎ QUA (trang khác đã đăng, trang ưu tiên hơn thắng)
 *                            chưa có                    → THÊM MỚI
 *   createStore(db)        toàn bộ câu SQL của module kéo dữ liệu
 */

async function saveRows(store, rows, { dryRun = false } = {}) {
  if (rows.length === 0) return { inserted: 0, updated: 0, skipped: 0 };

  const existing = await store.findExisting({
    dedupKeys: rows.map((r) => r.dedup_key),
    sourceUrls: rows.map((r) => r.source_url),
  });
  const existingByUrl = new Map(existing.filter((e) => e.source_url).map((e) => [e.source_url, e]));
  const existingKeys = new Set(existing.filter((e) => e.dedup_key).map((e) => e.dedup_key));

  const toInsert = [];
  const toUpdate = [];
  let skipped = 0;
  for (const row of rows) {
    const sameUrl = existingByUrl.get(row.source_url);
    if (sameUrl) toUpdate.push({ ...row, id: sameUrl.id });
    else if (existingKeys.has(row.dedup_key)) skipped++;
    else toInsert.push(row);
  }

  if (dryRun) return { inserted: toInsert.length, updated: toUpdate.length, skipped };

  const inserted = await store.insertMany(toInsert);
  const updated = await store.updateMany(toUpdate);
  // insertMany bỏ qua dòng trùng khoá duy nhất trong DB → tính vào "bỏ qua"
  return { inserted, updated, skipped: skipped + (toInsert.length - inserted) };
}

// Cột ghi khi thêm mới (thứ tự cố định để ghép $1, $2...)
const INSERT_COLUMNS = [
  'title', 'provider', 'country', 'degree', 'coverage', 'deadline', 'language',
  'min_gpa', 'min_ielts', 'summary', 'source', 'source_url', 'source_priority',
  'published_at', 'relevance_score', 'dedup_key', 'is_active', 'is_featured',
];
const INSERT_CHUNK = 100; // mỗi câu INSERT tối đa 100 dòng

/** @param {{ query: Function }} db kết nối pg (src/config/database.config.js) */
function createStore(db) {
  return {
    /** Học bổng đã có, trùng khoá chống trùng hoặc trùng link bài. */
    async findExisting({ dedupKeys, sourceUrls }) {
      if (dedupKeys.length === 0 && sourceUrls.length === 0) return [];
      const { rows } = await db.query(
        `SELECT id, dedup_key, source_url FROM scholarships
          WHERE dedup_key = ANY($1::text[]) OR source_url = ANY($2::text[])`,
        [dedupKeys, sourceUrls]
      );
      return rows;
    },

    /** @returns số dòng thực sự được thêm (trùng khoá duy nhất thì bỏ qua) */
    async insertMany(rows) {
      let inserted = 0;
      for (let i = 0; i < rows.length; i += INSERT_CHUNK) {
        const params = [];
        const tuples = rows.slice(i, i + INSERT_CHUNK).map((row) => {
          const placeholders = INSERT_COLUMNS.map((column) => {
            params.push(row[column] ?? null);
            return `$${params.length}`;
          });
          return `(${placeholders.join(', ')})`;
        });
        const result = await db.query(
          `INSERT INTO scholarships (${INSERT_COLUMNS.join(', ')})
           VALUES ${tuples.join(', ')}
           ON CONFLICT DO NOTHING`,
          params
        );
        inserted += result.rowCount;
      }
      return inserted;
    },

    async updateMany(rows) {
      let updated = 0;
      for (const row of rows) {
        const result = await db.query(
          `UPDATE scholarships
              SET deadline = $2, relevance_score = $3, is_active = $4, summary = $5, updated_at = now()
            WHERE id = $1`,
          [row.id, row.deadline, row.relevance_score, row.is_active, row.summary]
        );
        updated += result.rowCount;
      }
      return updated;
    },

    /** Tắt (không xoá) học bổng đã quá hạn. Chạy mỗi đêm. */
    async deactivateExpired() {
      const result = await db.query(
        `UPDATE scholarships SET is_active = false, updated_at = now()
          WHERE is_active = true AND deadline IS NOT NULL AND deadline < now()`
      );
      return result.rowCount;
    },

    /** Nhật ký mỗi lượt kéo (bảng ingestion_runs): lấy bao nhiêu, loại vì luật gì, thêm bao nhiêu. */
    async recordRun(run) {
      await db.query(
        `INSERT INTO ingestion_runs (source, dry_run, started_at, finished_at, fetched, rejected, inserted, updated, skipped, error)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10)`,
        [
          run.source, run.dryRun, run.startedAt, run.finishedAt, run.fetched,
          JSON.stringify(run.rejected), run.inserted, run.updated, run.skipped, run.error ?? null,
        ]
      );
    },
  };
}

module.exports = { saveRows, createStore };
