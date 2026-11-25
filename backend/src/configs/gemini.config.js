// Cấu hình Gemini đọc từ biến môi trường (hàm, không phải hằng số, để test đổi env được)
const getGeminiApiKey = () => process.env.GEMINI_API_KEY;
const getGeminiModel = () => process.env.GEMINI_MODEL || 'gemini-flash-lite-latest';
// Bước AI điền chỗ trống khi kéo học bổng; đặt INGESTION_USE_AI=false để chạy bằng luật thuần
const getIngestionUseAi = () => process.env.INGESTION_USE_AI !== 'false';

export { getGeminiApiKey, getGeminiModel, getIngestionUseAi };
