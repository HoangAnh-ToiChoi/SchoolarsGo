const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { Router } = require('express');

process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'upload-access-secret-at-least-32-characters';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'upload-refresh-secret-at-least-32-characters';

const { auth } = require('../../src/middlewares/auth');
const { upload, handleUploadError } = require('../../src/middlewares/upload');
const { createJsonApp, withServer, requestJson } = require('./helpers/http');

function buildApp() {
  const router = Router();
  router.post('/upload', auth, upload.single('file'), handleUploadError, (req, res) => {
    res.status(201).json({ success: true });
  });

  return createJsonApp((app) => {
    app.use('/api/documents', router);
  });
}

test('document upload forwards missing and expired access errors to the global handler', async function() {
  const app = buildApp();
  const expiredToken = jwt.sign(
    { sub: 'upload-user', sid: 'upload-session', role: 'user' },
    process.env.JWT_ACCESS_SECRET,
    { algorithm: 'HS256', expiresIn: -1 }
  );

  await withServer(app, async function({ baseUrl }) {
    const missing = await requestJson(baseUrl, '/api/documents/upload', { method: 'POST' });
    assert.equal(missing.status, 401);
    assert.equal(missing.json.code, 'ACCESS_TOKEN_MISSING');

    const expired = await requestJson(baseUrl, '/api/documents/upload', {
      method: 'POST',
      token: expiredToken,
    });
    assert.equal(expired.status, 401);
    assert.equal(expired.json.code, 'ACCESS_TOKEN_EXPIRED');
  });
});
