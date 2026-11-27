/**
 * BƯỚC 7 — Ghi vào bảng `scholarships` (câu SQL nằm ở store.js).
 *
 *   saveRows(store, rows)  quyết định từng dòng:
 *                            admin đã sửa / ẩn (admin_locked_at)          → BỎ QUA, không bao giờ bật lại hay ghi đè (R08)
 *                            đã có bài cùng link                          → LÀM MỚI (hạn nộp, điểm, trạng thái)
 *                            cùng khoá, dòng cũ đã quá hạn (kỳ năm trước) → LÀM MỚI THEO KỲ (link, tiêu đề, hạn mới)
 *                            cùng khoá, dòng cũ còn hạn                   → BỎ QUA (trang khác đã đăng, trang ưu tiên hơn thắng)
 *                            chưa có                                      → THÊM MỚI
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

/** Chia cả lô vào các nhánh ghi; chưa đụng DB. */
function planRows(rows, index, now) {
  const toInsert = [];
  const toUpdate = [];
  const toRenew = [];
  const renewedIds = new Set();
  const renewTitles = new Set();
  let skipped = 0;
  for (const row of rows) {
    const { action, id } = decide(row, index, now);
    // Hai bài cùng khoá trong một lô chỉ làm mới dòng cũ một lần (bài của trang ưu tiên hơn đứng trước)
    const renewTwice = action === 'renew' && renewedIds.has(id);
    if (action === 'insert') toInsert.push(row);
    else if (action === 'update') toUpdate.push({ ...row, id });
    else if (action === 'renew' && !renewTwice) {
      // Hai dòng làm mới cùng tiêu đề trong một lô: dòng sau giữ tiêu đề cũ (title UNIQUE, cả câu UPDATE sẽ lỗi)
      const title = renewTitles.has(row.title) ? null : row.title;
      toRenew.push({ ...row, id, title });
      renewedIds.add(id);
      renewTitles.add(row.title);
    } else skipped++;
  }
  return { toInsert, toUpdate, toRenew, skipped };
}

async function saveRows(store, rows, { dryRun = false, now = new Date() } = {}) {
  if (rows.length === 0) return { inserted: 0, updated: 0, skipped: 0 };

  const existing = await store.findExisting({
    dedupKeys: rows.map((r) => r.dedup_key).filter(Boolean),
    sourceUrls: rows.map((r) => r.source_url),
  });
  const { toInsert, toUpdate, toRenew, skipped } = planRows(rows, indexExisting(existing), now);

  const updatedCount = toUpdate.length + toRenew.length;
  if (dryRun) return { inserted: toInsert.length, updated: updatedCount, skipped };

  const inserted = await store.insertMany(toInsert);
  const updated = await store.updateMany(toUpdate);
  const renewed = await store.renewMany(toRenew);
  // insertMany bỏ qua dòng trùng khoá duy nhất trong DB; update/renew không ghi dòng vừa bị admin khóa → tính vào "bỏ qua"
  const notWritten = (toInsert.length - inserted) + (updatedCount - updated - renewed);
  return { inserted, updated: updated + renewed, skipped: skipped + notWritten };
}

export { saveRows };
