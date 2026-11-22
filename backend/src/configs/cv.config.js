// Giới hạn đọc CV theo môi trường: đọc CV tốn lượt Gemini nên production chặt, dev nới lỏng để thử
const getCvDailyLimit = () => (process.env.NODE_ENV === 'production' ? 5 : 100);

export { getCvDailyLimit };
