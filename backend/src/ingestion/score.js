'use strict';

const { VIETNAM } = require('./filter');

/**
 * BƯỚC 5 — Chấm độ phù hợp với sinh viên Việt Nam (0–100).
 * Không loại bài nào, chỉ quyết định thứ tự hiển thị (cột relevance_score).
 */

const DAY_MS = 24 * 60 * 60 * 1000;

const SOUTHEAST_ASIA = /\b(?:asean|south-?east(?:ern)?\s+asia(?:n)?s?)\b/i;
const ASIA = /\b(?:asia|asian|asians)\b|developing countr(?:y|ies)|low(?:-|\s+and\s+)middle(?:-|\s)income/i;
const INTERNATIONAL = /international students|all nationalities|any nationality|worldwide|students from (?:all|any) countr/i;

// Vùng mà người Việt Nam có thể đăng ký (so với gợi ý vùng từ chuyên mục của trang)
const VIETNAM_ELIGIBLE_REGIONS = new Set(['southeastAsia', 'asia', 'global']);

// Điểm cộng/trừ. Tối đa lý thuyết 90 nên không chạm trần 100.
// Nhắc đích danh Việt Nam + Đông Nam Á + còn hạn + đủ thông tin ≈ 85; bài chung cho sinh viên quốc tế ≈ 15–30.
const POINTS = {
  vietnam: 35,
  southeastAsia: 20,
  asia: 10,
  international: 5,
  farFuture: 10, // còn hạn trên 30 ngày
  complete: 10, // biết cả nước và bậc học
  noDeadline: -10,
  otherRegionOnly: -20,
};

/** @returns {{ score: number, reasons: string[] }} reasons để xem vì sao bài được bao nhiêu điểm */
function scorePost(post, info, { now }) {
  const text = `${post.title}\n${post.contentText}`;
  const regions = post.signals.filter((s) => s.startsWith('region:')).map((s) => s.slice('region:'.length));
  const reasons = [];
  let total = 0;
  const add = (points, reason) => {
    total += points;
    reasons.push(`${points > 0 ? '+' : ''}${points} ${reason}`);
  };

  const mentionsVietnam = VIETNAM.test(text);
  const mentionsSoutheastAsia = regions.includes('southeastAsia') || SOUTHEAST_ASIA.test(text);
  const mentionsAsia = regions.includes('asia') || ASIA.test(text);

  if (mentionsVietnam) add(POINTS.vietnam, 'nhắc Việt Nam');
  if (mentionsSoutheastAsia) add(POINTS.southeastAsia, 'Đông Nam Á / ASEAN');
  if (mentionsAsia) add(POINTS.asia, 'châu Á / nước đang phát triển');
  if (INTERNATIONAL.test(text)) add(POINTS.international, 'mở cho sinh viên quốc tế');

  const onlyOtherRegions =
    regions.length > 0 &&
    !regions.some((r) => VIETNAM_ELIGIBLE_REGIONS.has(r)) &&
    !mentionsVietnam &&
    !mentionsSoutheastAsia &&
    !mentionsAsia;
  if (onlyOtherRegions) add(POINTS.otherRegionOnly, `chuyên mục chỉ gồm vùng khác (${regions.join(', ')})`);

  if (info.deadline) {
    if ((info.deadline - now) / DAY_MS > 30) add(POINTS.farFuture, 'còn hạn trên 30 ngày');
  } else {
    add(POINTS.noDeadline, 'chưa rõ hạn nộp');
  }
  if (info.country && info.degreeKnown) add(POINTS.complete, 'biết rõ nước và bậc học');

  return { score: Math.max(0, Math.min(100, total)), reasons };
}

module.exports = { scorePost };
