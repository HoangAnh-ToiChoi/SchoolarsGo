import test, { mock } from 'node:test';
import assert from 'node:assert/strict';

import { mockService, srcUrl } from './helpers/mockService.js';
import { HEALTH_CACHE_MS } from '~/constants/health.js';

const modelRef = mockService(srcUrl('models/health.model.js'));
const { default: healthService } = await import('~/services/health.service.js');

// Chỉ giả Date (setTimeout thật để withTimeout chạy đúng); mỗi test nhảy qua thời gian giữ kết quả
mock.timers.enable({ apis: ['Date'], now: 0 });

function countingPing(impl) {
  const calls = { n: 0 };
  modelRef.current = {
    ping() {
      calls.n += 1;
      return impl();
    },
  };
  mock.timers.tick(HEALTH_CACHE_MS + 1);
  return calls;
}

const answers = async () => undefined;

test('DB trả lời → ok', async () => {
  countingPing(answers);
  assert.deepEqual(await healthService.check(), { ok: true, db: 'ok' });
});

test('DB lỗi → down, không ném lỗi ra ngoài', async () => {
  countingPing(async () => { throw new Error('connection refused'); });
  assert.deepEqual(await healthService.check(), { ok: false, db: 'down' });
});

test('DB treo quá thời gian chờ → down', { timeout: 10_000 }, async () => {
  countingPing(() => new Promise(function never() { /* DB không bao giờ trả lời */ }));
  assert.deepEqual(await healthService.check(), { ok: false, db: 'down' });
});

test('gọi dồn: các lần gọi cùng lúc và trong thời gian giữ kết quả chỉ ping DB một lần', async () => {
  const calls = countingPing(answers);
  await Promise.all(Array.from({ length: 20 }, () => healthService.check()));
  await healthService.check();
  assert.equal(calls.n, 1);
  mock.timers.tick(HEALTH_CACHE_MS + 1);
  await healthService.check();
  assert.equal(calls.n, 2);
});
