const { query, queryOne } = require('../utils/db');
const { extractIeltsScore } = require('../utils/helpers');

const calculateMatchScore = (profile, scholarship) => {
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
};

const recommend = async (userId, topN = 10) => {
  const profile = await queryOne(
    'SELECT * FROM profiles WHERE user_id = $1',
    [userId]
  );

  if (!profile) {
    const err = new Error('Vui lòng cập nhật profile trước khi sử dụng gợi ý');
    err.statusCode = 400;
    err.isOperational = true;
    throw err;
  }

  const scholarshipsResult = await query(
    `SELECT * FROM scholarships
     WHERE is_active = true AND deadline >= now()
     ORDER BY deadline ASC
     LIMIT 200`
  );

  const scored = scholarshipsResult.rows.map((scholarship) => {
    const { score, reasons } = calculateMatchScore(profile, scholarship);
    return { scholarship, match_score: score, reasons };
  });

  const top = scored
    .sort((a, b) => b.match_score - a.match_score)
    .slice(0, topN);

  return top.filter((item) => item.match_score > 0);
};

module.exports = { recommend };
