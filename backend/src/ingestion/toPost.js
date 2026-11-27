import { countryFromSlug } from './countries.js';

/**
 * BƯỚC 1 (tiếp) — Đổi một bài WordPress (có HTML) thành `post` (chữ thuần). wordpress.js gọi cho từng bài.
 *
 * Dạng `post` mà mọi bước sau dùng:
 *   { sourceName, priority, externalId, title, link, publishedAt, modifiedAt, excerpt, contentText, categories, signals }
 * `signals` là gợi ý suy từ chuyên mục của trang, ví dụ "region:southeastAsia", "degree:Master", "country:Japan".
 */
function toPost(wpPost, source) {
  const categories = (wpPost.class_list || []).filter((c) => c.startsWith('category-')).map((c) => c.slice('category-'.length));
  const excerpt = renderedText(wpPost.excerpt).replace(/\s*\[…\]|\s*\[\.\.\.\]|\s*Read more.*$/i, '').trim();

  return {
    sourceName: source.name,
    priority: source.priority,
    externalId: String(wpPost.id),
    title: renderedText(wpPost.title).replace(/\s+/g, ' ').trim(),
    link: wpPost.link,
    publishedAt: gmtDate(wpPost.date_gmt || wpPost.date),
    modifiedAt: gmtDate(wpPost.modified_gmt || wpPost.date_gmt || wpPost.date),
    excerpt,
    contentText: renderedText(wpPost.content),
    categories,
    signals: signalsFromCategories(categories),
  };
}

/** Trường `{ rendered: "<p>…</p>" }` của WordPress → chữ thuần (thiếu trường thì chuỗi rỗng). */
function renderedText(field) {
  return stripHtml(field?.rendered || '');
}

/** "2026-11-24T10:00:00" (giờ GMT, WordPress không ghi múi giờ) → Date. */
function gmtDate(text) {
  return new Date(`${text}Z`);
}

/* ───────────── Chuyên mục → gợi ý ───────────── */

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

export { toPost, signalsFromCategories };
