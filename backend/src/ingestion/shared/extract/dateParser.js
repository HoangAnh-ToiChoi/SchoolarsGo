'use strict';

const MONTHS = {
  jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2, apr: 3, april: 3, may: 4,
  jun: 5, june: 5, jul: 6, july: 6, aug: 7, august: 7, sep: 8, sept: 8, september: 8,
  oct: 9, october: 9, nov: 10, november: 10, dec: 11, december: 11,
};

const MONTH = '(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)';
// Thứ tự quan trọng: ngày-tháng-năm, tháng-ngày-năm, ISO, tháng-năm
const DMY = `(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?${MONTH}\\.?,?\\s+(\\d{4})`;
const MDY = `${MONTH}\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+(\\d{4})`;
const ISO = '(\\d{4})-(\\d{2})-(\\d{2})';
const MY = `${MONTH}\\.?,?\\s+(\\d{4})`;
const DATE_RE = new RegExp(`(?:${DMY})|(?:${MDY})|(?:${ISO})|(?:${MY})`, 'gi');

// Từ báo hiệu "đây là hạn nộp"
const KEYWORD_RE = /(?:deadline|apply by|apply before|applications?\s+(?:close|closes|closing|due|are due|must be submitted)|closing date|closes? on|due date|due by|last date|submit(?:ted)?\s+(?:by|before))/gi;
const WINDOW_CHARS = 120;

function makeDate(year, month, day) {
  if (year < 2000 || year > 2100 || month < 0 || month > 11) return null;
  if (day === null) return new Date(Date.UTC(year, month + 1, 0, 23, 59, 59)); // tháng-năm → cuối tháng
  if (day < 1 || day > 31) return null;
  return new Date(Date.UTC(year, month, day, 23, 59, 59));
}

/** Tìm mọi ngày trong một đoạn ngắn. */
function scanDates(window) {
  const found = [];
  for (const m of window.matchAll(DATE_RE)) {
    let date = null;
    if (m[1] !== undefined) date = makeDate(Number(m[3]), MONTHS[m[2].toLowerCase()], Number(m[1]));
    else if (m[4] !== undefined) date = makeDate(Number(m[6]), MONTHS[m[4].toLowerCase()], Number(m[5]));
    else if (m[7] !== undefined) date = makeDate(Number(m[7]), Number(m[8]) - 1, Number(m[9]));
    else if (m[10] !== undefined) date = makeDate(Number(m[11]), MONTHS[m[10].toLowerCase()], null);
    if (date) found.push(date);
  }
  return found;
}

/**
 * Tìm hạn nộp trong văn bản: lấy các ngày đứng ngay sau từ khoá "deadline", "apply by"...
 * Có nhiều ngày thì chọn ngày gần nhất còn hạn; nếu đều đã qua thì chọn ngày muộn nhất
 * (để luật R2 loại bài đó một cách đúng đắn).
 * @param {string} text
 * @param {{ now: Date }} context
 * @returns {Date|null}
 */
function parseDeadline(text, { now }) {
  const candidates = [];
  for (const k of text.matchAll(KEYWORD_RE)) {
    const window = text.slice(k.index, k.index + WINDOW_CHARS).split('\n')[0];
    candidates.push(...scanDates(window));
  }
  if (candidates.length === 0) return null;

  const upcoming = candidates.filter((d) => d >= now).sort((a, b) => a - b);
  if (upcoming.length > 0) return upcoming[0];
  return candidates.sort((a, b) => b - a)[0];
}

module.exports = { parseDeadline };
