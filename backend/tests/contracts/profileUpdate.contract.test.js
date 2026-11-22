import test from 'node:test';
import assert from 'node:assert/strict';

import { mockSupabase } from './helpers/mockService.js';

// Model gọi getSupabase() nên giả lập configs/supabase.js trước khi nạp model
const supabaseRef = mockSupabase();
const { profileUpdateSchema } = await import('~/validations/profile.validation.js');
const { default: profileModel } = await import('~/models/profile.model.js');

const VALID_NEW_FIELDS = {
  current_degree: 'Bachelor',
  major: 'Công nghệ phần mềm',
  nationality: 'vn',
  birth_year: 2005,
  experience: '2 dự án backend',
  certificates: [{ type: 'IELTS', score: 6.5 }, { type: 'CEFR', level: 'B1' }],
};

const fails = data => !profileUpdateSchema.safeParse(data).success;

test('PUT /profile nhận 6 trường mới, nationality được đổi thành chữ hoa', () => {
  const result = profileUpdateSchema.parse(VALID_NEW_FIELDS);
  assert.equal(result.nationality, 'VN');
  assert.equal(result.birth_year, 2005);
  assert.deepEqual(result.certificates, VALID_NEW_FIELDS.certificates);
});

test('PUT /profile chỉ gửi một trường vẫn hợp lệ, trường lạ bị bỏ', () => {
  const result = profileUpdateSchema.parse({ nationality: 'th', role: 'admin' });
  assert.deepEqual(result, { nationality: 'TH' });
});

test('PUT /profile từ chối giá trị sai miền của trường mới', () => {
  assert.ok(fails({ nationality: 'Vietnam' }));
  assert.ok(fails({ current_degree: 'Any' }));
  assert.ok(fails({ birth_year: 1800 }));
  assert.ok(fails({ birth_year: 3000 }));
  assert.ok(fails({ major: 'a'.repeat(101) }));
  assert.ok(fails({ experience: 'a'.repeat(2001) }));
});

test('PUT /profile kiểm chứng chỉ: IELTS phải có điểm 0 đến 9, chứng chỉ cần điểm hoặc mức, tối đa 10', () => {
  assert.ok(fails({ certificates: [{ type: 'IELTS', score: 12 }] }));
  assert.ok(fails({ certificates: [{ type: 'IELTS', level: 'B2' }] }));
  assert.ok(fails({ certificates: [{ type: 'TOEFL' }] }));
  assert.ok(fails({ certificates: Array.from({ length: 11 }, () => ({ type: 'CEFR', level: 'B1' })) }));
  assert.ok(!fails({ certificates: [{ type: 'TOEFL', score: 100 }] }));
});

test('PUT /profile vẫn kiểm các trường cũ như trước (GPA tối đa 4)', () => {
  assert.ok(fails({ gpa: 5 }));
  assert.ok(!fails({ gpa: 3.4, bio: 'xin chào' }));
});

// Supabase giả: ghi lại dữ liệu được upsert
const fakeUpsert = captured => ({
  from: () => ({
    upsert: payload => {
      captured.payload = payload;
      return { select: () => ({ single: async () => ({ data: payload, error: null }) }) };
    },
  }),
});

test('ProfileModel.upsertProfile ghi các cột mới, bỏ cột ngoài danh sách, luôn gắn user_id từ token', async () => {
  const captured = {};
  supabaseRef.current = fakeUpsert(captured);

  await profileModel.upsertProfile('user-1', { ...VALID_NEW_FIELDS, role: 'admin', user_id: 'user-2' });

  assert.equal(captured.payload.user_id, 'user-1');
  assert.equal(captured.payload.nationality, 'vn');
  assert.equal(captured.payload.birth_year, 2005);
  assert.deepEqual(captured.payload.certificates, VALID_NEW_FIELDS.certificates);
  assert.equal('role' in captured.payload, false);
});

test('ProfileModel.upsertProfile không ghi đè cột không được gửi', async () => {
  const captured = {};
  supabaseRef.current = fakeUpsert(captured);

  await profileModel.upsertProfile('user-1', { major: 'Math' });

  assert.equal(captured.payload.major, 'Math');
  assert.equal('gpa' in captured.payload, false);
  assert.equal('certificates' in captured.payload, false);
});
