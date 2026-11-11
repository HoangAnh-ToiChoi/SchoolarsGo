'use strict';

/**
 * BƯỚC 6 — Gom post + info + điểm thành một dòng đúng cột của bảng `scholarships`.
 * Giá trị sai thì đổi về giá trị an toàn ('Unknown', 'International', 'Any'), không để lỗi cả lô.
 */

const VALID_DEGREES = new Set(['Bachelor', 'Master', 'PhD', 'Any']);

function toRow({ post, info, score, now }) {
  const deadline = info.deadline ?? null;
  return {
    title: truncate(cleanTitle(post.title), 500),
    provider: truncate(info.provider || 'Unknown', 255),
    country: truncate(info.country || 'International', 100),
    degree: VALID_DEGREES.has(info.degree) ? info.degree : 'Any',
    coverage: truncate(info.coverage, 255),
    deadline,
    language: truncate(info.language || 'English', 50),
    min_gpa: info.minGpa ?? null,
    min_ielts: info.minIelts ?? null,
    summary: truncate(post.excerpt, 1000),
    source: truncate(post.sourceName, 100),
    source_url: truncate(post.link, 2048),
    source_priority: post.priority,
    published_at: post.publishedAt,
    relevance_score: score,
    dedup_key: dedupKey(post.title),
    is_active: deadline === null || deadline >= now,
    is_featured: false,
  };
}

// Đuôi quảng cáo hay gặp ở tiêu đề: "... | Fully Funded", "... | Study in Malaysia", "... | Step-by-Step Guide"
const TITLE_TAIL = /\s*\|\s*(?:fully funded|funded|study in [\w ]+|apply[^|]*|step[- ]by[- ]step[^|]*|how to[^|]*)\s*$/i;

/** Bỏ các đuôi quảng cáo (có thể nhiều đuôi nối nhau). */
function cleanTitle(title) {
  let out = title;
  for (let previous = null; previous !== out; ) {
    previous = out;
    out = out.replace(TITLE_TAIL, '');
  }
  return out.trim() || title;
}

// Những từ không giúp phân biệt hai học bổng với nhau
const STOP_WORDS = new Set([
  'scholarship', 'scholarships', 'programme', 'programmes', 'program', 'programs',
  'fully', 'funded', 'apply', 'now', 'open', 'applications', 'application',
  'for', 'the', 'in', 'at', 'of', 'and', 'to', 'a', 'an', 'international', 'students', 'student',
]);

/**
 * Khoá chống trùng: cùng một học bổng đăng ở hai trang (hoặc hai năm) cho cùng một khoá.
 * "Swedish Institute Scholarship 2027 | Fully Funded" và "Swedish Institute Scholarships 2026/2027"
 * đều thành "swedish-institute".
 */
function dedupKey(title) {
  const head = String(title)
    .split(/\s+[|-]\s+/)[0] // bỏ đuôi sau " | " hoặc " - "
    .toLowerCase()
    .replace(/\b20\d{2}(?:\s*[/-]\s*(?:20)?\d{2})?\b/g, ' ') // bỏ năm: 2027, 2026/2027, 2026-27
    .replace(/[^a-z0-9\s]/g, ' ');
  const words = head.split(/\s+/).filter((w) => w && !STOP_WORDS.has(w));
  return words.join('-').slice(0, 200);
}

/** Cắt chuỗi cho vừa cột; null/undefined giữ là null (không thành chuỗi "null"). */
function truncate(value, max) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text.length > max ? text.slice(0, max) : text;
}

module.exports = { toRow, cleanTitle, dedupKey };
