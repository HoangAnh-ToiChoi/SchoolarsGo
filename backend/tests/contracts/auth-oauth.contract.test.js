const test = require('node:test');
const assert = require('node:assert/strict');
const { Router } = require('express');

const AuthController = require('../../src/controllers/auth.controller');
const { createJsonApp, withServer } = require('./helpers/http');

const buildApp = (service) => {
  const controller = new AuthController(service);
  const router = Router();
  router.get('/oauth/facebook/start', controller.startFacebookOAuth);
  router.get('/oauth/facebook/callback', controller.facebookCallback);
  router.get('/oauth/apple/start', controller.startAppleOAuth);
  router.get('/oauth/apple/callback', controller.appleCallback);

  return createJsonApp((app) => {
    app.use('/api/auth', router);
  });
};

test('GET /api/auth/oauth/facebook/start redirects to provider and sets state cookie', async () => {
  const app = buildApp({
    getFacebookAuthorizationUrl: ({ state }) => `https://facebook.test/dialog?state=${state}`,
  });

  await withServer(app, async ({ baseUrl }) => {
    const response = await fetch(`${baseUrl}/api/auth/oauth/facebook/start`, { redirect: 'manual' });

    assert.equal(response.status, 302);
    assert.match(response.headers.get('location'), /^https:\/\/facebook\.test\/dialog\?state=/);
    assert.match(response.headers.get('set-cookie'), /oauth_state_facebook=/);
  });
});

test('GET /api/auth/oauth/apple/start redirects to provider and sets state cookie', async () => {
  const app = buildApp({
    getAppleAuthorizationUrl: ({ state }) => `https://apple.test/auth?state=${state}`,
  });

  await withServer(app, async ({ baseUrl }) => {
    const response = await fetch(`${baseUrl}/api/auth/oauth/apple/start`, { redirect: 'manual' });

    assert.equal(response.status, 302);
    assert.match(response.headers.get('location'), /^https:\/\/apple\.test\/auth\?state=/);
    assert.match(response.headers.get('set-cookie'), /oauth_state_apple=/);
  });
});

test('GET /api/auth/oauth/facebook/callback sets auth cookie and redirects to frontend success page', async () => {
  const app = buildApp({
    loginWithFacebook: async () => ({
      user: { email: 'oauth@example.com' },
      token: 'jwt-token',
    }),
  });

  await withServer(app, async ({ baseUrl }) => {
    const response = await fetch(`${baseUrl}/api/auth/oauth/facebook/callback?state=ok&code=abc`, {
      redirect: 'manual',
      headers: { Cookie: 'oauth_state_facebook=ok' },
    });

    assert.equal(response.status, 302);
    assert.match(response.headers.get('location'), /\/oauth\/complete\?provider=facebook&success=1&email=oauth%40example\.com/);
    assert.match(response.headers.get('set-cookie'), /token=jwt-token/);
  });
});

test('GET /api/auth/oauth/facebook/callback redirects to frontend error page on state mismatch', async () => {
  const app = buildApp({
    loginWithFacebook: async () => {
      throw new Error('should not be called');
    },
  });

  await withServer(app, async ({ baseUrl }) => {
    const response = await fetch(`${baseUrl}/api/auth/oauth/facebook/callback?state=bad&code=abc`, {
      redirect: 'manual',
      headers: { Cookie: 'oauth_state_facebook=good' },
    });

    assert.equal(response.status, 302);
    assert.match(response.headers.get('location'), /provider=facebook/);
    assert.match(response.headers.get('location'), /error=/);
  });
});

test('GET /api/auth/oauth/apple/callback sets auth cookie and redirects to frontend success page', async () => {
  const app = buildApp({
    loginWithApple: async () => ({
      user: { email: 'apple@example.com' },
      token: 'apple-jwt',
    }),
  });

  await withServer(app, async ({ baseUrl }) => {
    const response = await fetch(`${baseUrl}/api/auth/oauth/apple/callback?state=ok&code=abc`, {
      redirect: 'manual',
      headers: { Cookie: 'oauth_state_apple=ok' },
    });

    assert.equal(response.status, 302);
    assert.match(response.headers.get('location'), /\/oauth\/complete\?provider=apple&success=1&email=apple%40example\.com/);
    assert.match(response.headers.get('set-cookie'), /token=apple-jwt/);
  });
});
