'use strict';

const { truncate } = require('../text');
const { dedupKey } = require('./dedupKey');

const VALID_DEGREES = new Set(['Bachelor', 'Master', 'PhD', 'Any']);

// Đuôi quảng cáo hay gặp ở tiêu đề: "... | Fully Funded", "... | Study in Malaysia", "... | Step-by-Step Guide"
const TITLE_TAIL = /\s*\|\s*(?:fully funded|funded|study in [\w ]+|apply[^|]*|step[- ]by[- ]step[^|]*|how to[^|]*)\s*$/i;

function cleanTitle(title) {
  let out = title;
  for (let previous = null; previous !== out; ) {
    previous = out;
    out = out.replace(TITLE_TAIL, '');
  }
  return out.trim() || title;
}

/**
 * Gom bài thô + thông tin trích xuất + điểm thành một dòng đúng cột của bảng scholarships.
 * Dữ liệu sai thì sửa về giá trị an toàn, không để lỗi cả lô.
 * @param {{ raw: import('../../types').RawPost, facts: import('../../types').Facts, score: number, now: Date }} input
 */
function toRow({ raw, facts, score, now }) {
  const deadline = facts.deadline ?? null;
  return {
    title: truncate(cleanTitle(raw.title), 500),
    provider: truncate(facts.provider || 'Unknown', 255),
    country: truncate(facts.country || 'International', 100),
    degree: VALID_DEGREES.has(facts.degree) ? facts.degree : 'Any',
    coverage: truncate(facts.coverage, 255),
    deadline,
    language: truncate(facts.language || 'English', 50),
    min_gpa: facts.minGpa ?? null,
    min_ielts: facts.minIelts ?? null,
    summary: truncate(raw.excerpt, 1000),
    source: truncate(raw.sourceName, 100),
    source_url: truncate(raw.link, 2048),
    source_priority: raw.priority,
    published_at: raw.publishedAt,
    relevance_score: score,
    dedup_key: dedupKey(raw.title),
    is_active: deadline === null || deadline >= now,
    is_featured: false,
  };
}

module.exports = { toRow, cleanTitle };
