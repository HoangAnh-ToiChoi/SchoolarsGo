'use strict';

/**
 * Quyết định mỗi dòng là "thêm mới", "làm mới" hay "bỏ qua vì đã có", rồi ghi qua store.
 * Các nguồn được chạy theo thứ tự ưu tiên nên nguồn đến trước thắng khi trùng học bổng.
 */
class ScholarshipWriter {
  #store;

  /** @param {import('../types').IngestionStore} store */
  constructor(store) {
    this.#store = store;
  }

  /**
   * @param {object[]} rows dòng đã chuẩn hoá (xem normalizer.js)
   * @param {{ dryRun?: boolean }} options
   * @returns {Promise<{ inserted: number, updated: number, skipped: number }>}
   */
  async save(rows, { dryRun = false } = {}) {
    if (rows.length === 0) return { inserted: 0, updated: 0, skipped: 0 };

    const existing = await this.#store.findExisting({
      dedupKeys: rows.map((r) => r.dedup_key),
      sourceUrls: rows.map((r) => r.source_url),
    });
    const byUrl = new Map(existing.filter((e) => e.source_url).map((e) => [e.source_url, e]));
    const byKey = new Set(existing.filter((e) => e.dedup_key).map((e) => e.dedup_key));

    const toInsert = [];
    const toUpdate = [];
    let skipped = 0;
    for (const row of rows) {
      const sameUrl = byUrl.get(row.source_url);
      if (sameUrl) toUpdate.push({ ...row, id: sameUrl.id });
      else if (byKey.has(row.dedup_key)) skipped++;
      else toInsert.push(row);
    }

    if (dryRun) return { inserted: toInsert.length, updated: toUpdate.length, skipped };

    const inserted = await this.#store.insertMany(toInsert);
    const updated = await this.#store.updateMany(toUpdate);
    return { inserted, updated, skipped: skipped + (toInsert.length - inserted) };
  }
}

module.exports = ScholarshipWriter;
