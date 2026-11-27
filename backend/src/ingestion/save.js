/**
 * BƯỚC 7 — Ghi vào bảng `scholarships`.
 *
 *   saveRows(store, rows)  quyết định từng dòng:
 *                            admin đã sửa / ẩn (admin_locked_at)          → BỎ QUA, không bao giờ bật lại hay ghi đè (R08)
 *                            đã có bài cùng link                          → LÀM MỚI (hạn nộp, điểm, trạng thái)
 *                            cùng khoá, dòng cũ đã quá hạn (kỳ năm trước) → LÀM MỚI THEO KỲ (link, tiêu đề, hạn mới)
 *                            cùng khoá, dòng cũ còn hạn                   → BỎ QUA (trang khác đã đăng, trang ưu tiên hơn thắng)
 *                            chưa có                                      → THÊM MỚI
 *   createStore(db)        toàn bộ câu SQL của module kéo dữ liệu
 */

function isExpired(existing, now) {
  return Boolean(existing.deadline) && new Date(existing.deadline) < now;
}

/** Một dòng đã kéo về đi vào nhánh nào: insert | update | renew | skip. */
function decide(row, { byUrl, byKey }, now) {
  const sameUrl = byUrl.get(row.source_url);
  if (sameUrl) return sameUrl.admin_locked_at ? { action: 'skip' } : { action: 'update', id: sameUrl.id };

  const sameKey = row.dedup_key ? byKey.get(row.dedup_key) : null;
  if (!sameKey) return { action: 'insert' };
  if (sameKey.admin_locked_at || !isExpired(sameKey, now)) return { action: 'skip' };
  return { action: 'renew', id: sameKey.id };
}

function indexExisting(existing) {
  const byUrl = new Map(existing.filter((e) => e.source_url).map((e) => [e.source_url, e]));
  const byKey = new Map(existing.filter((e) => e.dedup_key).map((e) => [e.dedup_key, e]));
  return { byUrl, byKey };
}

async function saveRows(store, rows, { dryRun = false, now = new Date() } = {}) {
  if (rows.length === 0) return { inserted: 0, updated: 0, skipped: 0 };

  const existing = await store.findExisting({
    dedupKeys: rows.map((r) => r.dedup_key).filter(Boolean),
    sourceUrls: rows.map((r) => r.source_url),
  });
  const index = indexExisting(existing);

  const toInsert = [];
  const toUpdate = [];
  const toRenew = [];
  const renewedIds = new Set();
  let skipped = 0;
  for (const row of rows) {
    const { action, id } = decide(row, index, now);
    // Hai bài cùng khoá trong một lô chỉ làm mới dòng cũ một lần (bài của trang ưu tiên hơn đứng trước)
    const renewTwice = action === 'renew' && renewedIds.has(id);
    if (action === 'insert') toInsert.push(row);
    else if (action === 'update') toUpdate.push({ ...row, id });
    else if (action === 'renew' && !renewTwice) {
      toRenew.push({ ...row, id });
      renewedIds.add(id);
    } else skipped++;
  }

  const updatedCount = toUpdate.length + toRenew.length;
  if (dryRun) return { inserted: toInsert.length, updated: updatedCount, skipped };

  const inserted = await store.insertMany(toInsert);
  const updated = await store.updateMany(toUpdate);
  const renewed = await store.renewMany(toRenew);
  // insertMany bỏ qua dòng trùng khoá duy nhất trong DB; update/renew không ghi dòng vừa bị admin khóa → tính vào "bỏ qua"
  const notWritten = (toInsert.length - inserted) + (updatedCount - updated - renewed);
  return { inserted, updated: updated + renewed, skipped: skipped + notWritten };
}

// Cột ghi khi thêm mới (thứ tự cố định để ghép $1, $2...)
const INSERT_COLUMNS = [
  'title', 'provider', 'country', 'degree', 'coverage', 'deadline', 'language',
  'min_gpa', 'min_ielts', 'summary', 'source', 'source_url', 'source_priority',
  'published_at', 'relevance_score', 'dedup_key', 'is_active', 'is_featured',
];
const INSERT_CHUNK = 100; // mỗi câu INSERT tối đa 100 dòng

// Cột ingestion_runs là TIMESTAMP (không múi giờ): ghi giờ UTC rõ ràng, nếu không pg ghi theo múi giờ của máy chạy
// (GitHub Actions UTC, máy dev +7) và mốc tăng dần sẽ lệch
function toUtcText(date) {
  return date ? date.toISOString() : null;
}

