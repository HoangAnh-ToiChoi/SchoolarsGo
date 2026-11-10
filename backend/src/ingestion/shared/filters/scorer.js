'use strict';

const kw = require('./keywords');

const DAY_MS = 24 * 60 * 60 * 1000;

function regionsFromSignals(signals) {
  return signals.filter((s) => s.startsWith('region:')).map((s) => s.slice('region:'.length));
}

/**
 * Chấm độ phù hợp với sinh viên Việt Nam, 0–100. Không loại bài nào, chỉ quyết định thứ tự hiển thị.
 * @param {import('../../types').RawPost} raw
 * @param {import('../../types').Facts} facts
 * @param {{ now: Date }} context
 * @returns {{ score: number, reasons: string[] }}
 */
function score(raw, facts, { now }) {
  const text = `${raw.title}\n${raw.contentText}`;
  const regions = regionsFromSignals(raw.signals);
  const reasons = [];
  let total = 0;
  const add = (points, reason) => {
    total += points;
    reasons.push(`${points > 0 ? '+' : ''}${points} ${reason}`);
  };

  const mentionsVietnam = kw.VIETNAM.test(text);
  const mentionsSoutheastAsia = regions.includes('southeastAsia') || kw.SOUTHEAST_ASIA.test(text);
  const mentionsAsia = regions.includes('asia') || kw.ASIA.test(text);

  if (mentionsVietnam) add(kw.SCORE.vietnam, 'nhắc Việt Nam');
  if (mentionsSoutheastAsia) add(kw.SCORE.southeastAsia, 'Đông Nam Á / ASEAN');
  if (mentionsAsia) add(kw.SCORE.asia, 'châu Á / nước đang phát triển');
  if (kw.INTERNATIONAL.test(text)) add(kw.SCORE.international, 'mở cho sinh viên quốc tế');

  const onlyOtherRegions =
    regions.length > 0 &&
    !regions.some((r) => kw.VIETNAM_ELIGIBLE_REGIONS.has(r)) &&
    !mentionsVietnam && !mentionsSoutheastAsia && !mentionsAsia;
  if (onlyOtherRegions) add(kw.SCORE.otherRegionOnly, `chuyên mục chỉ gồm vùng khác (${regions.join(', ')})`);

  if (facts.deadline) {
    if ((facts.deadline - now) / DAY_MS > 30) add(kw.SCORE.farFuture, 'còn hạn trên 30 ngày');
  } else {
    add(kw.SCORE.noDeadline, 'chưa rõ hạn nộp');
  }
  if (facts.country && facts.degreeKnown) add(kw.SCORE.complete, 'biết rõ nước và bậc học');

  return { score: Math.max(0, Math.min(100, total)), reasons };
}

module.exports = { score };
