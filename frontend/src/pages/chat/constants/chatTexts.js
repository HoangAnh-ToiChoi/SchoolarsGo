import { CHAT_MAX_LENGTH } from './chatLimits';

export const WELCOME_MESSAGE = {
  role: 'assistant',
  content: `Xin chào! Mình là **ScholarsBot** 👋\n\nMình có thể giúp bạn:\n• 🎓 Tìm học bổng phù hợp với profile của bạn\n• 📋 Tư vấn điều kiện & quy trình ứng tuyển\n• 📝 Hướng dẫn chuẩn bị hồ sơ (SOP, CV học thuật)\n• 🌍 Thông tin du học theo quốc gia\n\nBạn đang tìm học bổng cho bậc học nào? 😊`,
};

export const MESSAGE_TOO_LONG = `Tin nhắn quá dài. Vui lòng giới hạn dưới ${CHAT_MAX_LENGTH} ký tự.`;
export const FALLBACK_REPLY = 'Mình gặp sự cố, bạn thử lại nhé.';

// Thẻ HTML được giữ lại khi hiển thị nội dung tin nhắn
export const CHAT_ALLOWED_TAGS = ['strong', 'br'];