/** @param {{ query: Function }} db kết nối pg (src/configs/database.config.js) */
function createStore(db) {
  return {
    /** Học bổng đã có, trùng khoá chống trùng hoặc trùng link bài. */
    async findExisting({ dedupKeys, sourceUrls }) {
      if (dedupKeys.length === 0 && sourceUrls.length === 0) return [];
      const { rows } = await db.query(
        `SELECT id, dedup_key, source_url, deadline, admin_locked_at FROM scholarships
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

    /**
     * Một câu UPDATE cho cả lô (trước đây mỗi dòng một câu → N lượt đi về DB).
     * Điều kiện admin_locked_at IS NULL lặp lại ở SQL: admin có thể khóa dòng giữa lúc đọc và lúc ghi.
     */
    async updateMany(rows) {
      if (rows.length === 0) return 0;
      const column = (name) => rows.map((row) => row[name] ?? null);
      const result = await db.query(
        `UPDATE scholarships AS s
            SET deadline = u.deadline, relevance_score = u.relevance_score, is_active = u.is_active,
                summary = u.summary, updated_at = now()
           FROM unnest($1::uuid[], $2::timestamp[], $3::smallint[], $4::boolean[], $5::text[])
                AS u(id, deadline, relevance_score, is_active, summary)
          WHERE s.id = u.id AND s.admin_locked_at IS NULL`,
        [column('id'), column('deadline'), column('relevance_score'), column('is_active'), column('summary')]
      );
      return result.rowCount;
    },

    /**
     * Kỳ mới của học bổng đã quá hạn (cùng khoá, link bài mới): chuyển dòng cũ sang bài mới thay vì bỏ qua.
     * Tiêu đề trùng một dòng khác (cột title UNIQUE) thì giữ tiêu đề cũ để cả lô không lỗi.
     */
    async renewMany(rows) {
      if (rows.length === 0) return 0;
      const column = (name) => rows.map((row) => row[name] ?? null);
      const result = await db.query(
        `UPDATE scholarships AS s
            SET title = CASE WHEN EXISTS (SELECT 1 FROM scholarships t WHERE t.title = u.title AND t.id <> s.id)
                             THEN s.title ELSE u.title END,
                source_url = u.source_url, source = u.source, source_priority = u.source_priority,
                published_at = u.published_at, deadline = u.deadline, relevance_score = u.relevance_score,
                is_active = u.is_active, summary = u.summary, updated_at = now()
           FROM unnest($1::uuid[], $2::text[], $3::text[], $4::text[], $5::smallint[], $6::timestamp[],
                       $7::timestamp[], $8::smallint[], $9::boolean[], $10::text[])
                AS u(id, title, source_url, source, source_priority, published_at, deadline, relevance_score, is_active, summary)
          WHERE s.id = u.id AND s.admin_locked_at IS NULL`,
        [
          column('id'), column('title'), column('source_url'), column('source'), column('source_priority'),
          column('published_at'), column('deadline'), column('relevance_score'), column('is_active'), column('summary'),
        ]
      );
      return result.rowCount;
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
    /**
     * Mốc cho lượt tăng dần: lúc bắt đầu lượt thành công (không lỗi, không chạy thử) gần nhất của trang.
     * Dùng lúc *bắt đầu*: bài sửa trong khi lượt đó đang chạy vẫn được lấy ở lượt sau.
     */
    async findLastSuccessfulRunAt(source) {
      const { rows } = await db.query(
        `SELECT max(started_at) AT TIME ZONE 'UTC' AS last_run_at
           FROM ingestion_runs
          WHERE source = $1 AND dry_run = false AND error IS NULL`,
        [source]
      );
      return rows[0]?.last_run_at ?? null;
    },

    async recordRun(run) {
      await db.query(
        `INSERT INTO ingestion_runs (source, dry_run, started_at, finished_at, fetched, rejected, inserted, updated, skipped, error)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10)`,
        [
          run.source, run.dryRun, toUtcText(run.startedAt), toUtcText(run.finishedAt), run.fetched,
          JSON.stringify(run.rejected), run.inserted, run.updated, run.skipped, run.error ?? null,
        ]
      );
    },
  };
}

export { saveRows, createStore };