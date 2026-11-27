// Đặc tả /api/health: Railway dùng để quyết định bản deploy khỏe hay không, nên phải kiểm cả DB (R34).
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { closeDb, createClient, startServer, stopServer } from './helpers/app.js';

before(async () => {
  await startServer();
});

after(async () => {
  await stopServer();
  await closeDb();
});

describe('Health check', () => {
  it('DB chạy → 200, báo db ok, không cần đăng nhập', async () => {
    const res = await createClient().request('GET', '/api/health');
    assert.equal(res.status, 200, JSON.stringify(res.json));
    assert.equal(res.json.data.status, 'ok');
    assert.equal(res.json.data.db, 'ok');
  });
});
