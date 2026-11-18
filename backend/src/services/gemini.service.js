import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI = null;

const getClient = () => {
  if (!genAI && process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
};

/** Nhờ Gemini viết lý do gợi ý (ai_reason) cho từng học bổng. Lỗi hoặc không có khoá thì trả danh sách gốc. */
async function enrichRecommendations(profile, recommendations) {
  const client = getClient();
  if (!client || recommendations.length === 0) return recommendations;

  try {
    const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const profileSummary = [
      profile.gpa && `GPA: ${profile.gpa}/4.0`,
      profile.english_level && `Tiếng Anh: ${profile.english_level}`,
      profile.target_country && `Quốc gia mục tiêu: ${profile.target_country}`,
      profile.target_degree && `Bậc học: ${profile.target_degree}`,
      profile.target_major && `Ngành: ${profile.target_major}`,
    ]
      .filter(Boolean)
      .join(', ');

    const scholarshipList = recommendations
      .map((r, i) => {
        const s = r.scholarship;
        return `${i + 1}. ${s.title} (${s.provider}, ${s.country}, ${s.degree}, GPA tối thiểu: ${s.min_gpa || 'không yêu cầu'}, IELTS tối thiểu: ${s.min_ielts || 'không yêu cầu'}, điểm phù hợp: ${Math.round(r.match_score * 100)}%, semantic: ${Math.round((r.semantic_score || 0) * 100)}%, rule: ${Math.round((r.rule_score || 0) * 100)}%, readiness: ${Math.round(((r.profile_readiness?.overall || 0) * 100))}%, lý do hệ thống: ${(r.reasons || []).join('; ')})`;
      })
      .join('\n');

    const prompt = `Bạn là chuyên gia tư vấn học bổng du học cho sinh viên Việt Nam.

Hồ sơ sinh viên: ${profileSummary}.

Danh sách học bổng được gợi ý (xếp hạng theo mức độ phù hợp):
${scholarshipList}

Nhiệm vụ: Viết lý do gợi ý cho từng học bổng, giải thích tự nhiên và thuyết phục tại sao học bổng này phù hợp với hồ sơ của sinh viên. Tập trung vào điểm mạnh của sinh viên so với yêu cầu, cơ hội học tập, và lợi ích cụ thể.

Yêu cầu:
- Mỗi lý do 1-2 câu, khoảng 80-150 ký tự, tiếng Việt tự nhiên
- Không lặp lại thông tin kỹ thuật khô khan (ví dụ tránh "GPA 3.5 đạt yêu cầu 3.0")
- Nhấn mạnh cơ hội và sự phù hợp thực sự
- Trả về JSON array chính xác, không thêm text nào khác:
[{"index": 1, "ai_reason": "..."}, {"index": 2, "ai_reason": "..."}, ...]`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Gemini có thể kèm chữ thừa quanh JSON: lấy từ "[" đầu đến "]" cuối
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return recommendations;

    const aiReasons = JSON.parse(jsonMatch[0]);
    const reasonMap = {};
    aiReasons.forEach(r => {
      reasonMap[r.index] = r.ai_reason;
    });

    return recommendations.map((rec, i) => ({
      ...rec,
      ai_reason: reasonMap[i + 1] || null,
    }));
  } catch (err) {
    // Lỗi AI không được làm hỏng gợi ý: trả danh sách gốc, không có ai_reason
    console.error('[Gemini] enrichRecommendations error:', err.message);
    return recommendations;
  }
}

export { enrichRecommendations };