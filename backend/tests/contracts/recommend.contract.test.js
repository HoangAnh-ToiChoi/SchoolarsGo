const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { Router } = require('express');

const RecommendController = require('../../src/controllers/recommend.controller');
const { auth } = require('../../src/middlewares/auth');
const validate = require('../../src/middlewares/validate');
const { recommendSchema } = require('../../src/utils/validators');
const AppError = require('../../src/utils/AppError');
const { createJsonApp, withServer, requestJson } = require('./helpers/http');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'contracts-secret';

const buildToken = () =>
  jwt.sign({ id: 'user-123', email: 'contract@test.dev' }, process.env.JWT_SECRET);

const buildApp = (service) => {
  const controller = new RecommendController(service);
  const router = Router();
  router.post('/', auth, validate(recommendSchema), controller.recommend);

  return createJsonApp((app) => {
    app.use('/api/recommend', router);
  });
};

test('POST /api/recommend requires authentication', async () => {
  const app = buildApp({
    recommend: async () => [],
  });

  await withServer(app, async ({ baseUrl }) => {
    const response = await requestJson(baseUrl, '/api/recommend', {
      method: 'POST',
      body: { top_n: 5 },
    });

    assert.equal(response.status, 401);
    assert.equal(response.json.success, false);
  });
});

test('POST /api/recommend validates top_n contract', async () => {
  const app = buildApp({
    recommend: async () => [],
  });

  await withServer(app, async ({ baseUrl }) => {
    const response = await requestJson(baseUrl, '/api/recommend', {
      method: 'POST',
      token: buildToken(),
      body: { top_n: 99 },
    });

    assert.equal(response.status, 400);
    assert.equal(response.json.success, false);
    assert.equal(response.json.message, 'Dữ liệu không hợp lệ');
    assert.equal(response.json.errors[0].field, 'top_n');
  });
});

test('POST /api/recommend passes authenticated user and returns success contract', async () => {
  const calls = [];
  const app = buildApp({
    recommend: async (userId, topN) => {
      calls.push({ userId, topN });
      return [{ scholarship: { id: 'sch-1', title: 'Test Scholarship' }, match_score: 0.8 }];
    },
  });

  await withServer(app, async ({ baseUrl }) => {
    const response = await requestJson(baseUrl, '/api/recommend', {
      method: 'POST',
      token: buildToken(),
      body: { top_n: 7 },
    });

    assert.equal(response.status, 200);
    assert.equal(response.json.success, true);
    assert.equal(response.json.data[0].scholarship.title, 'Test Scholarship');
    assert.deepEqual(calls, [{ userId: 'user-123', topN: 7 }]);
  });
});

test('POST /api/recommend surfaces operational profile errors cleanly', async () => {
  const app = buildApp({
    recommend: async () => {
      throw new AppError(
        'Vui lòng bổ sung thêm GPA, tiếng Anh, ngành học hoặc quốc gia mục tiêu để nhận gợi ý chính xác hơn',
        400,
        'PROFILE_INCOMPLETE'
      );
    },
  });

  await withServer(app, async ({ baseUrl }) => {
    const response = await requestJson(baseUrl, '/api/recommend', {
      method: 'POST',
      token: buildToken(),
      body: {},
    });

    assert.equal(response.status, 400);
    assert.equal(response.json.success, false);
    assert.match(response.json.message, /bổ sung thêm GPA/i);
  });
});
