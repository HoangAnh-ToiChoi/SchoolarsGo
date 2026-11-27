// Chat tạm chạy KHÔNG qua LLM: tìm học bổng trong DB theo bộ lọc rút từ câu hỏi.
// Khi có dịch vụ RAG riêng, chỉ thay phần trả lời trong ChatService (#answer).

const CHAT_MAX_MESSAGES = 50; // client gửi cả phiên; chỉ giữ CHAT_HISTORY_KEPT tin gần nhất
const CHAT_HISTORY_KEPT = 20;
const CHAT_USER_MESSAGE_MAX = 1000;
const CHAT_ANY_MESSAGE_MAX = 4000; // tin của trợ lý (danh sách học bổng) dài hơn tin người dùng
const CHAT_RESULT_LIMIT = 8;
const CHAT_HISTORY_LIMIT = 40;
const CHAT_FILTER_WINDOW = 8; // số tin gần nhất dùng để rút bộ lọc
const CHAT_TOPIC_WINDOW = 4; // số tin gần nhất dùng để đoán câu hỏi có về học bổng không

// `\b` của JS không coi chữ có dấu là chữ ("sĩ", "úc", "đức" không bao giờ khớp) → tự dựng ranh giới Unicode
function wordPattern(words) {
  return new RegExp(`(?<![\\p{L}\\d])(?:${words.join('|')})(?![\\p{L}\\d])`, 'iu');
}

// Một âm tiết dễ trùng từ thường ("anh" đại từ, "cập nhật", "thẩm mỹ", "phương pháp", "đạo đức", "hàn lâm"):
// chỉ coi là tên nước khi đứng sau từ chỉ nơi chốn; tên đầy đủ ("nhật bản", "hàn quốc") thì khớp luôn
const PLACE_CONTEXT = '(?<=(?:học bổng|du học|ở|sang|tại|bên|nước)\\s)';
function placeWord(word) {
  return `${PLACE_CONTEXT}${word}`;
}

// Giá trị phải khớp cột scholarships.country do ingestion ghi (ingestion/countries.js)
const CHAT_COUNTRY_PATTERNS = [
  { pattern: wordPattern(['úc', 'australia', 'australian']), value: 'Australia' },
  { pattern: wordPattern([placeWord('anh'), 'anh quốc', 'vương quốc anh', 'uk', 'united kingdom', 'britain', 'england']), value: 'United Kingdom' },
  { pattern: wordPattern([placeWord('mỹ'), 'hoa kỳ', 'usa', 'america', 'united states']), value: 'United States' },
  { pattern: wordPattern(['canada', 'canadian']), value: 'Canada' },
  { pattern: wordPattern([placeWord('đức'), 'germany', 'german']), value: 'Germany' },
  { pattern: wordPattern([placeWord('pháp'), 'france', 'french']), value: 'France' },
  { pattern: wordPattern([placeWord('nhật'), 'nhật bản', 'japan', 'japanese']), value: 'Japan' },
  { pattern: wordPattern([placeWord('hàn'), 'hàn quốc', 'korea', 'korean', 'south korea']), value: 'South Korea' },
  { pattern: wordPattern(['singapore']), value: 'Singapore' },
  { pattern: wordPattern(['new zealand', 'nz']), value: 'New Zealand' },
  { pattern: wordPattern(['hà lan', 'netherlands', 'dutch']), value: 'Netherlands' },
  { pattern: wordPattern(['thụy điển', 'sweden', 'swedish']), value: 'Sweden' },
];

const CHAT_DEGREE_PATTERNS = [
  { pattern: wordPattern(['tiến sĩ', 'phd', 'doctorate']), value: 'PhD' },
  { pattern: wordPattern(['thạc sĩ', 'master', 'masters', 'sau đại học']), value: 'Master' },
  { pattern: wordPattern(['đại học', 'cử nhân', 'bachelor', 'undergraduate']), value: 'Bachelor' },
];

const CHAT_TOPIC_PATTERN = /học bổng|scholarship|gợi ý|tìm|recommend|apply|nộp đơn|ứng tuyển|du học/i;
const GPA_NUMBER = '([0-3](?:\\.\\d{1,2})?|4(?:\\.0{1,2})?)(?![.\\d])'; // số ngoài thang 4 (4.5, 8.0) thì bỏ qua
const CHAT_GPA_PATTERNS = [new RegExp(`(?:gpa|điểm)\\s*:?\\s*${GPA_NUMBER}`, 'i'), new RegExp(`${GPA_NUMBER}\\s*(?:gpa|\\/4)`, 'i')];
const CHAT_IELTS_PATTERNS = [/ielts\s*[:\s]?\s*(\d(?:\.\d)?)/i, /(\d(?:\.\d)?)\s*ielts/i, /band\s*(\d(?:\.\d)?)/i];

const CHAT_ROLES = ['user', 'assistant'];
const CHAT_VALIDATION = {
  emptyContent: 'Nội dung tin nhắn không được rỗng',
  messagesRequired: 'messages là bắt buộc',
  messageTooLong: `Tin nhắn không được vượt quá ${CHAT_USER_MESSAGE_MAX} ký tự`,
};
const CHAT_RATE_LIMIT = { max: 20, windowSeconds: 60, message: 'Quá nhiều tin nhắn, vui lòng thử lại sau 1 phút' };

const CHAT_REPLY = {
  found: 'Đây là học bổng phù hợp tìm thấy trong hệ thống:',
  foundFooter: 'Bạn mở trang chi tiết học bổng hoặc website chính thức để xem đầy đủ điều kiện nhé!',
  notFound: 'Mình chưa tìm thấy học bổng còn hạn khớp với tiêu chí này. Bạn thử bỏ bớt điều kiện (quốc gia, bậc học, GPA, IELTS) nhé.',
  guide:
    'Trợ lý AI đang tạm dừng để nâng cấp. Mình vẫn tìm được học bổng trong hệ thống: hãy hỏi kiểu "học bổng Nhật thạc sĩ GPA 3.2" hoặc "học bổng Úc IELTS 6.5".',
};

export {
  CHAT_MAX_MESSAGES,
  CHAT_HISTORY_KEPT,
  CHAT_USER_MESSAGE_MAX,
  CHAT_ANY_MESSAGE_MAX,
  CHAT_RESULT_LIMIT,
  CHAT_HISTORY_LIMIT,
  CHAT_FILTER_WINDOW,
  CHAT_TOPIC_WINDOW,
  CHAT_COUNTRY_PATTERNS,
  CHAT_DEGREE_PATTERNS,
  CHAT_TOPIC_PATTERN,
  CHAT_GPA_PATTERNS,
  CHAT_IELTS_PATTERNS,
  CHAT_ROLES,
  CHAT_VALIDATION,
  CHAT_RATE_LIMIT,
  CHAT_REPLY,
};
