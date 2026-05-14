/**
 * RecommendService — VÙNG 2 (Service → Repository)
 *
 * Quy tắc:
 * - Class, nhận recommendRepo qua constructor
 * - KHÔNG import db hay viết SQL ở đây
 * - Private methods dùng tiền tố #
 * - Dùng #throwError cho lỗi nghiệp vụ
 */
const { extractIeltsScore } = require('../utils/helpers');
const { enrichRecommendations } = require('./gemini.service');

class RecommendService {
  /**
   * @param {object} recommendRepo - RecommendRepository instance
   */
  constructor(recommendRepo) {
    this.repo = recommendRepo;
  }

  /**
   * Tính điểm phù hợp giữa profile và scholarship
   * @private
   * @param {object} profile
   * @param {object} scholarship
   * @returns {{ score: number, reasons: string[] }}
   */
  #calculateMatchScore(profile, scholarship) {
    let score = 0;
    const reasons = [];

    // GPA match (30 điểm)
    if (profile.gpa && scholarship.min_gpa) {
      if (parseFloat(profile.gpa) >= parseFloat(scholarship.min_gpa)) {
        score += 30;
        reasons.push(`GPA ${profile.gpa} đạt yêu cầu (tối thiểu ${scholarship.min_gpa})`);
      }
    }

    // Degree match (20 điểm)
    if (profile.target_degree && scholarship.degree && scholarship.degree !== 'Any') {
      if (profile.target_degree.toLowerCase() === scholarship.degree.toLowerCase()) {
        score += 20;
        reasons.push(`Bậc học: ${scholarship.degree} phù hợp`);
      }
    }

    // Country match (20 điểm)
    if (profile.target_country && scholarship.country) {
      if (profile.target_country.toLowerCase() === scholarship.country.toLowerCase()) {
        score += 20;
        reasons.push(`Quốc gia: ${scholarship.country} trùng khớp`);
      }
    }

    // Major match (15 điểm)
    if (profile.target_major && scholarship.field_of_study) {
      const targetMajor = profile.target_major.toLowerCase();
      const fieldOfStudy = (scholarship.field_of_study || '').toLowerCase();
      if (fieldOfStudy.includes(targetMajor) || targetMajor.includes(fieldOfStudy)) {
        score += 15;
        reasons.push(`Ngành: ${scholarship.field_of_study} liên quan`);
      }
    }

    // English level match (10 điểm)
    if (profile.english_level && scholarship.min_ielts) {
      const userIelts = extractIeltsScore(profile.english_level);
      if (userIelts && userIelts >= parseFloat(scholarship.min_ielts)) {
        score += 10;
        reasons.push(`IELTS ${userIelts} đạt yêu cầu (tối thiểu ${scholarship.min_ielts})`);
      }
    }

    // Deadline proximity (5 điểm)
    if (scholarship.deadline) {
      const deadline = new Date(scholarship.deadline);
      const now = new Date();
      const daysUntilDeadline = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
      if (daysUntilDeadline > 0 && daysUntilDeadline <= 90) {
        score += 5;
        reasons.push(`Còn ${daysUntilDeadline} ngày đến hạn nộp`);
      }
    }

    return {
      score: Math.min(1, score / 100),
      reasons,
    };
  }

  /**
   * Ném lỗi nghiệp vụ
   * @private
   * @param {string} message
   * @param {number} statusCode
   */
  #throwError(message, statusCode = 400) {
    const err = new Error(message);
    err.statusCode = statusCode;
    err.isOperational = true;
    throw err;
  }

  /**
   * Lấy gợi ý học bổng cho user
   * @param {string|number} userId
   * @param {number} topN
   * @returns {Promise<object[]>}
   */
  recommend = async (userId, topN = 10) => {
    const profile = await this.repo.findProfileByUserId(userId);

    if (!profile) {
      this.#throwError('Vui lòng cập nhật profile trước khi sử dụng gợi ý', 400);
    }

    const scholarships = await this.repo.findActiveScholarships(200);

    const scored = scholarships.map((scholarship) => {
      const { score, reasons } = this.#calculateMatchScore(profile, scholarship);
      return { scholarship, match_score: score, reasons };
    });

    const top = scored
      .sort((a, b) => b.match_score - a.match_score)
      .slice(0, topN)
      .filter((item) => item.match_score > 0);

    return enrichRecommendations(profile, top);
  };
}

module.exports = RecommendService;
