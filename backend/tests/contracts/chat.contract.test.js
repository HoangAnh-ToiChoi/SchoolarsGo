import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';

import { mockServiceFunctions } from './helpers/mockService.js';
import { auth } from '~/middlewares/auth.js';
import AppError from '~/utils/AppError.js';
import { createJsonApp, withServer, requestJson } from './helpers/http.js';

// Controller dùng bản service xuất sẵn nên phải giả lập module trước khi nạp controller
const serviceRef = mockServiceFunctions(new URL('../../src/services/chat.service.js', import.meta.url).href, ['chat', 'saveMessages', 'getHistory']);
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
  router.post('/', auth, chatLimiter, controller.sendMessage);

  return createJsonApp((app) => {
    app.use('/api/chat', router);
  });
};

test('GET /api/chat/history requires authentication', async () => {
  const app = buildApp({
    chat: async () => '',
    saveMessages: async () => {},
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
    chat: async () => '',
    saveMessages: async () => {},
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
    chat: async () => '',
    saveMessages: async () => {},
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
    assert.match(response.json.message, /messages là bắt buộc/i);
  });
});

test('POST /api/chat rejects overly long final messages', async () => {
  const app = buildApp({
    chat: async () => '',
    saveMessages: async () => {},
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
    assert.match(response.json.message, /1000 ký tự/i);
  });
});

test('POST /api/chat returns reply and persists latest exchange', async () => {
  const saved = [];
  const chatCalls = [];
  const app = buildApp({
    chat: async (messages, options) => {
      chatCalls.push({ messages, options });
      return 'Scholarships matched';
    },
    saveMessages: async (userId, userMessage, reply) => {
      saved.push({ userId, userMessage, reply });
    },
    getHistory: async () => [],
  });

  await withServer(app, async ({ baseUrl }) => {
    const response = await requestJson(baseUrl, '/api/chat', {
      method: 'POST',
      token: buildToken(),
      body: {
        messages: [
          { role: 'assistant', content: 'welcome' },
          { role: 'user', content: 'Find me AI scholarships in Australia' },
        ],
      },
    });

    assert.equal(response.status, 200);
    assert.equal(response.json.success, true);
    assert.equal(response.json.data.reply, 'Scholarships matched');
    assert.deepEqual(chatCalls, [{
      messages: [
        { role: 'assistant', content: 'welcome' },
        { role: 'user', content: 'Find me AI scholarships in Australia' },
      ],
      options: { userId: 'chat-user-1' },
    }]);
    assert.deepEqual(saved, [{
      userId: 'chat-user-1',
      userMessage: 'Find me AI scholarships in Australia',
      reply: 'Scholarships matched',
    }]);
  });
});

test('POST /api/chat surfaces operational service outages cleanly', async () => {
  const app = buildApp({
    chat: async () => {
      throw new AppError('ScholarsBot đang bận, vui lòng thử lại sau vài giây nhé!', 503, 'CHAT_BUSY');
    },
    saveMessages: async () => {},
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
