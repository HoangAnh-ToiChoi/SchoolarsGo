'use strict';

const { parseDeadline } = require('./dateParser');
const { findCountry } = require('./countries');

const VALID_DEGREES = new Set(['Bachelor', 'Master', 'PhD']);
const MAX_CONTENT_CHARS = 3500;
const CALL_TIMEOUT_MS = 30000;        // một lệnh gọi quá lâu thì bỏ, không để treo cả lượt kéo
const MIN_INTERVAL_MS = 4500;         // giãn nhịp ~13 lệnh/phút để không vượt giới hạn theo phút của gói miễn phí
const COOLDOWN_MS = 60000;            // bị giới hạn theo phút thì nghỉ chừng này rồi gọi tiếp
const MAX_CONSECUTIVE_FAILURES = 3;   // lỗi liên tiếp chừng này lần thì tắt AI cho cả lượt

const sleep = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/** Lấy object JSON đầu tiên trong câu trả lời (bỏ rào ```json, bỏ chữ thừa phía sau). */
function extractJson(text) {
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

/**
 * Phân loại lỗi để biết nên làm gì tiếp:
 *   'cooldown'  giới hạn theo phút: nghỉ một lát rồi gọi tiếp
 *   'disable'   lỗi vĩnh viễn (hết hạn mức ngày, model không còn, khoá sai): dừng gọi AI cả lượt
 *   null        lỗi riêng của bài đó: bỏ bài, thử bài sau
 */
function classifyError(error) {
  const message = String(error.message);
  if (/per ?day|daily/i.test(message) && /429|quota|RESOURCE_EXHAUSTED/i.test(message)) {
    return { action: 'disable', reason: 'hết hạn mức theo ngày' };
  }
  if (/429|quota|RESOURCE_EXHAUSTED/i.test(message)) return { action: 'cooldown', reason: 'bị giới hạn theo phút' };
  if (/404|no longer available|not found/i.test(message)) return { action: 'disable', reason: 'model không còn tồn tại' };
  if (/API key|API_KEY_INVALID|PERMISSION_DENIED|403|401/i.test(message)) return { action: 'disable', reason: 'khoá API không hợp lệ' };
  return null;
}

/**
 * Dùng Gemini để điền những chỗ trống mà luật chữ không tìm được (nước, bậc học, đơn vị cấp, hạn nộp).
 * Chỉ điền vào chỗ trống, không ghi đè thứ luật chữ đã tìm thấy. Là phần tuỳ chọn:
 * không có `model` thì createGeminiExtractor trả về null và pipeline chạy bình thường.
 *
 * @param {{
 *   model: { generateContent(prompt: string): Promise<{ response: { text(): string } }> },
 *   logger: import('../../types').Logger,
 *   now?: () => Date,
 *   timeoutMs?: number, minIntervalMs?: number, cooldownMs?: number,
 *   sleepImpl?: (ms: number) => Promise<void>, clock?: () => number,
 * }} deps
 */
function createGeminiExtractor({
  model,
  logger,
  now = () => new Date(),
  timeoutMs = CALL_TIMEOUT_MS,
  minIntervalMs = MIN_INTERVAL_MS,
  cooldownMs = COOLDOWN_MS,
  sleepImpl = sleep,
  clock = Date.now,
}) {
  if (!model) return null;
  let consecutiveFailures = 0;
  let disabledReason = null;   // lỗi vĩnh viễn: dừng gọi AI cho đến hết lượt
  let coolingUntil = 0;        // đang nghỉ vì bị giới hạn theo phút: bỏ qua AI cho đến mốc này
  let lastCallAt = null;

  /** Chờ đủ khoảng cách giữa hai lệnh gọi liên tiếp. */
  async function throttle() {
    if (lastCallAt !== null) {
      const wait = lastCallAt + minIntervalMs - clock();
      if (wait > 0) await sleepImpl(wait);
    }
    lastCallAt = clock();
  }

  function handleFailure(error) {
    const kind = classifyError(error);
    if (kind?.action === 'disable') {
      disabledReason = kind.reason;
      logger.warn(`[Gemini] tắt AI cho lượt này (${kind.reason}). Các bài còn lại chỉ dùng luật chữ.`);
    } else if (kind?.action === 'cooldown') {
      coolingUntil = clock() + cooldownMs;
      logger.warn(`[Gemini] ${kind.reason}, nghỉ ${cooldownMs / 1000}s (các bài trong lúc nghỉ chỉ dùng luật chữ)`);
    } else if (++consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      disabledReason = `${MAX_CONSECUTIVE_FAILURES} lần lỗi liên tiếp`;
      logger.warn(`[Gemini] tắt AI cho lượt này (${disabledReason}). Lỗi cuối: ${String(error.message).slice(0, 160)}`);
    } else {
      logger.warn(`[Gemini] bỏ qua một bài: ${String(error.message).slice(0, 160)}`);
    }
  }

  return {
    name: 'gemini',
    /** @returns {Promise<import('../../types').Facts>} */
    async fill(raw, facts) {
      const hasGaps = !facts.country || !facts.degreeKnown || !facts.provider || !facts.deadline;
      if (!hasGaps || disabledReason || clock() < coolingUntil) return facts;

      const prompt = `Trích thông tin học bổng từ bài viết. Chỉ trả về MỘT object JSON, không giải thích.
Các trường (dùng null nếu bài không nói rõ): {"country": "nước đến học bằng tiếng Anh", "degree": "Bachelor|Master|PhD|null", "provider": "trường hoặc tổ chức cấp", "deadline": "YYYY-MM-DD hoặc null"}

Tiêu đề: ${raw.title}
Nội dung:
${raw.contentText.slice(0, MAX_CONTENT_CHARS)}`;

      try {
        await throttle();
        const result = await withTimeout(model.generateContent(prompt), timeoutMs);
        consecutiveFailures = 0;
        const ai = extractJson(result.response.text());
        if (!ai) return facts;
        const merged = { ...facts };

        if (!merged.country && typeof ai.country === 'string') merged.country = findCountry(ai.country);
        if (!merged.degreeKnown && VALID_DEGREES.has(ai.degree)) {
          merged.degree = ai.degree;
          merged.degreeKnown = true;
        }
        if (!merged.provider && typeof ai.provider === 'string' && ai.provider.trim().length >= 3) {
          merged.provider = ai.provider.trim().slice(0, 255);
        }
        if (!merged.deadline && typeof ai.deadline === 'string') {
          merged.deadline = parseDeadline(`Deadline: ${ai.deadline}`, { now: now() });
        }
        return merged;
      } catch (error) {
        handleFailure(error);
        return facts;
      }
    },
  };
}

module.exports = { createGeminiExtractor };
