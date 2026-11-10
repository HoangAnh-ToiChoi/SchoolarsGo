'use strict';

const kw = require('./keywords');

const DAY_MS = 24 * 60 * 60 * 1000;

/** Tên luật, dùng để thống kê "bị loại vì luật nào". */
const RULES = Object.freeze({
  R1: 'Không phải học bổng',
  R2: 'Đã hết hạn',
  R3: 'Bài cũ, không rõ hạn',
  R4: 'Loại trừ người Việt',
  R5: 'Thiếu link bài',
  R6: 'Rác, quảng cáo',
});

const pass = Object.freeze({ ok: true });
const fail = (rule, reason) => ({ ok: false, rule, reason });

function isHttpsUrl(value) {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Giai đoạn 1: chỉ cần tiêu đề, link, chuyên mục → rẻ, chạy trước khi trích xuất thông tin.
 * @param {import('../../types').RawPost} raw
 * @returns {import('../../types').RuleResult}
 */
function checkBeforeExtract(raw) {
  if (!raw.link || !isHttpsUrl(raw.link)) return fail('R5', 'link không hợp lệ');

  const title = raw.title || '';
  if (title.length < kw.MIN_TITLE_LENGTH) return fail('R6', 'tiêu đề quá ngắn');
  const spam = title.match(kw.SPAM_TITLE);
  if (spam) return fail('R6', `từ khoá rác "${spam[0]}"`);

  const blockedCategory = raw.categories.find((slug) => kw.NOT_SCHOLARSHIP_CATEGORIES.has(slug));
  if (blockedCategory) return fail('R1', `chuyên mục "${blockedCategory}"`);
  if (kw.GUIDE_TITLE.test(title)) return fail('R1', 'bài hướng dẫn hoặc danh sách');
  if (kw.NOT_STUDENT_FUNDING.test(title)) return fail('R1', 'tài trợ cho tổ chức hoặc dự án');
  const notScholarship = title.match(kw.NOT_SCHOLARSHIP_TITLE);
  if (notScholarship && !kw.SCHOLARSHIP_TITLE.test(title)) return fail('R1', `tiêu đề có "${notScholarship[0]}"`);

  return pass;
}

/**
 * Giai đoạn 2: cần hạn nộp và nội dung đã trích xuất.
 * @param {import('../../types').RawPost} raw
 * @param {import('../../types').Facts} facts
 * @param {{ now: Date }} context
 * @returns {import('../../types').RuleResult}
 */
function checkAfterExtract(raw, facts, { now }) {
  if (facts.deadline && facts.deadline < now) return fail('R2', `hạn ${facts.deadline.toISOString().slice(0, 10)}`);

  if (!facts.deadline) {
    const ageDays = (now - raw.publishedAt) / DAY_MS;
    if (ageDays > kw.MAX_AGE_NO_DEADLINE_DAYS) return fail('R3', `đăng ${Math.round(ageDays)} ngày trước`);
  }

  const haystack = `${raw.title}\n${raw.contentText.slice(0, 3000)}`;
  if (!kw.VIETNAM.test(haystack)) {
    for (const pattern of kw.EXCLUSIVE_PATTERNS) {
      const match = haystack.match(pattern);
      if (match) return fail('R4', match[0]);
    }
  }

  return pass;
}

module.exports = { RULES, checkBeforeExtract, checkAfterExtract };
