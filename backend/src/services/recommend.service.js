const getSupabase = require('../utils/supabase');
const { extractIeltsScore } = require('../utils/helpers');
const { enrichRecommendations } = require('./gemini.service');

const calculateMatchScore = (profile, scholarship) => {
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
    const daysLeft = Math.ceil((new Date(scholarship.deadline) - new Date()) / (1000 * 60 * 60 * 24));
    if (daysLeft > 0 && daysLeft <= 90) {
      score += 5;
      reasons.push(`Còn ${daysLeft} ngày đến hạn nộp`);
    }
  }

  return { score: Math.min(1, score / 100), reasons };
};

const recommend = async (userId, topN = 10) => {
  const sb = getSupabase();

  const { data: profile } = await sb.from('profiles').select('*').eq('user_id', userId).maybeSingle();

  if (!profile) {
    const err = new Error('Vui lòng cập nhật profile trước khi sử dụng gợi ý');
    err.statusCode = 400;
    err.isOperational = true;
    throw err;
  }

  const { data: scholarships } = await sb.from('scholarships')
    .select('*')
    .eq('is_active', true)
    .gte('deadline', new Date().toISOString())
    .order('deadline', { ascending: true })
    .limit(200);

  const scored = (scholarships || []).map((scholarship) => {
    const { score, reasons } = calculateMatchScore(profile, scholarship);
    return { scholarship, match_score: score, reasons };
  });

  const top = scored
    .sort((a, b) => b.match_score - a.match_score)
    .slice(0, topN)
    .filter((item) => item.match_score > 0);

  return enrichRecommendations(profile, top);
};

module.exports = { recommend };
