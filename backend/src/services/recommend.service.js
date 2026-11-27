import { AppError, recommend as recommendErrors } from '~/constants/errors.js';
import { extractIeltsScore } from '~/utils/helpers.js';
import recommendModel from '~/models/recommend.model.js';
import recommendMatchService from '~/services/recommendMatch.service.js';
import {
  RECOMMEND_CORE_PROFILE_FIELDS,
  RECOMMEND_SUPPORTING_PROFILE_FIELDS,
  RECOMMEND_MIN_COMPLETENESS,
  RECOMMEND_MIN_MATCH_SCORE,
} from '~/constants/recommend.js';

class RecommendService {
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
    const missingCore = RECOMMEND_CORE_PROFILE_FIELDS.filter(field => !profile[field]);
    const missingSupporting = RECOMMEND_SUPPORTING_PROFILE_FIELDS.filter(field => {
      if (field === 'document_count') return !profile.document_count;
      return !profile[field];
    });

    const coreCompleteness = (RECOMMEND_CORE_PROFILE_FIELDS.length - missingCore.length) / RECOMMEND_CORE_PROFILE_FIELDS.length;
    const supportingCompleteness =
      (RECOMMEND_SUPPORTING_PROFILE_FIELDS.length - missingSupporting.length) / RECOMMEND_SUPPORTING_PROFILE_FIELDS.length;
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

  #buildRecommendation(profile, readiness, scholarship) {
    const rule = recommendMatchService.ruleFit(profile, scholarship);
    const semantic = recommendMatchService.semanticFit(profile, scholarship);
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

  // Bước 3: thay bản chấm điểm (cột nhẹ) bằng bản ghi hiển thị, giữ đúng thứ tự xếp hạng
  async #attachDetails(ranked) {
    const ids = ranked.map(item => item.scholarship.id);
    const details = await recommendModel.findByIds(ids);
    const byId = new Map(details.map(row => [row.id, row]));
    return ranked
      .filter(item => byId.has(item.scholarship.id))
      .map(item => ({ ...item, scholarship: byId.get(item.scholarship.id) }));
  }

  async recommend(userId, topN = 10) {
    const rawProfile = await recommendModel.findProfileByUserId(userId);
    const profile = rawProfile ? this.#normalizeProfile(rawProfile) : null;
    if (!profile) throw new AppError(recommendErrors.PROFILE_REQUIRED);

    const readiness = this.#getProfileReadiness(profile);
    if (readiness.completeness < RECOMMEND_MIN_COMPLETENESS) {
      throw new AppError(recommendErrors.PROFILE_INCOMPLETE);
    }

    const candidates = await recommendModel.findCandidates();
    const ranked = candidates
      .map(scholarship => this.#buildRecommendation(profile, readiness, scholarship))
      .filter(item => item.eligibility_blockers.length === 0)
      .filter(item => item.match_score > RECOMMEND_MIN_MATCH_SCORE)
      .sort((a, b) => b.match_score - a.match_score)
      .slice(0, topN);
    const top = await this.#attachDetails(ranked);

    // Điểm nối dịch vụ RAG sau này (docs/rankContract.md): xếp hạng lại / viết lý do cho `top`
    return top;
  }
}

export default new RecommendService();