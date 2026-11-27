import test from 'node:test';
import assert from 'node:assert/strict';

import { mockService, srcUrl } from './helpers/mockService.js';

const modelRef = mockService(srcUrl('models/health.model.js'));
const { default: healthService } = await import('~/services/health.service.js');

test('DB trả lời → ok', async () => {
  modelRef.current = { async ping() {} };
  assert.deepEqual(await healthService.check(), { ok: true, db: 'ok' });
});

test('DB lỗi → down, không ném lỗi ra ngoài', async () => {
  modelRef.current = { async ping() { throw new Error('connection refused'); } };
  assert.deepEqual(await healthService.check(), { ok: false, db: 'down' });
});

test('DB treo quá thời gian chờ → down', { timeout: 10_000 }, async () => {
  modelRef.current = { ping: () => new Promise(() => {}) };
  assert.deepEqual(await healthService.check(), { ok: false, db: 'down' });
});
