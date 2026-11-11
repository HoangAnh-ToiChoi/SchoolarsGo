'use strict';

/**
 * Tên nước chuẩn (khớp với COUNTRY_LABELS ở frontend) và các cách viết khác của nó.
 * Giữ ngắn gọn: chỉ các nước hay xuất hiện trong học bổng du học.
 */
const COUNTRIES = {
  'United Kingdom': ['united kingdom', 'uk', 'u.k.', 'britain', 'great britain', 'england', 'scotland', 'wales'],
  'United States': ['united states', 'usa', 'u.s.a.', 'u.s.', 'america'],
  Canada: ['canada'],
  Australia: ['australia'],
  'New Zealand': ['new zealand'],
  Germany: ['germany'],
  France: ['france'],
  Netherlands: ['netherlands', 'the netherlands', 'holland'],
  Belgium: ['belgium'],
  Switzerland: ['switzerland'],
  Austria: ['austria'],
  Sweden: ['sweden'],
  Norway: ['norway'],
  Denmark: ['denmark'],
  Finland: ['finland'],
  Ireland: ['ireland'],
  Italy: ['italy'],
  Spain: ['spain'],
  Portugal: ['portugal'],
  Poland: ['poland'],
  Hungary: ['hungary'],
  'Czech Republic': ['czech republic', 'czechia'],
  Russia: ['russia'],
  Turkey: ['turkey', 'türkiye', 'turkiye'],
  Japan: ['japan'],
  China: ['china'],
  'South Korea': ['south korea', 'korea'],
  Taiwan: ['taiwan'],
  'Hong Kong': ['hong kong'],
  Singapore: ['singapore'],
  Malaysia: ['malaysia'],
  Thailand: ['thailand'],
  Indonesia: ['indonesia'],
  Philippines: ['philippines'],
  Vietnam: ['vietnam', 'viet nam'],
  India: ['india'],
  Brunei: ['brunei'],
  'United Arab Emirates': ['united arab emirates', 'uae'],
  Qatar: ['qatar'],
  'Saudi Arabia': ['saudi arabia'],
  Egypt: ['egypt'],
  'South Africa': ['south africa'],
  Brazil: ['brazil'],
  Mexico: ['mexico'],
};

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Tạo sẵn regex cho từng nước; xếp alias dài trước để "south korea" thắng "korea"
const MATCHERS = Object.entries(COUNTRIES).map(([name, aliases]) => ({
  name,
  regex: new RegExp(
    `(?<![\\w])(?:${[...aliases].sort((a, b) => b.length - a.length).map(escapeRegExp).join('|')})(?![\\w])`,
    'i'
  ),
}));

/** Tìm nước đầu tiên xuất hiện trong chuỗi, hoặc null. */
function findCountry(text = '') {
  let best = null;
  for (const { name, regex } of MATCHERS) {
    const m = regex.exec(text);
    if (m && (best === null || m.index < best.index)) best = { name, index: m.index };
  }
  return best ? best.name : null;
}

/** "south-korea" hoặc "uk" (slug chuyên mục) → tên nước chuẩn, hoặc null nếu slug không phải tên nước. */
function countryFromSlug(slug = '') {
  const phrase = slug.replace(/-/g, ' ');
  for (const { name, regex } of MATCHERS) {
    const m = regex.exec(phrase);
    if (m && m[0].length === phrase.length) return name;
  }
  return null;
}

module.exports = { findCountry, countryFromSlug };
