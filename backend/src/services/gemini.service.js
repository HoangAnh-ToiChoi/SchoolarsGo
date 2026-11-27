import { GoogleGenAI } from '@google/genai';
import { getGeminiApiKey, getGeminiModel } from '~/configs/gemini.config.js';

// Gemini chỉ dùng để đọc CV và điền chỗ trống khi kéo học bổng. Chat và gợi ý không gọi LLM (chờ dịch vụ RAG riêng).
// SDK @google/genai (bản cũ @google/generative-ai đã hết hỗ trợ). Bản 2.x vì cần chạy được trên Node 20 (ingest.yml)
const JSON_CONFIG = Object.freeze({ responseMimeType: 'application/json', temperature: 0 });

let client = null;

function getClient() {
  if (!client && getGeminiApiKey()) client = new GoogleGenAI({ apiKey: getGeminiApiKey() });
  return client;
}

// Hủy hẳn request HTTP khi quá giờ: withTimeout của nơi gọi chỉ reject Promise, request vẫn chạy ngầm giữ socket và chữ CV
function withAbort(config, timeoutMs) {
  if (!timeoutMs) return config;
  return { ...config, abortSignal: AbortSignal.timeout(timeoutMs) };
}

/**
 * Model trả JSON, giữ giao diện cũ `generateContent(prompt) → { response: { text() } }` cho đọc CV và ingestion/aiExtract.
 * Không có khóa API thì null (CV báo AI_UNAVAILABLE, ingestion chạy bằng luật thuần).
 */
function getJsonModel(config = JSON_CONFIG) {
  const ai = getClient();
  if (!ai) return null;
  return {
    async generateContent(prompt, { timeoutMs } = {}) {
      const requestConfig = withAbort(config, timeoutMs);
      const response = await ai.models.generateContent({ model: getGeminiModel(), contents: prompt, config: requestConfig });
      const text = response.text ?? '';
      return { response: { text: () => text } };
    },
  };
}

export { getJsonModel };
