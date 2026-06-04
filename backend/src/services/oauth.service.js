const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');

const FACEBOOK_GRAPH_VERSION = 'v21.0';
const APPLE_ISSUER = 'https://appleid.apple.com';

const normalizeEmail = email => String(email || '').trim().toLowerCase() || null;

class OAuthService {
  #appleKeyCache = { keys: null, fetchedAt: 0 };

  #requireEnv(name) {
    const value = process.env[name];
    if (!value) throw new AppError(`${name} chưa được cấu hình`, 503, 'OAUTH_PROVIDER_NOT_CONFIGURED');
    return value;
  }

  buildFacebookAuthorizationUrl({ state, redirectUri }) {
    const appId = this.#requireEnv('FACEBOOK_APP_ID');
    const params = new URLSearchParams({
      client_id: appId,
      redirect_uri: redirectUri,
      state,
      scope: 'email,public_profile',
      response_type: 'code',
    });
    return `https://www.facebook.com/${FACEBOOK_GRAPH_VERSION}/dialog/oauth?${params.toString()}`;
  }

  async getFacebookProfile({ code, redirectUri }) {
    const appId = this.#requireEnv('FACEBOOK_APP_ID');
    const appSecret = this.#requireEnv('FACEBOOK_APP_SECRET');

    const tokenUrl = new URL(`https://graph.facebook.com/${FACEBOOK_GRAPH_VERSION}/oauth/access_token`);
    tokenUrl.search = new URLSearchParams({
      client_id: appId,
      client_secret: appSecret,
      redirect_uri: redirectUri,
      code,
    }).toString();

    const tokenResponse = await fetch(tokenUrl);
    const tokenPayload = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenPayload.access_token) {
      throw new AppError('Không thể xác thực Facebook Login', 401, 'FACEBOOK_TOKEN_EXCHANGE_FAILED');
    }

    const appAccessToken = `${appId}|${appSecret}`;
    const debugUrl = new URL('https://graph.facebook.com/debug_token');
    debugUrl.search = new URLSearchParams({
      input_token: tokenPayload.access_token,
      access_token: appAccessToken,
    }).toString();

    const debugResponse = await fetch(debugUrl);
    const debugPayload = await debugResponse.json();
    if (!debugResponse.ok || !debugPayload.data?.is_valid || String(debugPayload.data.app_id) !== String(appId)) {
      throw new AppError('Facebook token không hợp lệ', 401, 'FACEBOOK_TOKEN_INVALID');
    }

    const profileUrl = new URL(`https://graph.facebook.com/me`);
    profileUrl.search = new URLSearchParams({
      fields: 'id,name,email,picture.type(large)',
      access_token: tokenPayload.access_token,
    }).toString();

    const profileResponse = await fetch(profileUrl);
    const profile = await profileResponse.json();
    if (!profileResponse.ok || !profile.id) {
      throw new AppError('Không thể lấy thông tin người dùng từ Facebook', 401, 'FACEBOOK_PROFILE_FETCH_FAILED');
    }

    return {
      provider: 'facebook',
      providerUserId: String(profile.id),
      email: normalizeEmail(profile.email),
      fullName: profile.name || null,
      avatarUrl: profile.picture?.data?.url || null,
    };
  }

  buildAppleAuthorizationUrl({ state, redirectUri }) {
    const clientId = this.#requireEnv('APPLE_CLIENT_ID');
    const params = new URLSearchParams({
      response_type: 'code',
      response_mode: 'query',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'name email',
      state,
    });
    return `https://appleid.apple.com/auth/authorize?${params.toString()}`;
  }

  #buildAppleClientSecret() {
    const teamId = this.#requireEnv('APPLE_TEAM_ID');
    const keyId = this.#requireEnv('APPLE_KEY_ID');
    const clientId = this.#requireEnv('APPLE_CLIENT_ID');
    const privateKey = this.#requireEnv('APPLE_PRIVATE_KEY').replace(/\\n/g, '\n');

    return jwt.sign(
      {
        iss: teamId,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 60 * 5,
        aud: APPLE_ISSUER,
        sub: clientId,
      },
      privateKey,
      {
        algorithm: 'ES256',
        header: { alg: 'ES256', kid: keyId },
      }
    );
  }

  async #fetchAppleKeys() {
    if (this.#appleKeyCache.keys && Date.now() - this.#appleKeyCache.fetchedAt < 60 * 60 * 1000) {
      return this.#appleKeyCache.keys;
    }

    const response = await fetch(`${APPLE_ISSUER}/auth/keys`);
    const payload = await response.json();
    if (!response.ok || !Array.isArray(payload.keys)) {
      throw new AppError('Không thể lấy khóa xác thực Apple', 503, 'APPLE_KEYS_UNAVAILABLE');
    }

    this.#appleKeyCache = {
      keys: payload.keys,
      fetchedAt: Date.now(),
    };

    return payload.keys;
  }

  async #verifyAppleIdToken(idToken) {
    const clientId = this.#requireEnv('APPLE_CLIENT_ID');
    const decodedHeader = jwt.decode(idToken, { complete: true });
    if (!decodedHeader?.header?.kid) {
      throw new AppError('Apple identity token không hợp lệ', 401, 'APPLE_ID_TOKEN_INVALID');
    }

    const keys = await this.#fetchAppleKeys();
    const jwk = keys.find(key => key.kid === decodedHeader.header.kid);
    if (!jwk) {
      throw new AppError('Không tìm thấy khóa xác thực Apple phù hợp', 401, 'APPLE_KEY_NOT_FOUND');
    }

    const publicKey = crypto.createPublicKey({ key: jwk, format: 'jwk' });
    const claims = jwt.verify(idToken, publicKey, {
      algorithms: ['ES256'],
      issuer: APPLE_ISSUER,
      audience: clientId,
    });

    return claims;
  }

  async getAppleProfile({ code, idToken, redirectUri, user }) {
    let verifiedToken = idToken;

    if (code) {
      const tokenResponse = await fetch(`${APPLE_ISSUER}/auth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
          client_id: this.#requireEnv('APPLE_CLIENT_ID'),
          client_secret: this.#buildAppleClientSecret(),
        }),
      });

      const tokenPayload = await tokenResponse.json();
      if (!tokenResponse.ok || !tokenPayload.id_token) {
        throw new AppError('Không thể xác thực Apple ID', 401, 'APPLE_TOKEN_EXCHANGE_FAILED');
      }

      verifiedToken = tokenPayload.id_token;
    }

    if (!verifiedToken) {
      throw new AppError('Thiếu Apple identity token', 400, 'APPLE_ID_TOKEN_REQUIRED');
    }

    const claims = await this.#verifyAppleIdToken(verifiedToken);
    const profileName = user?.name
      ? [user.name.firstName, user.name.lastName].filter(Boolean).join(' ').trim()
      : null;
    const fallbackName = claims.email ? claims.email.split('@')[0] : 'Apple User';

    return {
      provider: 'apple',
      providerUserId: String(claims.sub),
      email: normalizeEmail(claims.email),
      fullName: profileName || claims.name || fallbackName,
      avatarUrl: null,
    };
  }
}

module.exports = OAuthService;
