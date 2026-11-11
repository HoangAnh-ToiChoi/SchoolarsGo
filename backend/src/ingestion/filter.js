'use strict';

/**
 * BƯỚC 2 và 4 — Loại bài không đạt. Mỗi bài bị loại ghi lại "luật nào" để thống kê.
 *
 *   checkBasic(post)          BƯỚC 2: chỉ nhìn tiêu đề, link, chuyên mục → rẻ, chạy TRƯỚC khi trích thông tin
 *   checkDetails(post, info)  BƯỚC 4: cần hạn nộp đã trích → chạy SAU khi trích thông tin
 *
 * Trả về { ok: true } hoặc { ok: false, rule: 'R1', reason: 'chuyên mục "jobs"' }.
 * Muốn chặn thêm từ nào thì sửa các danh sách từ khoá ngay dưới đây.
 */

const RULES = Object.freeze({
  R1: 'Không phải học bổng',
  R2: 'Đã hết hạn',
  R3: 'Bài cũ, không rõ hạn',
  R4: 'Loại trừ người Việt',
  R5: 'Thiếu link bài',
  R6: 'Rác, quảng cáo',
});

const DAY_MS = 24 * 60 * 60 * 1000;

/* ───────────── Từ khoá ───────────── */

// R1: bài không phải học bổng
const NOT_SCHOLARSHIP_TITLE = /\b(jobs?|vacanc(?:y|ies)|hiring|careers?|recruit(?:ing|ment)?|conferences?|call for papers|webinars?|internships?|contests?|competitions?|workshops?|volunteers?)\b/i;
// Tiêu đề có các từ này thì dù dính từ ở trên vẫn coi là học bổng (vd. "Fully Funded Internship")
const SCHOLARSHIP_TITLE = /\b(scholarships?|fellowships?|bursar(?:y|ies)|grants?|stipends?|fully[- ]funded|funded|awards?|scholars)\b/i;
const NOT_SCHOLARSHIP_CATEGORIES = new Set([
  'job', 'jobs', 'job-vacancies', 'vacancies', 'career', 'careers',
  'internship', 'internships', 'conference', 'conferences',
  'competition', 'competitions', 'contest', 'contests',
  'events', 'event', 'webinars', 'volunteer', 'call-for-papers',
]);
// Bài hướng dẫn, danh sách: không phải một học bổng cụ thể (không có ngoại lệ "scholarship").
// "^\d{1,2}\s" chỉ bắt số 1–2 chữ số đầu tiêu đề ("8 Asian Countries..."), không bắt năm như "2027 Huazhong..."
const GUIDE_TITLE = /^\d{1,2}\s+\S|^(?:how to|top\s+\d+|best\s)|\bhow to (?:apply|get|win|write|choose|find)\b|\bcountries with\b|^(?:the )?(?:ultimate|complete) guide/i;
// Tài trợ cho tổ chức, dự án, nhà nghiên cứu, không phải học bổng cho sinh viên (không có ngoại lệ "scholarship")
const NOT_STUDENT_FUNDING = /\bchallenge\b|call for proposals|\bproposals?\b|research grants?|(?:grants?|funding) (?:for|to) (?:ngos?|organi[sz]ations?|nonprofits?|startups?|businesses|ventures|entrepreneurs|projects?|researchers)|\bfund for\b/i;

// R6: rác, quảng cáo
const SPAM_TITLE = /\b(casino|betting|bet365|22bet|gambl\w*|poker|slots?|forex|crypto\w*|viagra|payday loans?)\b/i;
const MIN_TITLE_LENGTH = 10;

// R3: bài không rõ hạn nộp mà đăng quá lâu thì bỏ
const MAX_AGE_NO_DEADLINE_DAYS = 365;

// R4: bài ghi rõ chỉ dành cho nhóm khác. Chỉ loại khi chắc chắn (câu khẳng định "only").
const EXCLUSIVE_PATTERNS = [
  /\b(?:open|available|restricted|limited|eligible)\s+(?:only\s+)?(?:to|for)\s+(?:the\s+)?(?:citizens|nationals|residents)\s+of\s+(?:the\s+)?(?:EU|E\.U\.|EEA|European Union|UK|U\.K\.|United Kingdom|US|U\.S\.|USA|United States|Canada|Australia|New Zealand)\b/i,
  /\b(?:EU|EEA|UK|U\.K\.|US|U\.S\.|USA|American|African|Canadian|Australian|British|Commonwealth)\s+(?:citizens|nationals|residents|students|applicants)\s+only\b/i,
  /\bonly\s+(?:for\s+)?(?:african|latin american|caribbean|pacific islander|indigenous|native american)s?\b/i,
  /\b(?:african|caribbean|latin american)s?\s+(?:students\s+|applicants\s+)?only\b/i,
];
// Bài nhắc đích danh Việt Nam thì không bị R4 loại (score.js cũng dùng)
const VIETNAM = /\bvi[eệ]t\s?nam(?:ese)?\b/i;

/* ───────────── Luật ───────────── */

const pass = Object.freeze({ ok: true });
const fail = (rule, reason) => ({ ok: false, rule, reason });

function isHttpsUrl(value) {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

/** BƯỚC 2: R5 link, R6 rác, R1 không phải học bổng. */
function checkBasic(post) {
  if (!post.link || !isHttpsUrl(post.link)) return fail('R5', 'link không hợp lệ');

  const title = post.title || '';
  if (title.length < MIN_TITLE_LENGTH) return fail('R6', 'tiêu đề quá ngắn');
  const spam = title.match(SPAM_TITLE);
  if (spam) return fail('R6', `từ khoá rác "${spam[0]}"`);

  const blockedCategory = post.categories.find((slug) => NOT_SCHOLARSHIP_CATEGORIES.has(slug));
  if (blockedCategory) return fail('R1', `chuyên mục "${blockedCategory}"`);
  if (GUIDE_TITLE.test(title)) return fail('R1', 'bài hướng dẫn hoặc danh sách');
  if (NOT_STUDENT_FUNDING.test(title)) return fail('R1', 'tài trợ cho tổ chức hoặc dự án');
  const notScholarship = title.match(NOT_SCHOLARSHIP_TITLE);
  if (notScholarship && !SCHOLARSHIP_TITLE.test(title)) return fail('R1', `tiêu đề có "${notScholarship[0]}"`);

  return pass;
}

/** BƯỚC 4: R2 hết hạn, R3 bài cũ không rõ hạn, R4 chỉ dành cho nhóm khác. */
function checkDetails(post, info, { now }) {
  if (info.deadline && info.deadline < now) return fail('R2', `hạn ${info.deadline.toISOString().slice(0, 10)}`);

  if (!info.deadline) {
    const ageDays = (now - post.publishedAt) / DAY_MS;
    if (ageDays > MAX_AGE_NO_DEADLINE_DAYS) return fail('R3', `đăng ${Math.round(ageDays)} ngày trước`);
  }

  const text = `${post.title}\n${post.contentText.slice(0, 3000)}`;
  if (!VIETNAM.test(text)) {
    for (const pattern of EXCLUSIVE_PATTERNS) {
      const match = text.match(pattern);
      if (match) return fail('R4', match[0]);
    }
  }

  return pass;
}

module.exports = { RULES, VIETNAM, checkBasic, checkDetails };
