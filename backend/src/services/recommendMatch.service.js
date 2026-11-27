import { extractIeltsScore } from '~/utils/helpers.js';
import { vnToday } from '~/utils/deadline.js';
import { RECOMMEND_SEMANTIC_TERMS, RECOMMEND_ANY_DEGREE } from '~/constants/recommend.js';

const DAY_MS = 864e5;

// Trọng số điểm luật: học lực và bậc học nặng nhất, thời hạn nhẹ nhất
const RULE_WEIGHTS = Object.freeze({ academic: 0.22, degree: 0.18, country: 0.16, field: 0.16, language: 0.14, timing: 0.05, profile: 0.09 });
const SEMANTIC_WEIGHTS = Object.freeze({ field: 0.35, goals: 0.3, intake: 0.1, provider: 0.15, document: 0.1 });

/**
 * Chấm độ khớp giữa một hồ sơ và một học bổng (hàm thuần, không gọi DB): điểm theo luật, điểm ngữ nghĩa
 * và điều kiện cứng (blocker). recommend.service dùng để lọc và xếp hạng.
 */
class RecommendMatchService {
  #normalizeText(value) {
    const unaccented = String(value || '').normalize('NFD').replace(/[̀-ͯ]/g, '');
    const lettersOnly = unaccented.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
    return lettersOnly.replace(/\s+/g, ' ').trim();
  }

  #tokenize(value) {
    const normalized = this.#normalizeText(value);
    const expanded = new Set(normalized.split(' ').filter(token => token.length > 2));
    for (const group of RECOMMEND_SEMANTIC_TERMS) {
      if (!group.some(term => normalized.includes(this.#normalizeText(term)))) continue;
      const words = group.flatMap(term => this.#normalizeText(term).split(' '));
      words.filter(word => word.length > 2).forEach(word => expanded.add(word));
    }
    return expanded;
  }

  similarity(left, right) {
    const leftTokens = this.#tokenize(left);
    const rightTokens = this.#tokenize(right);
    if (!leftTokens.size || !rightTokens.size) return 0;
    const overlap = [...leftTokens].filter(token => rightTokens.has(token)).length;
    return Math.min(1, overlap / Math.max(3, Math.min(leftTokens.size, rightTokens.size)));
  }

  #academic(fit, profile, scholarship) {
    if (!scholarship.min_gpa) {
      fit.breakdown.academic = 0.7;
      return;
    }
    if (!profile.gpa) return;
    if (parseFloat(profile.gpa) >= parseFloat(scholarship.min_gpa)) {
      fit.breakdown.academic = 1;
      fit.reasons.push(`GPA ${profile.gpa} đạt yêu cầu tối thiểu ${scholarship.min_gpa}`);
    } else fit.blockers.push(`GPA hiện tại thấp hơn yêu cầu tối thiểu ${scholarship.min_gpa}`);
  }

  // Bậc học là điều kiện cứng (R20): học bổng chỉ cho PhD không gợi ý cho người muốn học Bachelor
  #degree(fit, profile, scholarship) {
    if (!profile.target_degree || !scholarship.degree) return;
    const anyOnEitherSide = [scholarship.degree, profile.target_degree].includes(RECOMMEND_ANY_DEGREE);
    const same = this.#normalizeText(profile.target_degree) === this.#normalizeText(scholarship.degree);
    if (scholarship.degree === RECOMMEND_ANY_DEGREE) {
      fit.breakdown.degree = 0.8;
      fit.reasons.push('Bậc học linh hoạt với mục tiêu của bạn');
    } else if (same) {
      fit.breakdown.degree = 1;
      fit.reasons.push(`Bậc học ${scholarship.degree} phù hợp`);
    } else if (!anyOnEitherSide) fit.blockers.push(`Học bổng dành cho bậc ${scholarship.degree}`);
  }

  // Quốc tịch là điều kiện cứng (R20). Hồ sơ chưa khai quốc tịch thì không chặn (không đoán)
  #nationality(fit, profile, scholarship) {
    const allowed = scholarship.eligible_nationalities;
    if (!profile.nationality || !Array.isArray(allowed) || allowed.length === 0) return;
    if (!allowed.includes(profile.nationality)) fit.blockers.push(`Học bổng chỉ nhận quốc tịch ${allowed.join(', ')}`);
  }

  // Tuổi là điều kiện cứng (R20): tính theo năm sinh và năm hiện tại giờ VN
  #age(fit, profile, scholarship) {
    if (!profile.birth_year || !scholarship.max_age) return;
    const age = Number(vnToday().slice(0, 4)) - Number(profile.birth_year);
    if (age > scholarship.max_age) fit.blockers.push(`Học bổng giới hạn tuổi tối đa ${scholarship.max_age}`);
  }

  #country(fit, profile, scholarship) {
    if (!profile.target_country || !scholarship.country) return;
    if (this.#normalizeText(scholarship.country).includes(this.#normalizeText(profile.target_country))) {
      fit.breakdown.country = 1;
      fit.reasons.push(`Quốc gia ${scholarship.country} trùng với mục tiêu`);
    }
  }

  #field(fit, profile, scholarship) {
    if (!profile.target_major || !scholarship.field_of_study) return;
    fit.breakdown.field = this.similarity(profile.target_major, scholarship.field_of_study);
    if (fit.breakdown.field >= 0.5) fit.reasons.push(`Ngành ${scholarship.field_of_study} liên quan đến mục tiêu học tập`);
  }

  #language(fit, profile, scholarship) {
    if (!scholarship.min_ielts) {
      fit.breakdown.language = 0.7;
      return;
    }
    const userIelts = extractIeltsScore(profile.english_level);
    if (!userIelts) return;
    if (userIelts >= parseFloat(scholarship.min_ielts)) {
      fit.breakdown.language = 1;
      fit.reasons.push(`IELTS ${userIelts} đạt yêu cầu tối thiểu ${scholarship.min_ielts}`);
    } else fit.blockers.push(`IELTS hiện tại thấp hơn yêu cầu tối thiểu ${scholarship.min_ielts}`);
  }

  #timing(fit, scholarship) {
    if (!scholarship.deadline) return;
    const daysLeft = Math.ceil((new Date(scholarship.deadline) - new Date()) / DAY_MS);
    if (daysLeft <= 0 || daysLeft > 120) return;
    fit.breakdown.timing = daysLeft <= 30 ? 0.6 : 1;
    fit.reasons.push(`Còn ${daysLeft} ngày đến hạn nộp`);
  }

  #profileRichness(fit, profile) {
    const bio = profile.bio ? 0.4 : 0;
    const intake = profile.target_intake ? 0.25 : 0;
    const documents = profile.document_count > 0 ? 0.35 : 0;
    fit.breakdown.profile = Math.min(1, bio + intake + documents);
  }

  #weighted(values, weights) {
    const total = Object.entries(weights).reduce((sum, [key, weight]) => sum + values[key] * weight, 0);
    return Math.min(1, total);
  }

  /** Điểm theo luật + lý do + điều kiện cứng chưa đạt (blockers khác rỗng thì không gợi ý). */
  ruleFit(profile, scholarship) {
    const breakdown = { academic: 0, degree: 0, country: 0, field: 0, language: 0, timing: 0, profile: 0 };
    const fit = { reasons: [], blockers: [], breakdown };
    this.#academic(fit, profile, scholarship);
    this.#degree(fit, profile, scholarship);
    this.#nationality(fit, profile, scholarship);
    this.#age(fit, profile, scholarship);
    this.#country(fit, profile, scholarship);
    this.#field(fit, profile, scholarship);
    this.#language(fit, profile, scholarship);
    this.#timing(fit, scholarship);
    this.#profileRichness(fit, profile);
    return { ...fit, score: this.#weighted(breakdown, RULE_WEIGHTS) };
  }

  #semanticReason(signals, score) {
    if (signals.field >= 0.45 && signals.goals >= 0.35) return 'Học bổng này khớp khá sát với định hướng học tập và mục tiêu hồ sơ của bạn';
    if (score >= 0.45) return 'Có nhiều tín hiệu ngữ nghĩa tích cực giữa hồ sơ hiện tại và nội dung học bổng';
    if (score > 0) return 'Có một số tín hiệu liên quan giữa hồ sơ và học bổng';
    return null;
  }

  /** Điểm ngữ nghĩa: so chữ giữa mục tiêu hồ sơ và nội dung học bổng. */
  semanticFit(profile, scholarship) {
    const details = [scholarship.summary, scholarship.benefits, scholarship.requirements, scholarship.eligibility].filter(Boolean).join(' ');
    const eligibilityText = [scholarship.requirements, scholarship.eligibility].filter(Boolean).join(' ');
    const signals = {
      field: this.similarity(profile.target_major, scholarship.field_of_study),
      goals: this.similarity(profile.intent_summary, details),
      intake: this.similarity(profile.target_intake, scholarship.intake),
      provider: this.similarity(profile.bio, [scholarship.title, scholarship.provider].join(' ')),
      document: profile.document_count > 0 ? this.similarity(profile.document_types.join(' '), eligibilityText) : 0,
    };
    const score = this.#weighted(signals, SEMANTIC_WEIGHTS);
    return { score, reason: this.#semanticReason(signals, score), signals };
  }
}

export default new RecommendMatchService();
