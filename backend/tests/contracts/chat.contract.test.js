import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';

import { mockService } from './helpers/mockService.js';
import { auth } from '~/middlewares/auth.js';
import { AppError } from '~/constants/errors.js';
import { createJsonApp, withServer, requestJson } from './helpers/http.js';
import validate from '~/middlewares/validate.js';
import { chatSchema } from '~/validations/chat.validation.js';

// Controller dùng bản service xuất sẵn nên phải giả lập module trước khi nạp controller
const serviceRef = mockService(new URL('../../src/services/chat.service.js', import.meta.url).href);
const { default: controller } = await import('~/controllers/chat.controller.js');

process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'contract-access-secret-at-least-32-chars';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'contract-refresh-secret-at-least-32-chars';

const buildToken = () =>
  jwt.sign({ sub: 'chat-user-1', sid: 'chat-session-1', role: 'user' }, process.env.JWT_ACCESS_SECRET, { algorithm: 'HS256' });

const buildApp = (service) => {
  serviceRef.current = service;
  const chatLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    message: { success: false, message: 'Quá nhiều tin nhắn, vui lòng thử lại sau 1 phút' },
  });

  const router = Router();
  router.get('/history', auth, controller.getChatHistory);
  router.post('/', auth, chatLimiter, validate(chatSchema), controller.sendMessage);

  return createJsonApp((app) => {
    app.use('/api/chat', router);
  });
};

test('GET /api/chat/history requires authentication', async () => {
  const app = buildApp({
    reply: async () => '',
    getHistory: async () => [],
  });

  await withServer(app, async ({ baseUrl }) => {
    const response = await requestJson(baseUrl, '/api/chat/history');
    assert.equal(response.status, 401);
    assert.equal(response.json.success, false);
  });
});

test('GET /api/chat/history returns history contract', async () => {
  const app = buildApp({
    reply: async () => '',
    getHistory: async () => [{ role: 'user', content: 'hello' }],
  });

  await withServer(app, async ({ baseUrl }) => {
    const response = await requestJson(baseUrl, '/api/chat/history', {
      token: buildToken(),
    });

    assert.equal(response.status, 200);
    assert.equal(response.json.success, true);
    assert.deepEqual(response.json.data.messages, [{ role: 'user', content: 'hello' }]);
  });
});

test('POST /api/chat rejects invalid message payloads', async () => {
  const app = buildApp({
    reply: async () => '',
    getHistory: async () => [],
  });

  await withServer(app, async ({ baseUrl }) => {
    const response = await requestJson(baseUrl, '/api/chat', {
      method: 'POST',
      token: buildToken(),
      body: { messages: [] },
    });

    assert.equal(response.status, 400);
    assert.equal(response.json.success, false);
    assert.match(JSON.stringify(response.json.errors), /messages là bắt buộc/i);
  });
});

test('POST /api/chat rejects overly long final messages', async () => {
  const app = buildApp({
    reply: async () => '',
    getHistory: async () => [],
  });

  await withServer(app, async ({ baseUrl }) => {
    const response = await requestJson(baseUrl, '/api/chat', {
      method: 'POST',
      token: buildToken(),
      body: {
        messages: [{ role: 'user', content: 'x'.repeat(1001) }],
      },
    });

    assert.equal(response.status, 400);
    assert.equal(response.json.success, false);
    assert.match(JSON.stringify(response.json.errors), /1000 ký tự/i);
  });
});

test('POST /api/chat chuyển messages + userId cho service và trả { reply }', async () => {
  const calls = [];
  const app = buildApp({
    reply: async (messages, userId) => {
      calls.push({ messages, userId });
      return 'Scholarships matched';
    },
    getHistory: async () => [],
  });
  const messages = [
    { role: 'assistant', content: 'welcome' },
    { role: 'user', content: 'Find me AI scholarships in Australia' },
  ];

  await withServer(app, async ({ baseUrl }) => {
    const response = await requestJson(baseUrl, '/api/chat', { method: 'POST', token: buildToken(), body: { messages } });

    assert.equal(response.status, 200);
    assert.equal(response.json.success, true);
    assert.equal(response.json.data.reply, 'Scholarships matched');
    assert.deepEqual(calls, [{ messages, userId: 'chat-user-1' }]);
  });
});

test('POST /api/chat surfaces operational service outages cleanly', async () => {
  const app = buildApp({
    reply: async () => {
      throw new AppError({ statusCode: 503, code: 'CHAT_BUSY', message: 'ScholarsBot đang bận, vui lòng thử lại sau vài giây nhé!' });
    },
    getHistory: async () => [],
  });

  await withServer(app, async ({ baseUrl }) => {
    const response = await requestJson(baseUrl, '/api/chat', {
      method: 'POST',
      token: buildToken(),
      body: { messages: [{ role: 'user', content: 'hello' }] },
    });

    assert.equal(response.status, 503);
    assert.equal(response.json.success, false);
    assert.match(response.json.message, /vui lòng thử lại sau/i);
  });
});

test('POST /api/chat chỉ chuyển 20 tin gần nhất cho service và chặn quá 50 tin', async () => {
  const seen = [];
  const app = buildApp({
    reply: async (messages) => {
      seen.push(messages.length);
      return 'ok';
    },
    getHistory: async () => [],
  });
  const many = (n) => Array.from({ length: n }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: `tin ${i}` }));

  await withServer(app, async ({ baseUrl }) => {
    const ok = await requestJson(baseUrl, '/api/chat', { method: 'POST', token: buildToken(), body: { messages: many(31) } });
    const tooMany = await requestJson(baseUrl, '/api/chat', { method: 'POST', token: buildToken(), body: { messages: many(51) } });

    assert.equal(ok.status, 200);
    assert.deepEqual(seen, [20]);
    assert.equal(tooMany.status, 400);
  });
});
