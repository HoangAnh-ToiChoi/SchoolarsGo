'use strict';

/**
 * Mọi danh sách từ khoá của bộ lọc nằm ở đây. Muốn chặn thêm một từ hay đổi cách chấm điểm
 * thì sửa file này, không cần đụng vào logic trong hardRules.js và scorer.js.
 */

// R1: bài không phải học bổng
const NOT_SCHOLARSHIP_TITLE = /\b(jobs?|vacanc(?:y|ies)|hiring|careers?|recruit(?:ing|ment)?|conferences?|call for papers|webinars?|internships?|contests?|competitions?|workshops?|volunteers?)\b/i;
// Nếu tiêu đề có các từ này thì dù dính từ ở trên vẫn coi là học bổng (vd. "Fully Funded Internship")
const SCHOLARSHIP_TITLE = /\b(scholarships?|fellowships?|bursar(?:y|ies)|grants?|stipends?|fully[- ]funded|funded|awards?|scholars)\b/i;
const NOT_SCHOLARSHIP_CATEGORIES = new Set([
  'job', 'jobs', 'job-vacancies', 'vacancies', 'career', 'careers',
  'internship', 'internships', 'conference', 'conferences',
  'competition', 'competitions', 'contest', 'contests',
  'events', 'event', 'webinars', 'volunteer', 'call-for-papers',
]);

// Bài hướng dẫn, danh sách: không phải một học bổng cụ thể. Không áp dụng ngoại lệ "scholarship" ở trên.
// "^\d{1,2}\s" chỉ bắt số 1–2 chữ số đầu tiêu đề ("8 Asian Countries..."), không bắt năm như "2027 Huazhong..."
const GUIDE_TITLE = /^\d{1,2}\s+\S|^(?:how to|top\s+\d+|best\s)|\bhow to (?:apply|get|win|write|choose|find)\b|\bcountries with\b|^(?:the )?(?:ultimate|complete) guide/i;

// Tài trợ cho tổ chức, dự án, nghiên cứu viên (không phải học bổng cho sinh viên). Cũng không có ngoại lệ "scholarship".
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
// Bài nhắc đích danh Việt Nam thì không bị R4 loại
const VIETNAM = /\bvi[eệ]t\s?nam(?:ese)?\b/i;

// Chấm điểm
const SOUTHEAST_ASIA = /\b(?:asean|south-?east(?:ern)?\s+asia(?:n)?s?)\b/i;
const ASIA = /\b(?:asia|asian|asians)\b|developing countr(?:y|ies)|low(?:-|\s+and\s+)middle(?:-|\s)income/i;
const INTERNATIONAL = /international students|all nationalities|any nationality|worldwide|students from (?:all|any) countr/i;

// Vùng mà người Việt Nam có thể đăng ký (dùng cho tín hiệu từ chuyên mục của nguồn)
const VIETNAM_ELIGIBLE_REGIONS = new Set(['southeastAsia', 'asia', 'global']);

// Trọng số cộng dồn, tối đa lý thuyết 90 nên điểm không bị chạm trần 100.
// Bài nhắc đích danh Việt Nam + Đông Nam Á + còn hạn + đủ thông tin ≈ 85; bài chung chung cho
// sinh viên quốc tế ≈ 15–30. Muốn đổi thứ tự hiển thị thì chỉnh ở đây.
const SCORE = {
  vietnam: 35,
  southeastAsia: 20,
  asia: 10,
  international: 5,
  farFuture: 10,       // còn hạn trên 30 ngày
  complete: 10,        // biết cả nước và bậc học
  noDeadline: -10,
  otherRegionOnly: -20,
};

module.exports = {
  NOT_SCHOLARSHIP_TITLE,
  SCHOLARSHIP_TITLE,
  NOT_SCHOLARSHIP_CATEGORIES,
  GUIDE_TITLE,
  NOT_STUDENT_FUNDING,
  SPAM_TITLE,
  MIN_TITLE_LENGTH,
  MAX_AGE_NO_DEADLINE_DAYS,
  EXCLUSIVE_PATTERNS,
  VIETNAM,
  SOUTHEAST_ASIA,
  ASIA,
  INTERNATIONAL,
  VIETNAM_ELIGIBLE_REGIONS,
  SCORE,
};
