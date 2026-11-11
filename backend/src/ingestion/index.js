'use strict';

/**
 * KÉO HỌC BỔNG TỪ WEB NGOÀI — đọc file này trước.
 *
 * Ai gọi:  jobs/scholarshipScraper.js (Chủ nhật 2:00, qua container.js)  và  scripts/ingest.js (chạy tay)
 *
 * Mỗi trang trong sources.js chạy lần lượt; mỗi bài của trang đi qua 7 bước:
 *
 *   1. fetchPosts    wordpress.js   lấy bài từ API WordPress, đổi HTML → chữ                  → post
 *   2. checkBasic    filter.js      loại rác chỉ nhìn tiêu đề/link (việc làm, quảng cáo…)
 *   3. extractInfo   extract.js     tìm hạn nộp, nước, bậc học, GPA, IELTS bằng regex          → info
 *      aiFill        aiExtract.js   (nếu có khoá Gemini) điền chỗ regex không tìm được
 *   4. checkDetails  filter.js      loại bài đã hết hạn, chỉ dành cho nước khác
 *   5. scorePost     score.js       chấm độ phù hợp với sinh viên Việt Nam (0–100)
 *   6. toRow         toRow.js       đổi thành một dòng của bảng scholarships                   → row
 *   7. saveRows      save.js        thêm mới / làm mới / bỏ qua nếu đã có
 *
 * Bước 2 chạy trước bước 3 để không tốn lượt gọi Gemini cho bài rác.
 * Một trang lỗi (sập, bị chặn) thì ghi lỗi rồi chạy trang tiếp theo.
 */

const { pickSources, sourceNames } = require('./sources');
const { fetchPosts } = require('./wordpress');
const { checkBasic, checkDetails } = require('./filter');
const { extractInfo } = require('./extract');
const { createAiFill } = require('./aiExtract');
const { scorePost } = require('./score');
const { toRow } = require('./toRow');
const { saveRows, createStore } = require('./save');

const SAMPLE_SIZE = 5; // giữ vài bài mẫu (được nhận / bị loại) để scripts/ingest.js --verbose in ra

/**
 * Lắp các bước lại với DB và Gemini thật. Module không tự require DB hay Gemini: nơi gọi truyền vào.
 * @param {{ db: { query: Function }, aiModel?: object | null, logger?: object, fetchImpl?: Function, now?: () => Date }} deps
 */
function createIngestion({ db, aiModel = null, logger = console, fetchImpl, now = () => new Date() }) {
  const store = createStore(db);
  const aiFill = createAiFill({ model: aiModel, logger, now });

  return {
    /** Kéo học bổng. only: chỉ chạy các trang này · dryRun: không ghi DB · limit: tối đa N bài mỗi trang */
    run({ only = [], dryRun = false, limit = Infinity } = {}) {
      const sources = pickSources(only).map((source) => ({
        name: source.name,
        fetchPosts: (options) => fetchPosts(source, { ...options, fetchImpl, now }),
      }));
      return runIngestion({ sources, store, aiFill, logger, now }, { dryRun, limit });
    },
    /** Tắt học bổng đã quá hạn (chạy mỗi đêm). */
    deactivateExpired: () => store.deactivateExpired(),
  };
}

/**
 * Chạy mọi trang. Tách khỏi createIngestion để test truyền trang giả và store giả vào.
 * @returns {Promise<object[]>} thống kê từng trang
 */
async function runIngestion({ sources, store, aiFill = null, logger = console, now = () => new Date() }, { dryRun = false, limit = Infinity } = {}) {
  const seenKeys = new Set(); // chống trùng giữa các trang trong cùng một lượt: trang chạy trước (ưu tiên hơn) thắng
  const results = [];

  for (const source of sources) {
    const stats = newStats(source.name, dryRun);
    logger.info(`[${source.name}] bắt đầu${dryRun ? ' (chạy thử, không ghi DB)' : ''}`);
    try {
      const rows = await collectRows(source, { aiFill, now: now(), limit, seenKeys, stats });
      Object.assign(stats, await saveRows(store, rows, { dryRun })); // bước 7
    } catch (error) {
      stats.error = error.message;
      logger.error(`[${source.name}] lỗi: ${error.message}`);
    }
    stats.finishedAt = new Date();
    if (!dryRun) await recordRun(store, stats, logger);
    results.push(stats);
  }
  return results;
}

/** Bước 1 → 6 cho từng bài của một trang. Trả về các dòng sẵn sàng để lưu. */
async function collectRows(source, { aiFill, now, limit, seenKeys, stats }) {
  const rows = [];

  for await (const post of source.fetchPosts({ limit })) { // 1
    stats.fetched++;

    const basic = checkBasic(post); // 2
    if (!basic.ok) {
      countRejected(stats, basic, post);
      continue;
    }

    let info = extractInfo(post, { now }); // 3
    if (aiFill) info = await aiFill(post, info);

    const details = checkDetails(post, info, { now }); // 4
    if (!details.ok) {
      countRejected(stats, details, post);
      continue;
    }

    const { score } = scorePost(post, info, { now }); // 5
    const row = toRow({ post, info, score, now }); // 6

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

/* ───────────── Thống kê ───────────── */

function newStats(source, dryRun) {
  return {
    source, dryRun, startedAt: new Date(), finishedAt: null,
    fetched: 0, rejected: {}, passed: 0, duplicateInRun: 0,
    inserted: 0, updated: 0, skipped: 0, error: null,
    samples: [], rejectedSamples: {},
  };
}

function countRejected(stats, result, post) {
  stats.rejected[result.rule] = (stats.rejected[result.rule] || 0) + 1;
  const examples = (stats.rejectedSamples[result.rule] ||= []);
  if (examples.length < SAMPLE_SIZE) examples.push(`${post.title.slice(0, 70)}  [${result.reason}]`);
}

/** Ghi nhật ký lượt chạy; ghi lỗi thì chỉ cảnh báo, không làm hỏng lượt kéo. */
function recordRun(store, stats, logger) {
  return store
    .recordRun({
      source: stats.source, dryRun: stats.dryRun, startedAt: stats.startedAt, finishedAt: stats.finishedAt,
      fetched: stats.fetched, rejected: stats.rejected, inserted: stats.inserted, updated: stats.updated,
      skipped: stats.skipped + stats.duplicateInRun, error: stats.error,
    })
    .catch((error) => logger.warn(`[${stats.source}] không ghi được nhật ký: ${error.message}`));
}

module.exports = { createIngestion, runIngestion, sourceNames };
