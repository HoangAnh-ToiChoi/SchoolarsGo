// Hằng số của gợi ý học bổng (recommend.service, recommendMatch.service, recommend.model)

// Cột trả về cho mỗi học bổng được gợi ý (trang /recommend + link chi tiết theo slug)
const RECOMMEND_SCHOLARSHIP_COLUMNS =
  'id, slug, title, provider, country, degree, field_of_study, amount, currency, coverage, deadline, ' +
  'language, min_gpa, min_ielts, intake, summary, application_url, image_url, is_featured';

// Hồ sơ: trường cốt lõi quyết định độ tin cậy của gợi ý, trường phụ chỉ làm giàu thêm
const RECOMMEND_CORE_PROFILE_FIELDS = Object.freeze(['gpa', 'english_level', 'target_country', 'target_major', 'target_degree']);
const RECOMMEND_SUPPORTING_PROFILE_FIELDS = Object.freeze(['bio', 'target_intake', 'document_count']);

// Hồ sơ đủ dưới 30% thì không gợi ý; điểm khớp dưới 0.12 coi như không liên quan
const RECOMMEND_MIN_COMPLETENESS = 0.3;
const RECOMMEND_MIN_MATCH_SCORE = 0.12;

// Nhóm từ cùng nghĩa: ngành của hồ sơ chứa một từ trong nhóm thì coi như có cả nhóm
const RECOMMEND_SEMANTIC_TERMS = Object.freeze([
  ['computer science', 'software', 'programming', 'ai', 'artificial intelligence', 'data science', 'machine learning', 'it', 'technology'],
  ['business', 'management', 'mba', 'marketing', 'finance', 'entrepreneurship', 'economics'],
  ['engineering', 'mechanical', 'electrical', 'civil', 'robotics', 'manufacturing'],
  ['medicine', 'health', 'public health', 'nursing', 'biomedical', 'pharmacy'],
  ['education', 'teaching', 'pedagogy', 'tesol', 'linguistics'],
  ['law', 'policy', 'international relations', 'governance', 'human rights'],
  ['environment', 'sustainability', 'climate', 'energy', 'agriculture'],
  ['arts', 'design', 'media', 'communication', 'journalism', 'creative'],
]);

// Học bổng nhận mọi bậc học
const RECOMMEND_ANY_DEGREE = 'Any';

export {
  RECOMMEND_SCHOLARSHIP_COLUMNS,
  RECOMMEND_CORE_PROFILE_FIELDS,
  RECOMMEND_SUPPORTING_PROFILE_FIELDS,
  RECOMMEND_MIN_COMPLETENESS,
  RECOMMEND_MIN_MATCH_SCORE,
  RECOMMEND_SEMANTIC_TERMS,
  RECOMMEND_ANY_DEGREE,
};
