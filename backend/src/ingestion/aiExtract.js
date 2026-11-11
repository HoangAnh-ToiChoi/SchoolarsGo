'use strict';

const { parseDeadline } = require('./extract');
const { findCountry } = require('./countries');

/**
 * BƯỚC 3 (tuỳ chọn) — Nhờ Gemini điền những chỗ luật chữ (extract.js) không tìm được:
 * nước, bậc học, đơn vị cấp, hạn nộp. CHỈ điền chỗ trống, không ghi đè thứ đã có.
 *
 * createAiFill({ model }) trả về hàm fill(post, info) → info đã điền thêm.
 * Không có model (không có GEMINI_API_KEY) thì trả về null và index.js bỏ qua bước này.
 *
 * Gói miễn phí của Gemini có giới hạn nên hàm này tự giữ nhịp:
 *   - mỗi lần gọi cách nhau ≥ 4,5 giây (~13 lần/phút)
 *   - bị giới hạn theo phút  → nghỉ 60 giây, các bài trong lúc nghỉ chỉ dùng luật chữ
 *   - hết hạn mức ngày / khoá sai / model không còn → tắt AI đến hết lượt
 *   - lỗi lặt vặt 3 lần liên tiếp → tắt AI đến hết lượt
 * Lỗi AI không bao giờ làm hỏng lượt kéo: bài đó vẫn đi tiếp với thông tin của luật chữ.
 */

const CALL_TIMEOUT_MS = 30000;
const MIN_INTERVAL_MS = 4500;
const COOLDOWN_MS = 60000;
const MAX_FAILURES_IN_A_ROW = 3;
const MAX_CONTENT_CHARS = 3500;
const VALID_DEGREES = new Set(['Bachelor', 'Master', 'PhD']);

const defaultSleep = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/**
 * Các tham số sau `now` chỉ để test thay thời gian thật.
 * @param {{ model: { generateContent(prompt: string): Promise<{ response: { text(): string } }> } | null, logger: object }} deps
 */
function createAiFill({
  model,
  logger,
  now = () => new Date(),
  timeoutMs = CALL_TIMEOUT_MS,
  minIntervalMs = MIN_INTERVAL_MS,
  cooldownMs = COOLDOWN_MS,
  sleep = defaultSleep,
  clock = Date.now,
}) {
  if (!model) return null;

  let failuresInARow = 0;
  let disabledReason = null; // khác null: AI đã tắt cho đến hết lượt
  let restUntil = 0; // đang nghỉ vì bị giới hạn theo phút
  let lastCallAt = null;

  return async function fill(post, info) {
    const hasGaps = !info.country || !info.degreeKnown || !info.provider || !info.deadline;
    if (!hasGaps || disabledReason || clock() < restUntil) return info;

    try {
      await waitForTurn();
      const result = await withTimeout(model.generateContent(buildPrompt(post)), timeoutMs);
      failuresInARow = 0;
      const ai = firstJsonObject(result.response.text());
      return ai ? mergeGaps(info, ai, now()) : info;
    } catch (error) {
      handleError(error);
      return info;
    }
  };

  /** Chờ cho đủ khoảng cách tối thiểu giữa hai lần gọi. */
  async function waitForTurn() {
    if (lastCallAt !== null) {
      const wait = lastCallAt + minIntervalMs - clock();
      if (wait > 0) await sleep(wait);
    }
    lastCallAt = clock();
  }

  function handleError(error) {
    const message = String(error.message);
    const kind = classifyError(message);
    if (kind?.action === 'disable') {
      disabledReason = kind.reason;
      logger.warn(`[Gemini] tắt AI cho lượt này (${kind.reason}). Các bài còn lại chỉ dùng luật chữ.`);
    } else if (kind?.action === 'rest') {
      restUntil = clock() + cooldownMs;
      logger.warn(`[Gemini] ${kind.reason}, nghỉ ${cooldownMs / 1000}s (các bài trong lúc nghỉ chỉ dùng luật chữ)`);
    } else if (++failuresInARow >= MAX_FAILURES_IN_A_ROW) {
      disabledReason = `${MAX_FAILURES_IN_A_ROW} lần lỗi liên tiếp`;
      logger.warn(`[Gemini] tắt AI cho lượt này (${disabledReason}). Lỗi cuối: ${message.slice(0, 160)}`);
    } else {
      logger.warn(`[Gemini] bỏ qua một bài: ${message.slice(0, 160)}`);
    }
  }
}

function buildPrompt(post) {
  return `Trích thông tin học bổng từ bài viết. Chỉ trả về MỘT object JSON, không giải thích.
Các trường (dùng null nếu bài không nói rõ): {"country": "nước đến học bằng tiếng Anh", "degree": "Bachelor|Master|PhD|null", "provider": "trường hoặc tổ chức cấp", "deadline": "YYYY-MM-DD hoặc null"}

Tiêu đề: ${post.title}
Nội dung:
${post.contentText.slice(0, MAX_CONTENT_CHARS)}`;
}

/** Chỉ điền vào chỗ còn trống, và chỉ nhận giá trị hợp lệ (nước có trong danh sách, bậc học đúng 3 loại…). */
function mergeGaps(info, ai, now) {
  const merged = { ...info };
  if (!merged.country && typeof ai.country === 'string') merged.country = findCountry(ai.country);
  if (!merged.degreeKnown && VALID_DEGREES.has(ai.degree)) {
    merged.degree = ai.degree;
    merged.degreeKnown = true;
  }
  if (!merged.provider && typeof ai.provider === 'string' && ai.provider.trim().length >= 3) {
    merged.provider = ai.provider.trim().slice(0, 255);
  }
  if (!merged.deadline && typeof ai.deadline === 'string') {
    merged.deadline = parseDeadline(`Deadline: ${ai.deadline}`, { now });
  }
  return merged;
}

/**
 * 'rest'    bị giới hạn theo phút: nghỉ một lát rồi gọi tiếp
 * 'disable' lỗi không tự hết (hạn mức ngày, model không còn, khoá sai): tắt AI cả lượt
 * null      lỗi riêng của bài đó: bỏ bài, thử bài sau
 */
function classifyError(message) {
  const isQuota = /429|quota|RESOURCE_EXHAUSTED/i.test(message);
  if (isQuota && /per ?day|daily/i.test(message)) return { action: 'disable', reason: 'hết hạn mức theo ngày' };
  if (isQuota) return { action: 'rest', reason: 'bị giới hạn theo phút' };
  if (/404|no longer available|not found/i.test(message)) return { action: 'disable', reason: 'model không còn tồn tại' };
  if (/API key|API_KEY_INVALID|PERMISSION_DENIED|403|401/i.test(message)) return { action: 'disable', reason: 'khoá API không hợp lệ' };
  return null;
}

/** Lấy object JSON đầu tiên trong câu trả lời (Gemini hay bọc ```json hoặc nói thêm chữ phía sau). */
function firstJsonObject(text) {
  const start = text.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (ch === '\\') i++;
      else if (ch === '"') inString = false;
    } else if (ch === '"') inString = true;
    else if (ch === '{') depth++;
    else if (ch === '}' && --depth === 0) return JSON.parse(text.slice(start, i + 1));
  }
  return null;
}

function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`quá ${ms / 1000}s không thấy Gemini trả lời`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

module.exports = { createAiFill };
