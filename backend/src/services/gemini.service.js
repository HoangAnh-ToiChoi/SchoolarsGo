import { GoogleGenerativeAI } from '@google/generative-ai';
import { getGeminiApiKey, getGeminiModel } from '~/configs/gemini.config.js';

// Gemini chỉ dùng để đọc CV và điền chỗ trống khi kéo học bổng. Chat và gợi ý không gọi LLM (chờ dịch vụ RAG riêng).
let genAI = null;

const getClient = () => {
  if (!genAI && getGeminiApiKey()) {
    genAI = new GoogleGenerativeAI(getGeminiApiKey());
  }
  return genAI;
};

/** Model trả JSON cho module kéo học bổng; không có khóa thì null (ingestion chạy bằng luật thuần). */
const getJsonModel = () => {
  const client = getClient();
  if (!client) return null;
  return client.getGenerativeModel({
    model: getGeminiModel(),
    generationConfig: { responseMimeType: 'application/json', temperature: 0 },
  });
};

export { getClient, getJsonModel };
