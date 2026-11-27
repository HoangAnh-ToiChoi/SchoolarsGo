import chatModel from '~/models/chat.model.js';
import { extractIeltsScore } from '~/utils/helpers.js';
import {
  CHAT_COUNTRY_PATTERNS,
  CHAT_DEGREE_PATTERNS,
  CHAT_FILTER_WINDOW,
  CHAT_GPA_PATTERNS,
  CHAT_HISTORY_LIMIT,
  CHAT_IELTS_PATTERNS,
  CHAT_REPLY,
  CHAT_RESULT_LIMIT,
  CHAT_TOPIC_PATTERN,
  CHAT_TOPIC_WINDOW,
} from '~/constants/chat.js';

// Chat tạm không gọi LLM (model cũ đã ngừng, sẽ thay bằng dịch vụ RAG riêng):
// rút bộ lọc bằng regex → tìm học bổng trong DB → trả danh sách dạng chữ.
class ChatService {
  /** Trả lời rồi lưu lịch sử ngầm: lưu lỗi chỉ ghi log, không làm hỏng hay chậm câu trả lời. */
  async reply(messages, userId) {
    const answer = await this.chat(messages, { userId });
    const lastUserMessage = messages.findLast((m) => m.role === 'user');
    if (lastUserMessage) {
      this.saveMessages(userId, lastUserMessage.content, answer).catch((err) => {
        console.warn('[Chat] Không lưu được lịch sử:', err.message);
      });
    }
    return answer;
  }

  async chat(messages, { userId } = {}) {
    if (!this.#isScholarshipQuery(messages)) return CHAT_REPLY.guide;

    const profile = userId ? await chatModel.findProfile(userId) : null;
    const filters = this.#mergeProfileFilters(this.#extractFilters(messages), profile);
    const scholarships = await chatModel.findScholarships(filters, CHAT_RESULT_LIMIT);
    return this.#answer(scholarships);
  }

  async saveMessages(userId, userContent, assistantContent) {
    if (!userId) return;
    // Một lần insert thì hai dòng cùng created_at → lịch sử có thể hiện câu trả lời trước câu hỏi
    const askedAt = new Date();
    const answeredAt = new Date(askedAt.getTime() + 1);
    await chatModel.insertMessages([
      { user_id: userId, role: 'user', content: userContent, created_at: askedAt.toISOString() },
      { user_id: userId, role: 'assistant', content: assistantContent, created_at: answeredAt.toISOString() },
    ]);
  }

  async getHistory(userId) {
    const rows = await chatModel.findHistory(userId, CHAT_HISTORY_LIMIT);
    const oldestFirst = rows.reverse();
    return oldestFirst.map(({ role, content }) => ({ role, content }));
  }

  // Điểm nối dịch vụ RAG sau này: thay phần dựng câu trả lời, giữ nguyên bộ lọc + truy vấn DB làm dữ liệu neo
  #answer(scholarships) {
    if (scholarships.length === 0) return CHAT_REPLY.notFound;
    const list = scholarships.map((s) => this.#formatScholarship(s)).join('\n\n');
    return `${CHAT_REPLY.found}\n\n${list}\n\n${CHAT_REPLY.foundFooter}`;
  }

  // Chỉ đọc tin người dùng: tin trợ lý (câu hướng dẫn, danh sách cũ) chứa tên nước, GPA… sẽ thành bộ lọc giả
  #recentUserTexts(messages, windowSize) {
    const recent = messages.slice(-windowSize);
    const userTexts = recent.filter((m) => m.role === 'user').map((m) => m.content);
    return userTexts.reverse(); // mới nhất trước: người dùng đổi ý thì tin sau thắng
  }

  #isScholarshipQuery(messages) {
    const texts = this.#recentUserTexts(messages, CHAT_TOPIC_WINDOW);
    return texts.some((text) => CHAT_TOPIC_PATTERN.test(text));
  }

  #extractFilters(messages) {
    const texts = this.#recentUserTexts(messages, CHAT_FILTER_WINDOW);
    const filters = {};

    const country = this.#latestMatch(texts, (text) => this.#toCountry(text));
    if (country) filters.country = country;

    const degree = this.#latestMatch(texts, (text) => this.#matchValue(text, CHAT_DEGREE_PATTERNS));
    if (degree) filters.degree = degree;

    const gpa = this.#latestMatch(texts, (text) => this.#firstNumber(text, CHAT_GPA_PATTERNS));
    if (gpa > 0 && gpa <= 4) filters.min_gpa = gpa;

    const ielts = this.#latestMatch(texts, (text) => this.#firstNumber(text, CHAT_IELTS_PATTERNS));
    if (ielts > 0 && ielts <= 9) filters.min_ielts = ielts;

    return filters;
  }

  #latestMatch(texts, pick) {
    for (const text of texts) {
      const value = pick(text);
      if (value) return value;
    }
    return null;
  }

  #matchValue(text, patterns) {
    const hit = patterns.find(({ pattern }) => pattern.test(text));
    return hit ? hit.value : null;
  }

  #toCountry(text) {
    return this.#matchValue(text, CHAT_COUNTRY_PATTERNS);
  }

  #firstNumber(text, patterns) {
    const match = patterns.map((p) => text.match(p)).find(Boolean);
    return match ? parseFloat(match[1]) : null;
  }

  // Câu hỏi không nói rõ thì lấy từ hồ sơ
  #mergeProfileFilters(filters, profile) {
    if (!profile) return filters;
    const merged = { ...filters };
    if (!merged.country && profile.target_country) merged.country = this.#profileCountry(profile.target_country);
    const hasTargetDegree = profile.target_degree && profile.target_degree !== 'Any';
    if (!merged.degree && hasTargetDegree) merged.degree = profile.target_degree;
    if (!merged.min_gpa && profile.gpa) merged.min_gpa = parseFloat(profile.gpa);
    if (!merged.min_ielts && profile.english_level) {
      const ielts = extractIeltsScore(profile.english_level);
      if (ielts) merged.min_ielts = ielts;
    }
    return merged;
  }

  // Hồ sơ là chữ tự gõ; thêm "ở" để tên một âm tiết ("Mỹ", "Anh") khớp như trong câu. Không nhận ra thì giữ nguyên
  #profileCountry(targetCountry) {
    return this.#toCountry(`ở ${targetCountry}`) || targetCountry;
  }

  #formatScholarship(s) {
    const deadline = s.deadline ? new Date(s.deadline).toLocaleDateString('vi-VN') : 'Chưa rõ';
    const lines = [`• **${s.title}** (${s.provider}) — ${s.country} — Hạn nộp: ${deadline}`];
    if (s.min_gpa) lines.push(`  GPA tối thiểu: ${s.min_gpa}`);
    if (s.min_ielts) lines.push(`  IELTS tối thiểu: ${s.min_ielts}`);
    if (s.amount) lines.push(`  Giá trị: ${Number(s.amount).toLocaleString('vi-VN')} ${s.currency || ''}`.trimEnd());
    if (s.application_url) lines.push(`  Link: ${s.application_url}`);
    return lines.join('\n');
  }
}

export default new ChatService();
