import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

import { getAuthSecrets } from '~/configs/jwt.config.js';

const random = () => crypto.randomBytes(32).toString('hex');
const prod = (access, refresh) => ({ NODE_ENV: 'production', JWT_ACCESS_SECRET: access, JWT_REFRESH_SECRET: refresh });

test('production: secret ngẫu nhiên được nhận', () => {
  const access = random();
  const refresh = random();
  assert.deepEqual(getAuthSecrets(prod(access, refresh)), { accessSecret: access, refreshSecret: refresh });
});

test('production: chuỗi mẫu công khai (trong .env.example, script test, tài liệu) bị từ chối', () => {
  const samples = [
    'your-super-secret-jwt-secret-with-at-least-32-characters-long',
    'test-access-secret-at-least-32-chars-long',
    'change-me-change-me-change-me-change-me',
    'replace-with-a-long-random-string-for-jwt',
  ];
  for (const sample of samples) {
    assert.throws(() => getAuthSecrets(prod(sample, random())), /JWT_ACCESS_SECRET.*mẫu/, sample);
    assert.throws(() => getAuthSecrets(prod(random(), sample)), /JWT_REFRESH_SECRET.*mẫu/, sample);
  }
});

test('production: secret lặp ký tự (ít ký tự khác nhau) bị từ chối', () => {
  assert.throws(() => getAuthSecrets(prod('a'.repeat(40), random())), /JWT_ACCESS_SECRET.*ngẫu nhiên/);
  assert.throws(() => getAuthSecrets(prod('abab'.repeat(10), random())), /JWT_ACCESS_SECRET.*ngẫu nhiên/);
});

test('ngoài production (dev, test) vẫn nhận chuỗi mẫu để chạy local tiện', () => {
  const env = { NODE_ENV: 'development', JWT_ACCESS_SECRET: 'local-access-secret-at-least-32-chars-long', JWT_REFRESH_SECRET: 'local-refresh-secret-at-least-32-chars-long' };
  assert.doesNotThrow(() => getAuthSecrets(env));
});
