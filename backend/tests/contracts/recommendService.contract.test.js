import test from 'node:test';
import assert from 'node:assert/strict';

import { mockService, mockServiceFunctions, srcUrl } from './helpers/mockService.js';

const modelRef = mockService(srcUrl('models/recommend.model.js'));
const geminiRef = mockServiceFunctions(srcUrl('services/gemini.service.js'), ['enrichRecommendations', 'getClient']);
const { default: recommendService } = await import('~/services/recommend.service.js');

const PROFILE = {
  gpa: 3.6, gpa_scale: '4.0', english_level: 'IELTS 7.0', target_country: 'Japan', target_degree: 'Master',
  target_major: 'Computer Science', target_intake: 'Fall 2027', bio: 'Thích AI', intent_summary: 'Học AI',
  document_count: 2, document_types: ['cv', 'transcript'],
};

function candidate(id, overrides = {}) {
  return {
    id, title: `HB ${id}`, provider: 'P', country: 'Japan', degree: 'Master', field_of_study: 'Computer Science',
    min_gpa: 3, min_ielts: 6, deadline: null, intake: 'Fall 2027', summary: 'AI', benefits: null, requirements: null, eligibility: null,
    ...overrides,
  };
}

function setup({ profile = PROFILE, candidates = [], details } = {}) {
  const calls = { findByIds: [] };
  modelRef.current = {
    findProfileByUserId: async () => profile,
    findCandidates: async () => candidates,
    findByIds: async (ids) => {
      calls.findByIds.push(ids);
      const rows = details ?? ids.map((id) => ({ id, slug: `hb-${id}`, title: `HB ${id}` }));
      return [...rows].reverse(); // DB không hứa thứ tự: service phải tự ghép
    },
  };
  geminiRef.current = { enrichRecommendations: async (_profile, top) => top };
  return calls;
}

test('chấm điểm mọi ứng viên, lấy chi tiết một lần cho top N, giữ đúng thứ tự xếp hạng', async () => {
  const calls = setup({
    candidates: [
      candidate('weak', { field_of_study: 'Nursing', intake: null, summary: null }),
      candidate('best'),
      candidate('blocked', { min_gpa: 3.9 }),
    ],
  });
  const result = await recommendService.recommend('u1', 2);

  assert.equal(calls.findByIds.length, 1);
  assert.deepEqual(calls.findByIds[0], result.map((r) => r.scholarship.id));
  assert.equal(result[0].scholarship.id, 'best');
  assert.equal(result[0].scholarship.slug, 'hb-best', 'trả bản ghi hiển thị, không phải bản chấm điểm');
  assert.ok(!result.some((r) => r.scholarship.id === 'blocked'), 'GPA không đủ thì bị loại');
});

test('học bổng bị tắt giữa hai bước (không còn chi tiết) thì bỏ qua', async () => {
  setup({ candidates: [candidate('a'), candidate('b')], details: [{ id: 'b', slug: 'hb-b' }] });
  const result = await recommendService.recommend('u1', 10);
  assert.deepEqual(result.map((r) => r.scholarship.id), ['b']);
});

test('không có ứng viên thì trả mảng rỗng', async () => {
  const calls = setup({ candidates: [] });
  const result = await recommendService.recommend('u1', 10);
  assert.deepEqual(result, []);
  assert.deepEqual(calls.findByIds, [[]]);
});

test('chưa có hồ sơ → PROFILE_REQUIRED', async () => {
  setup({ profile: null });
  await assert.rejects(recommendService.recommend('u1', 10), { code: 'PROFILE_REQUIRED' });
});
