const AppError = require('../utils/AppError');
const { extractIeltsScore } = require('../utils/helpers');

const CORE_PROFILE_FIELDS = ['gpa', 'english_level', 'target_country', 'target_major', 'target_degree'];
const SUPPORTING_PROFILE_FIELDS = ['bio', 'target_intake', 'document_count'];

const SEMANTIC_TERMS = [
  ['computer science', 'software', 'programming', 'ai', 'artificial intelligence', 'data science', 'machine learning', 'it', 'technology'],
  ['business', 'management', 'mba', 'marketing', 'finance', 'entrepreneurship', 'economics'],
  ['engineering', 'mechanical', 'electrical', 'civil', 'robotics', 'manufacturing'],
  ['medicine', 'health', 'public health', 'nursing', 'biomedical', 'pharmacy'],
  ['education', 'teaching', 'pedagogy', 'tesol', 'linguistics'],
  ['law', 'policy', 'international relations', 'governance', 'human rights'],
  ['environment', 'sustainability', 'climate', 'energy', 'agriculture'],
  ['arts', 'design', 'media', 'communication', 'journalism', 'creative'],
];

const normalizeText = value =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const tokenize = value => {
  const normalized = normalizeText(value);
  const base = normalized.split(' ').filter(token => token.length > 2);
  const expanded = new Set(base);

  for (const group of SEMANTIC_TERMS) {
    if (group.some(term => normalized.includes(normalizeText(term)))) {
      group.flatMap(term => normalizeText(term).split(' ')).forEach(term => {
        if (term.length > 2) expanded.add(term);
      });
    }
  }

  return expanded;
};

const scoreTextSimilarity = (left, right) => {
  const leftTokens = tokenize(left);
  const rightTokens = tokenize(right);
  if (!leftTokens.size || !rightTokens.size) return 0;

  let overlap = 0;
  for (const token of leftTokens) {
    if (rightTokens.has(token)) overlap += 1;
  }

  return Math.min(1, overlap / Math.max(3, Math.min(leftTokens.size, rightTokens.size)));
};

class RecommendService {
  #repo;
  #gemini;

  constructor(recommendRepo, geminiService) {
    this.#repo = recommendRepo;
    this.#gemini = geminiService;
  }

