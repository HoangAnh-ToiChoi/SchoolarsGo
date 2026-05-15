const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;

const getClient = () => {
  if (!genAI && process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
};

/**
 * Generate AI reasons for recommended scholarships.
 * @param {object} profile - user profile { gpa, english_level, target_country, target_degree, target_major }
 * @param {Array} recommendations - array of { scholarship, match_score, reasons }
 * @returns {Array} same array but each item has ai_reason string added
 */
const enrichRecommendations = async (profile, recommendations) => {
  const client = getClient();
  if (!client || recommendations.length === 0) return recommendations;

  try {
    const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });

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
        return `${i + 1}. ${s.title} (${s.provider}, ${s.country}, ${s.degree}, GPA tối thiểu: ${s.min_gpa || 'không yêu cầu'}, IELTS tối thiểu: ${s.min_ielts || 'không yêu cầu'}, điểm phù hợp: ${Math.round(r.match_score * 100)}%)`;
      })
      .join('\n');

    const prompt = `Bạn là chuyên gia tư vấn học bổng. Sinh viên có hồ sơ: ${profileSummary}.

Danh sách học bổng phù hợp (xếp hạng theo điểm số):
${scholarshipList}

Hãy viết cho mỗi học bổng một câu lý do ngắn gọn (1-2 câu, tối đa 100 ký tự mỗi câu) tại sao học bổng này phù hợp với sinh viên này. Trả lời theo định dạng JSON array chính xác, không thêm bất kỳ text nào khác:
[{"index": 1, "ai_reason": "lý do..."}, {"index": 2, "ai_reason": "lý do..."}, ...]`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Parse JSON từ response
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
    // Fallback gracefully — trả về recommendations gốc không có ai_reason
    console.error('[Gemini] enrichRecommendations error:', err.message);
    return recommendations;
  }
};

module.exports = { enrichRecommendations };
