const test = require('node:test');
const assert = require('node:assert/strict');
const { Router } = require('express');

const NewsController = require('../../src/controllers/news.controller');
const { createJsonApp, withServer, requestJson } = require('./helpers/http');

const buildApp = (service) => {
  const controller = new NewsController(service);
  const router = Router();
  router.get('/', controller.getNews);

  return createJsonApp((app) => {
    app.use('/api/news', router);
  });
};

test('GET /api/news clamps limit and preserves category filtering', async () => {
  const calls = [];
  const app = buildApp({
    getNews: async (limit, category) => {
      calls.push({ limit, category });
      return [{ id: 'news-1', title: 'Visa update' }];
    },
  });

  await withServer(app, async ({ baseUrl }) => {
    const response = await requestJson(baseUrl, '/api/news?limit=99&category=Visa');

    assert.equal(response.status, 200);
    assert.equal(response.json.success, true);
    assert.deepEqual(response.json.data, [{ id: 'news-1', title: 'Visa update' }]);
    assert.deepEqual(calls, [{ limit: 50, category: 'Visa' }]);
  });
});

test('GET /api/news defaults invalid limit to 20', async () => {
  const calls = [];
  const app = buildApp({
    getNews: async (limit, category) => {
      calls.push({ limit, category });
      return [];
    },
  });

  await withServer(app, async ({ baseUrl }) => {
    const response = await requestJson(baseUrl, '/api/news?limit=abc');

    assert.equal(response.status, 200);
    assert.equal(response.json.success, true);
    assert.deepEqual(calls, [{ limit: 20, category: null }]);
  });
});
