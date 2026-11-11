'use strict';

const { findCountry } = require('./countries');

/**
 * BƯỚC 3 — Đọc nội dung bài, tìm thông tin học bổng bằng luật chữ (regex). Miễn phí, không gọi AI.
 * Chỗ nào không tìm được thì để null; aiExtract.js (nếu bật) sẽ điền tiếp.
 *
 * extractInfo(post) trả về `info`:
 *   { deadline, degree, degreeKnown, country, provider, coverage, language, minGpa, minIelts }
 */
function extractInfo(post, { now }) {
  const text = `${post.title}\n${post.contentText}`;
  return {
    deadline: parseDeadline(text, { now }),
    ...findDegree(post),
    country: findStudyCountry(post),
    provider: findProvider(post),
    coverage: findCoverage(text),
    language: 'English',
    minGpa: findMinGpa(text),
    minIelts: findMinIelts(text),
  };
}

/* ───────────── Bậc học ───────────── */

const DEGREE_PATTERNS = {
  Bachelor: /\b(?:bachelor'?s?|undergraduate|undergrad|BSc)\b/i,
  Master: /\b(?:master'?s?|MSc|MBA|postgraduate)\b/i,
  PhD: /\b(?:ph\.?d\.?|doctoral|doctorate|DPhil)\b/i,
};

const degreesIn = (text) => Object.keys(DEGREE_PATTERNS).filter((name) => DEGREE_PATTERNS[name].test(text));

/** Ưu tiên gợi ý từ chuyên mục, rồi tiêu đề, rồi đầu bài. Nhiều bậc khác nhau → 'Any'. */
function findDegree(post) {
  const fromSignals = post.signals.filter((s) => s.startsWith('degree:')).map((s) => s.slice('degree:'.length));
  const found = fromSignals.length ? fromSignals : degreesIn(post.title);
  const degrees = [...new Set(found.length ? found : degreesIn(post.contentText.slice(0, 1500)))];
  return degrees.length === 1 ? { degree: degrees[0], degreeKnown: true } : { degree: 'Any', degreeKnown: false };
}

/* ───────────── Nước đến học ───────────── */

// Nhãn trong bài: "Study in: Japan", "Host country: ...", "Location of the Opportunity\nJapan"
const COUNTRY_LABEL = /(?:study in|host countr(?:y|ies)|country of study|location(?:\s+of\s+(?:the\s+)?(?:opportunity|study|program(?:me)?|scholarship))?)\s*:?\s*\n?\s*([^\n]{2,80})/gi;

/**
 * Thứ tự tin cậy: nhãn trong bài → tiêu đề → gợi ý từ chuyên mục.
 * Chuyên mục để cuối vì có trang dùng chuyên mục cho vùng được đăng ký, không phải nước đến học.
 */
function findStudyCountry(post) {
  for (const label of post.contentText.matchAll(COUNTRY_LABEL)) {
    const country = findCountry(label[1]);
    if (country) return country;
  }
  const fromTitle = findCountry(post.title);
  if (fromTitle) return fromTitle;
  const signal = post.signals.find((s) => s.startsWith('country:'));
  return signal ? signal.slice('country:'.length) : null;
}

/* ───────────── Đơn vị cấp, mức tài trợ, GPA, IELTS ───────────── */

const PROVIDER_LABEL = /(?:host institution(?:\(s\))?|host organi[sz]ation|organi[sz]ation|offered by|provided by|awarded by|funded by|provider)\s*:?\s*\n?\s*([^\n]{3,120})/i;
// Không có nhãn thì lấy phần đứng trước chữ "Scholarship" trong tiêu đề: "Chevening Scholarship" → "Chevening"
const TITLE_PREFIX = /^(.{4,100}?)\s+(?:scholarships?|fellowships?|programmes?|programs?|awards?|grants?|bursar(?:y|ies))\b/i;

function findProvider(post) {
  const labelled = post.contentText.match(PROVIDER_LABEL);
  if (labelled) {
    const parts = labelled[1].split(',').map((p) => p.trim()).filter(Boolean);
    // "University of Oxford, United Kingdom" → bỏ tên nước ở cuối
    while (parts.length > 1 && findCountry(parts[parts.length - 1]) === parts[parts.length - 1]) parts.pop();
    const provider = parts.join(', ').replace(/[:.]+$/, '').trim();
    if (provider.length >= 3) return provider;
  }
  const prefix = post.title.match(TITLE_PREFIX);
  return prefix ? prefix[1].trim() : null;
}

function findCoverage(text) {
  if (/fully[- ]funded|full scholarship|full tuition|full funding|covers? (?:all|full)/i.test(text)) return 'Full';
  if (/tuition (?:fee )?(?:waiver|only)/i.test(text)) return 'Tuition Only';
  if (/partial (?:scholarship|funding|tuition)/i.test(text)) return 'Partial';
  return null;
}

function findMinIelts(text) {
  const m = text.match(/IELTS[^\n.]{0,50}?\b([4-9](?:\.[05])?)\b/i);
  return m ? Number(m[1]) : null;
}

function findMinGpa(text) {
  const m = text.match(/\bGPA\b[^\n.]{0,50}?\b([0-4](?:\.\d{1,2})?)\b/i);
  const value = m ? Number(m[1]) : null;
  return value !== null && value > 0 && value <= 4 ? value : null;
}

/* ───────────── Hạn nộp ───────────── */

const MONTHS = {
  jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2, apr: 3, april: 3, may: 4,
  jun: 5, june: 5, jul: 6, july: 6, aug: 7, august: 7, sep: 8, sept: 8, september: 8,
  oct: 9, october: 9, nov: 10, november: 10, dec: 11, december: 11,
};

const MONTH = '(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)';
// 4 kiểu viết ngày, thứ tự quan trọng: "20 December 2026", "December 20, 2026", "2026-12-20", "December 2026"
const DAY_MONTH_YEAR = `(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?${MONTH}\\.?,?\\s+(\\d{4})`;
const MONTH_DAY_YEAR = `${MONTH}\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+(\\d{4})`;
const ISO_DATE = '(\\d{4})-(\\d{2})-(\\d{2})';
const MONTH_YEAR = `${MONTH}\\.?,?\\s+(\\d{4})`;
const DATE_RE = new RegExp(`(?:${DAY_MONTH_YEAR})|(?:${MONTH_DAY_YEAR})|(?:${ISO_DATE})|(?:${MONTH_YEAR})`, 'gi');

// Từ báo hiệu "ngay sau đây là hạn nộp"
const DEADLINE_WORDS = /(?:deadline|apply by|apply before|applications?\s+(?:close|closes|closing|due|are due|must be submitted)|closing date|closes? on|due date|due by|last date|submit(?:ted)?\s+(?:by|before))/gi;
const LOOK_AHEAD_CHARS = 120;

function makeDate(year, month, day) {
  if (year < 2000 || year > 2100 || month < 0 || month > 11) return null;
  if (day === null) return new Date(Date.UTC(year, month + 1, 0, 23, 59, 59)); // chỉ có tháng-năm → cuối tháng
  if (day < 1 || day > 31) return null;
  return new Date(Date.UTC(year, month, day, 23, 59, 59));
}

/** Mọi ngày tìm thấy trong một đoạn chữ ngắn. */
function datesIn(snippet) {
  const dates = [];
  for (const m of snippet.matchAll(DATE_RE)) {
    let date = null;
    if (m[1] !== undefined) date = makeDate(Number(m[3]), MONTHS[m[2].toLowerCase()], Number(m[1]));
    else if (m[4] !== undefined) date = makeDate(Number(m[6]), MONTHS[m[4].toLowerCase()], Number(m[5]));
    else if (m[7] !== undefined) date = makeDate(Number(m[7]), Number(m[8]) - 1, Number(m[9]));
    else if (m[10] !== undefined) date = makeDate(Number(m[11]), MONTHS[m[10].toLowerCase()], null);
    if (date) dates.push(date);
  }
  return dates;
}

/**
 * Lấy các ngày đứng ngay sau từ "deadline", "apply by"... (trong 120 ký tự, cùng dòng).
 * Nhiều ngày thì chọn ngày gần nhất còn hạn; nếu đều đã qua thì chọn ngày muộn nhất (để luật R2 loại bài).
 * @returns {Date|null}
 */
function parseDeadline(text, { now }) {
  const candidates = [];
  for (const word of text.matchAll(DEADLINE_WORDS)) {
    const snippet = text.slice(word.index, word.index + LOOK_AHEAD_CHARS).split('\n')[0];
    candidates.push(...datesIn(snippet));
  }
  if (candidates.length === 0) return null;

  const upcoming = candidates.filter((d) => d >= now).sort((a, b) => a - b);
  if (upcoming.length > 0) return upcoming[0];
  return candidates.sort((a, b) => b - a)[0];
}

module.exports = { extractInfo, parseDeadline };
