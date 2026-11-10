'use strict';

const { parseDeadline } = require('./dateParser');
const { findCountry } = require('./countries');

const DEGREE_PATTERNS = {
  Bachelor: /\b(?:bachelor'?s?|undergraduate|undergrad|BSc)\b/i,
  Master: /\b(?:master'?s?|MSc|MBA|postgraduate)\b/i,
  PhD: /\b(?:ph\.?d\.?|doctoral|doctorate|DPhil)\b/i,
};

// Có cờ g để duyệt mọi nhãn trong bài; "Location of the Opportunity\nJapan" cũng được nhận
const COUNTRY_LABEL = /(?:study in|host countr(?:y|ies)|country of study|location(?:\s+of\s+(?:the\s+)?(?:opportunity|study|program(?:me)?|scholarship))?)\s*:?\s*\n?\s*([^\n]{2,80})/gi;
const PROVIDER_LABEL = /(?:host institution(?:\(s\))?|host organi[sz]ation|organi[sz]ation|offered by|provided by|awarded by|funded by|provider)\s*:?\s*\n?\s*([^\n]{3,120})/i;
const TITLE_PREFIX = /^(.{4,100}?)\s+(?:scholarships?|fellowships?|programmes?|programs?|awards?|grants?|bursar(?:y|ies))\b/i;

function degreesIn(text) {
  return Object.entries(DEGREE_PATTERNS).filter(([, re]) => re.test(text)).map(([name]) => name);
}

/** Bậc học: ưu tiên gợi ý từ chuyên mục của nguồn, rồi tiêu đề, rồi đầu bài. Nhiều bậc khác nhau → 'Any'. */
function detectDegree(raw) {
  const fromSignals = raw.signals.filter((s) => s.startsWith('degree:')).map((s) => s.slice(7));
  const found = fromSignals.length ? fromSignals : degreesIn(raw.title);
  const degrees = found.length ? found : degreesIn(raw.contentText.slice(0, 1500));
  const unique = [...new Set(degrees)];
  return unique.length === 1 ? { degree: unique[0], degreeKnown: true } : { degree: 'Any', degreeKnown: false };
}

/**
 * Nước đến học. Thứ tự tin cậy: nhãn trong bài ("Study in: Japan") → tiêu đề → gợi ý từ chuyên mục.
 * Chuyên mục để cuối cùng vì có nguồn dùng chuyên mục cho vùng đủ điều kiện chứ không phải nước đến học.
 */
function detectCountry(raw) {
  for (const label of raw.contentText.matchAll(COUNTRY_LABEL)) {
    const country = findCountry(label[1]);
    if (country) return country;
  }
  const fromTitle = findCountry(raw.title);
  if (fromTitle) return fromTitle;
  const signal = raw.signals.find((s) => s.startsWith('country:'));
  return signal ? signal.slice(8) : null;
}

function detectProvider(raw) {
  const labelled = raw.contentText.match(PROVIDER_LABEL);
  if (labelled) {
    const parts = labelled[1].split(',').map((p) => p.trim()).filter(Boolean);
    // "University of Oxford, United Kingdom" → bỏ phần tên nước ở cuối
    while (parts.length > 1 && findCountry(parts[parts.length - 1]) === parts[parts.length - 1]) parts.pop();
    const provider = parts.join(', ').replace(/[:.]+$/, '').trim();
    if (provider.length >= 3) return provider;
  }
  const prefix = raw.title.match(TITLE_PREFIX);
  return prefix ? prefix[1].trim() : null;
}

function detectCoverage(text) {
  if (/fully[- ]funded|full scholarship|full tuition|full funding|covers? (?:all|full)/i.test(text)) return 'Full';
  if (/tuition (?:fee )?(?:waiver|only)/i.test(text)) return 'Tuition Only';
  if (/partial (?:scholarship|funding|tuition)/i.test(text)) return 'Partial';
  return null;
}

function detectMinIelts(text) {
  const m = text.match(/IELTS[^\n.]{0,50}?\b([4-9](?:\.[05])?)\b/i);
  return m ? Number(m[1]) : null;
}

function detectMinGpa(text) {
  const m = text.match(/\bGPA\b[^\n.]{0,50}?\b([0-4](?:\.\d{1,2})?)\b/i);
  const value = m ? Number(m[1]) : null;
  return value !== null && value > 0 && value <= 4 ? value : null;
}

/**
 * Trích xuất thông tin bằng luật chữ (miễn phí, không gọi AI).
 * @param {import('../../types').RawPost} raw
 * @param {{ now: Date }} context
 * @returns {import('../../types').Facts}
 */
function extractFacts(raw, { now }) {
  const text = `${raw.title}\n${raw.contentText}`;
  return {
    deadline: parseDeadline(text, { now }),
    ...detectDegree(raw),
    country: detectCountry(raw),
    provider: detectProvider(raw),
    coverage: detectCoverage(text),
    language: 'English',
    minGpa: detectMinGpa(text),
    minIelts: detectMinIelts(text),
  };
}

module.exports = { extractFacts };
