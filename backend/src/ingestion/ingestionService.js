'use strict';

const filters = require('./shared/filters');
const { extractFacts } = require('./shared/extract');
const { toRow } = require('./shared/normalize');

const SAMPLE_SIZE = 5;

const newStats = (source, dryRun) => ({
  source, dryRun, startedAt: new Date(), finishedAt: null,
  fetched: 0, rejected: {}, passed: 0, duplicateInRun: 0,
  inserted: 0, updated: 0, skipped: 0, error: null,
  samples: [], rejectedSamples: {},
});

/**
 * Nhạc trưởng: chạy từng nguồn, cho mọi bài đi qua CÙNG một đường (lọc → trích xuất → chấm điểm →
 * chuẩn hoá → lưu). Các nguồn không biết đến lớp này, và chỉ lớp này gọi bộ lọc dùng chung.
 */
class IngestionService {
  #createSources;
  #writer;
  #store;
  #aiExtractor;
  #logger;
  #now;

  /**
   * @param {{
   *   createSources: (options: { only: string[] }) => import('./types').Source[],
   *   writer: { save: Function },
   *   store: import('./types').IngestionStore,
   *   aiExtractor?: { fill: Function } | null,
   *   logger?: import('./types').Logger,
   *   now?: () => Date,
   * }} deps
   */
  constructor({ createSources, writer, store, aiExtractor = null, logger = console, now = () => new Date() }) {
    this.#createSources = createSources;
    this.#writer = writer;
    this.#store = store;
    this.#aiExtractor = aiExtractor;
    this.#logger = logger;
    this.#now = now;
  }

  /**
   * @param {{ only?: string[], dryRun?: boolean, limit?: number }} options
   * @returns {Promise<ReturnType<typeof newStats>[]>} thống kê từng nguồn
   */
  async run({ only = [], dryRun = false, limit = Infinity } = {}) {
    const sources = this.#createSources({ only });
    const seenKeys = new Set(); // chống trùng giữa các nguồn trong cùng một lượt
    const results = [];

    for (const source of sources) {
      const stats = newStats(source.name, dryRun);
      this.#logger.info(`[${source.name}] bắt đầu${dryRun ? ' (chạy thử, không ghi DB)' : ''}`);
      try {
        const rows = await this.#collect(source, { limit, seenKeys, stats });
        const saved = await this.#writer.save(rows, { dryRun });
        Object.assign(stats, saved);
      } catch (error) {
        // Một nguồn lỗi (sập, 403...) không làm hỏng các nguồn còn lại
        stats.error = error.message;
        this.#logger.error(`[${source.name}] lỗi: ${error.message}`);
      }
      stats.finishedAt = new Date();
      if (!dryRun) await this.#recordRun(stats);
      results.push(stats);
    }
    return results;
  }

  /** Tắt học bổng đã quá hạn (chạy mỗi đêm). */
  deactivateExpired() {
    return this.#store.deactivateExpired();
  }

  async #collect(source, { limit, seenKeys, stats }) {
    const now = this.#now();
    const rows = [];

    for await (const raw of source.fetchPosts({ limit })) {
      stats.fetched++;

      const early = filters.checkBeforeExtract(raw);
      if (!early.ok) {
        this.#reject(stats, early, raw);
        continue;
      }

      let facts = extractFacts(raw, { now });
      if (this.#aiExtractor) facts = await this.#aiExtractor.fill(raw, facts);

      const late = filters.checkAfterExtract(raw, facts, { now });
      if (!late.ok) {
        this.#reject(stats, late, raw);
        continue;
      }

      const { score } = filters.score(raw, facts, { now });
      const row = toRow({ raw, facts, score, now });
      if (seenKeys.has(row.dedup_key)) {
        stats.duplicateInRun++;
        continue;
      }
      seenKeys.add(row.dedup_key);

      stats.passed++;
      if (stats.samples.length < SAMPLE_SIZE) stats.samples.push(row);
      rows.push(row);
    }
    return rows;
  }

  #reject(stats, result, raw) {
    stats.rejected[result.rule] = (stats.rejected[result.rule] || 0) + 1;
    const list = (stats.rejectedSamples[result.rule] ||= []);
    if (list.length < SAMPLE_SIZE) list.push(`${raw.title.slice(0, 70)}  [${result.reason}]`);
  }

  #recordRun(stats) {
    return this.#store
      .recordRun({
        source: stats.source, dryRun: stats.dryRun, startedAt: stats.startedAt, finishedAt: stats.finishedAt,
        fetched: stats.fetched, rejected: stats.rejected, inserted: stats.inserted, updated: stats.updated,
        skipped: stats.skipped + stats.duplicateInRun, error: stats.error,
      })
      .catch((error) => this.#logger.warn(`[${stats.source}] không ghi được nhật ký: ${error.message}`));
  }
}

module.exports = IngestionService;
