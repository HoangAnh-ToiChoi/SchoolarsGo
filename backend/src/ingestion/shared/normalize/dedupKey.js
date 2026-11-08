'use strict';

// Những từ không giúp phân biệt hai học bổng với nhau
const STOP_WORDS = new Set([
  'scholarship', 'scholarships', 'programme', 'programmes', 'program', 'programs',
  'fully', 'funded', 'apply', 'now', 'open', 'applications', 'application',
  'for', 'the', 'in', 'at', 'of', 'and', 'to', 'a', 'an', 'international', 'students', 'student',
]);

const MAX_LENGTH = 200;

/**
 * Khoá chống trùng: tiêu đề viết thường, bỏ năm, bỏ từ thừa, bỏ phần đuôi "| Fully Funded", "- Apply by ...".
 * "Swedish Institute Scholarship 2027 | Fully Funded" và "Swedish Institute Scholarships 2026/2027"
 * cho cùng một khoá.
 * @param {string} title
 * @returns {string}
 */
function dedupKey(title) {
  const head = String(title)
    .split(/\s+[|-]\s+/)[0]                      // bỏ đuôi sau " | " hoặc " - "
    .toLowerCase()
    .replace(/\b20\d{2}(?:\s*[/-]\s*(?:20)?\d{2})?\b/g, ' ')   // 2027, 2026/2027, 2026-27
    .replace(/[^a-z0-9\s]/g, ' ');
  const words = head.split(/\s+/).filter((w) => w && !STOP_WORDS.has(w));
  return words.join('-').slice(0, MAX_LENGTH);
}

module.exports = { dedupKey };
