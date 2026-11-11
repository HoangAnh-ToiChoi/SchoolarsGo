'use strict';

const { countryFromSlug } = require('./countries');

/**
 * BƯỚC 1 — Lấy bài từ một trang WordPress và đổi về dạng `post` chung.
 *
 * Mọi trang WordPress đều có sẵn API JSON: GET {baseUrl}/wp-json/wp/v2/posts?page=1&search=...
 * nên không cần đọc HTML. File này gồm 3 phần:
 *   fetchPosts(source)  ← hàm index.js gọi: chạy từng truy vấn của trang, trả lần lượt từng `post`
 *   fetchPages(...)     gọi API từng trang kết quả, tự thử lại khi bị 429/5xx
 *   toPost(...)         đổi một bài WordPress (có HTML) thành `post` (chữ thuần)
 */

const DAY_MS = 24 * 60 * 60 * 1000;
const USER_AGENT = 'ScholarsGoBot/1.0 (+https://scholarsgo.app)';
const TIMEOUT_MS = 20000;
const RETRIES = 3;
const FIELDS = 'id,date_gmt,link,title,excerpt,content,categories,class_list';

const defaultSleep = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/* ───────────── fetchPosts: lấy mọi bài của một trang ───────────── */

/**
 * @param {object} source một phần tử trong sources.js
 * @returns {AsyncGenerator<object>} lần lượt từng `post`, không trùng, tối đa `limit` bài
 */
async function* fetchPosts(source, { limit = Infinity, fetchImpl, now = () => new Date(), delayMs } = {}) {
  const after = new Date(now().getTime() - source.maxAgeDays * DAY_MS).toISOString().slice(0, 19);
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
    });
    for await (const wpPost of pages) {
      if (seenIds.has(wpPost.id)) continue;
      seenIds.add(wpPost.id);
      yield toPost(wpPost, source);
      if (++count >= limit) return;
    }
  }
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
  perPage = 50,
  maxPages = 3,
  delayMs = 600,
  fetchImpl = globalThis.fetch,
  sleep = defaultSleep,
}) {
  const base = baseUrl.replace(/\/+$/, '');

  for (let page = 1; page <= maxPages; page++) {
    const params = new URLSearchParams({ per_page: String(perPage), page: String(page), orderby: 'date', order: 'desc', _fields: FIELDS });
    if (categories?.length) params.set('categories', categories.join(','));
    if (search) params.set('search', search);
    if (after) params.set('after', after);

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

/* ───────────── toPost: bài WordPress → post ───────────── */

/**
 * Dạng `post` mà mọi bước sau dùng:
 *   { sourceName, priority, externalId, title, link, publishedAt, excerpt, contentText, categories, signals }
 * `signals` là gợi ý suy từ chuyên mục của trang, ví dụ "region:southeastAsia", "degree:Master", "country:Japan".
 */
function toPost(wpPost, source) {
  const categories = (wpPost.class_list || []).filter((c) => c.startsWith('category-')).map((c) => c.slice('category-'.length));
  const excerpt = stripHtml(wpPost.excerpt?.rendered || '').replace(/\s*\[…\]|\s*\[\.\.\.\]|\s*Read more.*$/i, '').trim();

  return {
    sourceName: source.name,
    priority: source.priority,
    externalId: String(wpPost.id),
    title: stripHtml(wpPost.title?.rendered || '').replace(/\s+/g, ' ').trim(),
    link: wpPost.link,
    publishedAt: new Date(`${wpPost.date_gmt || wpPost.date}Z`),
    excerpt,
    contentText: stripHtml(wpPost.content?.rendered || ''),
    categories,
    signals: signalsFromCategories(categories),
  };
}

// Slug chuyên mục → vùng. Thứ tự quan trọng: Đông Nam Á phải xét trước "Asia" chung chung.
const REGION_BY_SLUG = [
  [/south-?east/, 'southeastAsia'],
  [/east-asian|east-asia/, 'eastAsia'],
  [/south-asian|south-asia/, 'southAsia'],
  [/^asians?-|^asia-|^asia$|-asia-|-asians-/, 'asia'],
  [/african|^africa/, 'africa'],
  [/latin-americ|caribbean/, 'latinAmerica'],
  [/east-europe|^europe-|-europe-/, 'europe'],
  [/middle-east|arab/, 'middleEast'],
  [/pacific/, 'pacific'],
];

const DEGREE_BY_SLUG = [
  [/^masters?(-|$)|postgraduate/, 'Master'],
  [/^phd(-|$)|doctoral/, 'PhD'],
  [/undergraduate|^bachelors?(-|$)/, 'Bachelor'],
];

/** "southeast-asians-scholarships" → "region:southeastAsia"; "masters-scholarships" → "degree:Master"… */
function signalsFromCategories(slugs) {
  const signals = new Set();
  for (const slug of slugs) {
    const region = REGION_BY_SLUG.find(([pattern]) => pattern.test(slug));
    if (region) signals.add(`region:${region[1]}`);
    for (const [pattern, degree] of DEGREE_BY_SLUG) {
      if (pattern.test(slug)) signals.add(`degree:${degree}`);
    }
    // Chỉ tin slug dạng "uk-scholarships" (quy ước của scholars4dev). Slug trần như "usa" có thể là vùng đủ điều kiện.
    if (/-scholarships?$/.test(slug)) {
      const country = countryFromSlug(slug.replace(/-scholarships?$/, ''));
      if (country) signals.add(`country:${country}`);
    }
  }
  return [...signals];
}

/* ───────────── Bỏ HTML ───────────── */

const NAMED_ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  ndash: '-', mdash: '-', hellip: '...', rsquo: "'", lsquo: "'", ldquo: '"', rdquo: '"',
};

function fromCodePoint(code) {
  try {
    return String.fromCodePoint(code);
  } catch {
    return '';
  }
}

/** Đổi &amp; &#8211; ... thành ký tự thật, rồi chuẩn hoá dấu nháy và gạch ngang "kiểu đẹp". */
function decodeEntities(input = '') {
  return String(input)
    .replace(/&#(\d+);/g, (_, n) => fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => fromCodePoint(parseInt(h, 16)))
    .replace(/&([a-z]+);/gi, (match, name) => NAMED_ENTITIES[name.toLowerCase()] ?? match)
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\u00a0/g, ' ');
}

/** HTML → chữ thuần, giữ xuống dòng giữa các khối để còn đọc được "Nhãn:\nGiá trị". */
function stripHtml(html = '') {
  const withBreaks = String(html)
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
    .replace(/<br\s*\/?>|<\/(p|li|h[1-6]|div|tr|ul|ol)>/gi, '\n')
    .replace(/<[^>]+>/g, '');
  return decodeEntities(withBreaks)
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

module.exports = { fetchPosts, fetchPages, toPost, signalsFromCategories };