  #normalizeProfile(profile) {
    return {
      ...profile,
      gpa: profile.gpa ? Number(profile.gpa) : null,
      ielts_score: extractIeltsScore(profile.english_level),
      document_count: Number(profile.document_count || 0),
      document_types: Array.isArray(profile.document_types) ? profile.document_types : [],
      intent_summary: [
        profile.target_major,
        profile.target_degree,
        profile.target_country,
        profile.target_intake,
        profile.bio,
      ].filter(Boolean).join(' '),
    };
  }

  #getProfileReadiness(profile) {
    const missingCore = CORE_PROFILE_FIELDS.filter(field => !profile[field]);
    const missingSupporting = SUPPORTING_PROFILE_FIELDS.filter(field => {
      if (field === 'document_count') return !profile.document_count;
      return !profile[field];
    });

    const coreCompleteness = (CORE_PROFILE_FIELDS.length - missingCore.length) / CORE_PROFILE_FIELDS.length;
    const supportingCompleteness =
      (SUPPORTING_PROFILE_FIELDS.length - missingSupporting.length) / SUPPORTING_PROFILE_FIELDS.length;
    const completeness = coreCompleteness * 0.75 + supportingCompleteness * 0.25;
    const confidence = completeness >= 0.82 ? 'high' : completeness >= 0.55 ? 'medium' : 'low';

    return {
      completeness,
      confidence,
      missing: missingCore,
      supporting_missing: missingSupporting,
      core_completeness: Number(coreCompleteness.toFixed(4)),
      supporting_completeness: Number(supportingCompleteness.toFixed(4)),
      document_count: profile.document_count || 0,
    };
  }

  #calculateRuleFit(profile, scholarship) {
    const reasons = [];
    const blockers = [];
    const breakdown = {
      academic: 0,
      degree: 0,
      country: 0,
      field: 0,
      language: 0,
      timing: 0,
      profile: 0,
    };

    if (profile.gpa && scholarship.min_gpa) {
      const gpa = parseFloat(profile.gpa);
      const minGpa = parseFloat(scholarship.min_gpa);
      if (gpa >= minGpa) {
        breakdown.academic = 1;
        reasons.push(`GPA ${profile.gpa} đạt yêu cầu tối thiểu ${scholarship.min_gpa}`);
      } else {
        blockers.push(`GPA hiện tại thấp hơn yêu cầu tối thiểu ${scholarship.min_gpa}`);
      }
    } else if (!scholarship.min_gpa) {
      breakdown.academic = 0.7;
    }

    if (profile.target_degree && scholarship.degree) {
      if (scholarship.degree === 'Any') {
        breakdown.degree = 0.8;
        reasons.push('Bậc học linh hoạt với mục tiêu của bạn');
      } else if (normalizeText(profile.target_degree) === normalizeText(scholarship.degree)) {
        breakdown.degree = 1;
        reasons.push(`Bậc học ${scholarship.degree} phù hợp`);
      }
    }

    if (profile.target_country && scholarship.country) {
      if (normalizeText(scholarship.country).includes(normalizeText(profile.target_country))) {
        breakdown.country = 1;
        reasons.push(`Quốc gia ${scholarship.country} trùng với mục tiêu`);
      }
    }

    if (profile.target_major && scholarship.field_of_study) {
      breakdown.field = scoreTextSimilarity(profile.target_major, scholarship.field_of_study);
      if (breakdown.field >= 0.5) {
        reasons.push(`Ngành ${scholarship.field_of_study} liên quan đến mục tiêu học tập`);
      }
    }

    if (profile.english_level && scholarship.min_ielts) {
      const userIelts = extractIeltsScore(profile.english_level);
      const minIelts = parseFloat(scholarship.min_ielts);
      if (userIelts && userIelts >= minIelts) {
        breakdown.language = 1;
        reasons.push(`IELTS ${userIelts} đạt yêu cầu tối thiểu ${scholarship.min_ielts}`);
      } else if (userIelts) {
        blockers.push(`IELTS hiện tại thấp hơn yêu cầu tối thiểu ${scholarship.min_ielts}`);
      }
    } else if (!scholarship.min_ielts) {
      breakdown.language = 0.7;
    }

    if (scholarship.deadline) {
      const daysUntilDeadline = Math.ceil(
        (new Date(scholarship.deadline) - new Date()) / (1000 * 60 * 60 * 24)
      );
      if (daysUntilDeadline > 0 && daysUntilDeadline <= 120) {
        breakdown.timing = daysUntilDeadline <= 30 ? 0.6 : 1;
        reasons.push(`Còn ${daysUntilDeadline} ngày đến hạn nộp`);
      }
    }

    if (profile.bio || profile.target_intake || profile.document_count > 0) {
      breakdown.profile = Math.min(
        1,
        (profile.bio ? 0.4 : 0) +
        (profile.target_intake ? 0.25 : 0) +
        (profile.document_count > 0 ? 0.35 : 0)
      );
    }

    const weightedScore =
      breakdown.academic * 0.22 +
      breakdown.degree * 0.18 +
      breakdown.country * 0.16 +
      breakdown.field * 0.16 +
      breakdown.language * 0.14 +
      breakdown.timing * 0.05 +
      breakdown.profile * 0.09;

    return {
      score: Math.min(1, weightedScore),
      reasons,
      blockers,
      breakdown,
    };
  }

  #calculateSemanticFit(profile, scholarship) {
    const signals = {
      field: scoreTextSimilarity(profile.target_major, scholarship.field_of_study),
      goals: scoreTextSimilarity(profile.intent_summary, [
        scholarship.description,
        scholarship.benefits,
        scholarship.requirements,
        scholarship.eligibility,
      ].filter(Boolean).join(' ')),
      intake: scoreTextSimilarity(profile.target_intake, scholarship.intake),
      provider: scoreTextSimilarity(profile.bio, [scholarship.title, scholarship.provider].join(' ')),
      document: profile.document_count > 0
        ? scoreTextSimilarity(profile.document_types.join(' '), [
          scholarship.requirements,
          scholarship.eligibility,
        ].filter(Boolean).join(' '))
        : 0,
    };

    const score = Math.min(
      1,
      signals.field * 0.35 +
      signals.goals * 0.3 +
      signals.intake * 0.1 +
      signals.provider * 0.15 +
      signals.document * 0.1
    );

    let reason = null;
    if (signals.field >= 0.45 && signals.goals >= 0.35) {
      reason = 'Học bổng này khớp khá sát với định hướng học tập và mục tiêu hồ sơ của bạn';
    } else if (score >= 0.45) {
      reason = 'Có nhiều tín hiệu ngữ nghĩa tích cực giữa hồ sơ hiện tại và nội dung học bổng';
    } else if (score > 0) {
      reason = 'Có một số tín hiệu liên quan giữa hồ sơ và học bổng';
    }

    return { score, reason, signals };
  }

  #buildRecommendation(profile, readiness, scholarship) {
    const rule = this.#calculateRuleFit(profile, scholarship);
    const semantic = this.#calculateSemanticFit(profile, scholarship);
    const score = Math.min(1, rule.score * 0.45 + semantic.score * 0.55);
    const reasons = [...rule.reasons];

    if (semantic.reason && !reasons.includes(semantic.reason)) {
      reasons.push(semantic.reason);
    }

    return {
      scholarship,
      match_score: Number(score.toFixed(4)),
      rule_score: Number(rule.score.toFixed(4)),
      semantic_score: Number(semantic.score.toFixed(4)),
      confidence: readiness.confidence,
      profile_gaps: readiness.missing,
      profile_enrichment_gaps: readiness.supporting_missing,
      profile_readiness: {
        overall: Number(readiness.completeness.toFixed(4)),
        core: readiness.core_completeness,
        supporting: readiness.supporting_completeness,
      },
      supporting_signals: {
        document_count: readiness.document_count,
        document_types: profile.document_types,
        has_bio: Boolean(profile.bio),
        has_target_intake: Boolean(profile.target_intake),
      },
      eligibility_blockers: rule.blockers,
      score_breakdown: {
        ...rule.breakdown,
        semantic: semantic.signals,
      },
      semantic_reason: semantic.reason,
      reasons,
      version: 'semantic_v2',
    };
  }

  recommend = async (userId, topN = 10) => {
    const rawProfile = await this.#repo.findProfileByUserId(userId);
    const profile = rawProfile ? this.#normalizeProfile(rawProfile) : null;
    if (!profile) throw new AppError('Vui lòng cập nhật profile trước khi sử dụng gợi ý', 400, 'PROFILE_REQUIRED');

    const readiness = this.#getProfileReadiness(profile);
    if (readiness.completeness < 0.3) {
      throw new AppError('Vui lòng bổ sung thêm GPA, tiếng Anh, ngành học hoặc quốc gia mục tiêu để nhận gợi ý chính xác hơn', 400, 'PROFILE_INCOMPLETE');
    }

    const scholarships = await this.#repo.findActiveScholarships(200);

    const top = scholarships
      .map(scholarship => this.#buildRecommendation(profile, readiness, scholarship))
      .filter(item => item.eligibility_blockers.length === 0)
      .filter(item => item.match_score > 0.12)
      .sort((a, b) => b.match_score - a.match_score)
      .slice(0, topN);

    return this.#gemini.enrichRecommendations(profile, top);
  };
}

module.exports = RecommendService;
