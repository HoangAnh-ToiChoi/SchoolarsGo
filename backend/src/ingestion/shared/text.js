'use strict';

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

/** Cắt chuỗi, không để rỗng thành chuỗi "null". */
function truncate(value, max) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text.length > max ? text.slice(0, max) : text;
}

module.exports = { decodeEntities, stripHtml, truncate };
