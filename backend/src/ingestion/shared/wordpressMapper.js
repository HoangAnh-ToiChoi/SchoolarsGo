'use strict';

const { stripHtml } = require('./text');
const { countryFromSlug } = require('./extract');

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

/** Suy ra gợi ý (signals) từ slug chuyên mục. Nguồn nào cũng dùng được. */
function signalsFromCategories(slugs) {
  const signals = new Set();
  for (const slug of slugs) {
    for (const [pattern, region] of REGION_BY_SLUG) {
      if (pattern.test(slug)) {
        signals.add(`region:${region}`);
        break;
      }
    }
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

/**
 * Đổi một bài WordPress thành RawPost chung. Mapper của từng nguồn gọi hàm này
 * rồi chỉnh thêm những điểm riêng của trang đó.
 * @returns {import('../types').RawPost}
 */
function toRawPost(post, config) {
  const categories = (post.class_list || [])
    .filter((c) => c.startsWith('category-'))
    .map((c) => c.slice('category-'.length));
  const excerpt = stripHtml(post.excerpt?.rendered || '').replace(/\s*\[…\]|\s*\[\.\.\.\]|\s*Read more.*$/i, '').trim();

  return {
    sourceName: config.name,
    priority: config.priority,
    externalId: String(post.id),
    title: stripHtml(post.title?.rendered || '').replace(/\s+/g, ' ').trim(),
    link: post.link,
    publishedAt: new Date(`${post.date_gmt || post.date}Z`),
    excerpt,
    contentText: stripHtml(post.content?.rendered || ''),
    categories,
    signals: signalsFromCategories(categories),
  };
}

module.exports = { toRawPost, signalsFromCategories };
