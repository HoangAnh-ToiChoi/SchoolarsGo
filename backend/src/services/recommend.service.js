const { supabase } = require('./supabase');
const { extractIeltsScore } = require('../utils/helpers');

// Tính match score dựa trên profile user và scholarship
const calculateMatchScore = (profile, scholarship) => {
  let score = 0;
  const reasons = [];

  // GPA match (30 điểm)
  if (profile.gpa && scholarship.min_gpa) {
    if (profile.gpa >= scholarship.min_gpa) {
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
    const fieldOfStudy = scholarship.field_of_study.toLowerCase();
    if (fieldOfStudy.includes(targetMajor) || targetMajor.includes(fieldOfStudy)) {
      score += 15;
      reasons.push(`Ngành: ${scholarship.field_of_study} liên quan`);
    }
  }

  // English level match (10 điểm)
  if (profile.english_level && scholarship.min_ielts) {
    const userIelts = extractIeltsScore(profile.english_level);
    if (userIelts && userIelts >= scholarship.min_ielts) {
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
    score: Math.min(1, score / 100), // Normalize về 0-1
    reasons,
  };
};

const recommend = async (userId, topN = 10) => {
  // Lấy user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (profileError || !profile) {
    const err = new Error('Vui lòng cập nhật profile trước khi sử dụng gợi ý');
    err.statusCode = 400;
    err.isOperational = true;
    throw err;
  }

  // Lấy danh sách scholarships đang active
  const { data: scholarships, error: schError } = await supabase
    .from('scholarships')
    .select('*')
    .eq('is_active', true)
    .gte('deadline', new Date().toISOString())
    .order('deadline', { ascending: true })
    .limit(200);

  if (schError) throw schError;

  // Tính match score cho từng scholarship
  const scored = scholarships.map((scholarship) => {
    const { score, reasons } = calculateMatchScore(profile, scholarship);
    return { scholarship, match_score: score, reasons };
  });

  // Sort theo score giảm dần và lấy top N
  const top = scored
    .sort((a, b) => b.match_score - a.match_score)
    .slice(0, topN);

  // Lọc bỏ những scholarship có score = 0
  return top.filter((item) => item.match_score > 0);
};

module.exports = { recommend };
