const AppError = require('../utils/AppError');
const { extractIeltsScore } = require('../utils/helpers');
const { enrichRecommendations } = require('./gemini.service');

class RecommendService {
  #repo;

  constructor(recommendRepo) {
    this.#repo = recommendRepo;
  }

  #calculateMatchScore(profile, scholarship) {
    let score = 0;
    const reasons = [];

    if (profile.gpa && scholarship.min_gpa) {
      if (parseFloat(profile.gpa) >= parseFloat(scholarship.min_gpa)) {
        score += 30;
        reasons.push(`GPA ${profile.gpa} đạt yêu cầu (tối thiểu ${scholarship.min_gpa})`);
      }
    }

    if (profile.target_degree && scholarship.degree && scholarship.degree !== 'Any') {
      if (profile.target_degree.toLowerCase() === scholarship.degree.toLowerCase()) {
        score += 20;
        reasons.push(`Bậc học: ${scholarship.degree} phù hợp`);
      }
    }

    if (profile.target_country && scholarship.country) {
      if (profile.target_country.toLowerCase() === scholarship.country.toLowerCase()) {
        score += 20;
        reasons.push(`Quốc gia: ${scholarship.country} trùng khớp`);
      }
    }

    if (profile.target_major && scholarship.field_of_study) {
      const targetMajor = profile.target_major.toLowerCase();
      const fieldOfStudy = (scholarship.field_of_study || '').toLowerCase();
      if (fieldOfStudy.includes(targetMajor) || targetMajor.includes(fieldOfStudy)) {
        score += 15;
        reasons.push(`Ngành: ${scholarship.field_of_study} liên quan`);
      }
    }

    if (profile.english_level && scholarship.min_ielts) {
      const userIelts = extractIeltsScore(profile.english_level);
      if (userIelts && userIelts >= parseFloat(scholarship.min_ielts)) {
        score += 10;
        reasons.push(`IELTS ${userIelts} đạt yêu cầu (tối thiểu ${scholarship.min_ielts})`);
      }
    }

    if (scholarship.deadline) {
      const daysUntilDeadline = Math.ceil(
        (new Date(scholarship.deadline) - new Date()) / (1000 * 60 * 60 * 24)
      );
      if (daysUntilDeadline > 0 && daysUntilDeadline <= 90) {
        score += 5;
        reasons.push(`Còn ${daysUntilDeadline} ngày đến hạn nộp`);
      }
    }

    return { score: Math.min(1, score / 100), reasons };
  }

  recommend = async (userId, topN = 10) => {
    const profile = await this.#repo.findProfileByUserId(userId);
    if (!profile) throw new AppError('Vui lòng cập nhật profile trước khi sử dụng gợi ý', 400, 'PROFILE_REQUIRED');

    const scholarships = await this.#repo.findActiveScholarships(200);

    const top = scholarships
      .map(scholarship => {
        const { score, reasons } = this.#calculateMatchScore(profile, scholarship);
        return { scholarship, match_score: score, reasons };
      })
      .sort((a, b) => b.match_score - a.match_score)
      .slice(0, topN)
      .filter(item => item.match_score > 0);

    return enrichRecommendations(profile, top);
  };
}

module.exports = RecommendService;
