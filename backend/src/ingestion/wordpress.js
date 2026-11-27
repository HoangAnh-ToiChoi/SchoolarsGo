import { toPost } from './toPost.js';
import { DAY_MS, defaultSleep } from './time.js';

/**
 * BƯỚC 1 — Lấy bài từ một trang WordPress và đổi về dạng `post` chung.
 *
 * Mọi trang WordPress đều có sẵn API JSON: GET {baseUrl}/wp-json/wp/v2/posts?page=1&search=...
 * nên không cần đọc HTML. File này gồm 2 phần, phần đổi bài nằm ở toPost.js:
 *   fetchPosts(source)  ← hàm index.js gọi: chạy từng truy vấn của trang, trả lần lượt từng `post`
 *   fetchPages(...)     gọi API từng trang kết quả, tự thử lại khi bị 429/5xx
 */

const USER_AGENT = 'ScholarsGoBot/1.0 (+https://scholarsgo.app)';
const TIMEOUT_MS = 20000;
const RETRIES = 3;
const FIELDS = 'id,date_gmt,modified_gmt,link,title,excerpt,content,categories,class_list';
// Lượt tăng dần: tham số ngày của WordPress tính theo múi giờ của trang (không biết trước) nên lùi mốc gửi đi 1 ngày,
// rồi lọc chính xác bằng modified_gmt (giờ UTC) ở phía mình
const MODIFIED_SLACK_MS = DAY_MS;

/* ───────────── fetchPosts: lấy mọi bài của một trang ───────────── */

/**
 * @param {object} source một phần tử trong sources.js
 * @param {{ modifiedAfter?: Date | null }} options modifiedAfter: chỉ lấy bài đăng mới hoặc vừa sửa sau mốc này
 *   (lượt tăng dần). Không có thì lấy mọi bài trong `maxAgeDays` như cũ.
 * @returns {AsyncGenerator<object>} lần lượt từng `post`, không trùng, tối đa `limit` bài
 */
async function* fetchPosts(source, { limit = Infinity, fetchImpl, now = () => new Date(), delayMs, modifiedAfter = null } = {}) {
  const after = toWpDate(new Date(now().getTime() - source.maxAgeDays * DAY_MS));
  const incremental = modifiedAfter ? incrementalQuery(modifiedAfter) : {};
  const seenIds = new Set(); // hai truy vấn của cùng trang có thể trả trùng bài
  let count = 0;

  for (const query of source.queries) {
    const pages = fetchPages({
      baseUrl: source.baseUrl,
      maxPages: source.maxPages,
      delayMs: delayMs ?? source.delayMs,
      fetchImpl,
      ...query,
      after,
      ...incremental,
    });
    for await (const wpPost of pages) {
      if (seenIds.has(wpPost.id)) continue;
      seenIds.add(wpPost.id);
      const post = toPost(wpPost, source);
      // Sắp theo ngày sửa giảm dần: gặp bài cũ hơn mốc là hết bài mới của truy vấn này
      if (modifiedAfter && post.modifiedAt <= modifiedAfter) break;
      yield post;
      if (++count >= limit) return;
    }
  }
}

/** Lượt tăng dần: bài sửa gần nhất trước, mốc gửi đi lùi MODIFIED_SLACK_MS cho an toàn múi giờ. */
function incrementalQuery(modifiedAfter) {
  const slackedSince = new Date(modifiedAfter.getTime() - MODIFIED_SLACK_MS);
  return { orderby: 'modified', modifiedAfter: toWpDate(slackedSince) };
}

/** Date → "2026-11-24T10:00:00" (dạng WordPress nhận cho after / modified_after). */
function toWpDate(date) {
  return date.toISOString().slice(0, 19);
}

/* ───────────── fetchPages: gọi API WordPress ───────────── */

class HttpError extends Error {
  constructor(status, url) {
    super(`HTTP ${status} khi gọi ${url}`);
    this.status = status;
    this.retryable = status === 429 || status >= 500; // bị giới hạn hoặc máy chủ lỗi: thử lại được
  }
}

/** Lấy lần lượt các bài (mới nhất trước), đi qua từng trang kết quả cho đến hết. */
async function* fetchPages({
  baseUrl,
  categories,
  search,
  after,
  modifiedAfter,
  orderby = 'date',
  perPage = 50,
  maxPages = 3,
  delayMs = 600,
  fetchImpl = globalThis.fetch,
  sleep = defaultSleep,
}) {
  const base = baseUrl.replace(/\/+$/, '');

  for (let page = 1; page <= maxPages; page++) {
    const params = new URLSearchParams({ per_page: String(perPage), page: String(page), orderby, order: 'desc', _fields: FIELDS });
    if (categories?.length) params.set('categories', categories.join(','));
    if (search) params.set('search', search);
    if (after) params.set('after', after);
    if (modifiedAfter) params.set('modified_after', modifiedAfter); // WordPress ≥ 5.7; bản cũ bỏ qua, vẫn đúng nhờ lọc modified_gmt

    const response = await request(`${base}/wp-json/wp/v2/posts?${params}`, { isLaterPage: page > 1, fetchImpl, sleep });
    if (!response) return; // WordPress báo đã hết trang

    const posts = await response.json();
    for (const post of posts) yield post;

    const totalPages = Number(response.headers.get('x-wp-totalpages') || 1);
    if (page >= totalPages || posts.length < perPage) return;
    await sleep(delayMs);
  }
}

/** Gọi một URL, thử lại tối đa 3 lần (chờ 1s, 2s, 4s) khi lỗi mạng hoặc 429/5xx. */
async function request(url, { isLaterPage, fetchImpl, sleep }) {
  for (let attempt = 0; ; attempt++) {
    try {
      const response = await fetchImpl(url, {
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
        signal: AbortSignal.timeout(TIMEOUT_MS),
        redirect: 'follow',
      });
      // WordPress trả 400 khi xin trang vượt quá số trang có: đó là hết bài, không phải lỗi
      if (response.status === 400 && isLaterPage) return null;
      if (!response.ok) throw new HttpError(response.status, url);
      return response;
    } catch (error) {
      const isNetworkError = error.name === 'TimeoutError' || error.name === 'AbortError' || error instanceof TypeError;
      const retryable = error.retryable ?? isNetworkError;
      if (!retryable || attempt >= RETRIES) throw error;
      await sleep(1000 * 2 ** attempt);
    }
  }
}

export { fetchPosts, fetchPages };
