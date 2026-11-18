import test from 'node:test';
import assert from 'node:assert/strict';
import { Router } from 'express';

import { createJsonApp, withServer, requestJson } from './helpers/http.js';
import { mockService } from './helpers/mockService.js';

// Controller dùng bản service xuất sẵn nên phải giả lập module trước khi nạp controller
const serviceRef = mockService(new URL('../../src/services/news.service.js', import.meta.url).href);
const { default: controller } = await import('~/controllers/news.controller.js');

const buildApp = (service) => {
  serviceRef.current = service;
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
