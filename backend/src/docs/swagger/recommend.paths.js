import {
  BEARER_AUTH,
  NULLABLE_STRING,
  UNAUTHORIZED,
  envelope,
  jsonContent,
  jsonResponse,
  ref,
} from './shared.js';

const STRING_LIST = { type: 'array', items: { type: 'string' } };

const recommendation = {
  type: 'object',
  properties: {
    scholarship: ref('Scholarship'),
    match_score: { type: 'number', example: 0.92 },
    rule_score: { type: 'number', example: 0.78 },
    semantic_score: { type: 'number', example: 0.89 },
    confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
    profile_gaps: STRING_LIST,
    profile_enrichment_gaps: STRING_LIST,
    profile_readiness: {
      type: 'object',
      properties: {
        overall: { type: 'number', example: 0.82 },
        core: { type: 'number', example: 1 },
        supporting: { type: 'number', example: 0.66 },
      },
    },
    supporting_signals: {
      type: 'object',
      properties: {
        document_count: { type: 'integer', example: 2 },
        document_types: STRING_LIST,
        has_bio: { type: 'boolean', example: true },
        has_target_intake: { type: 'boolean', example: true },
      },
    },
    score_breakdown: { type: 'object' },
    semantic_reason: NULLABLE_STRING,
    ai_reason: NULLABLE_STRING,
    version: { type: 'string', example: 'semantic_v2' },
    reasons: STRING_LIST,
  },
};

const topNBody = {
  type: 'object',
  properties: { top_n: { type: 'integer', default: 10, description: 'Số lượng gợi ý' } },
};

const recommendPaths = {
  '/api/recommend': {
    post: {
      summary: 'Gợi ý học bổng theo profile (AI hoặc rule-based)',
      tags: ['AI'],
      security: BEARER_AUTH,
      requestBody: { content: jsonContent(topNBody) },
      responses: {
        200: jsonResponse('Danh sách gợi ý', envelope({ type: 'array', items: recommendation })),
        401: UNAUTHORIZED,
      },
    },
  },
};

export { recommendPaths };
