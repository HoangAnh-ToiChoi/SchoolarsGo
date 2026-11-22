// Cấu hình Gemini đọc từ biến môi trường (hàm, không phải hằng số, để test đổi env được)
const getGeminiApiKey = () => process.env.GEMINI_API_KEY;
const getGeminiModel = () => process.env.GEMINI_MODEL || 'gemini-flash-lite-latest';

export { getGeminiApiKey, getGeminiModel };
