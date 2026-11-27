import { JWT_MIN_DISTINCT_CHARS, JWT_SAMPLE_SECRET_PATTERN } from '~/constants/jwt.js';

/** Production không chạy với secret là chuỗi mẫu công khai hoặc quá dễ đoán (dev / test thì cho phép). */
function assertNotSampleSecret(name, secret) {
  if (JWT_SAMPLE_SECRET_PATTERN.test(secret)) {
    throw new Error(`${name} trông như chuỗi mẫu công khai, hãy tạo chuỗi ngẫu nhiên (openssl rand -hex 32)`);
  }
  const distinctChars = new Set(secret).size;
  if (distinctChars < JWT_MIN_DISTINCT_CHARS) {
    throw new Error(`${name} không đủ ngẫu nhiên, hãy tạo bằng openssl rand -hex 32`);
  }
}

const getAuthSecrets = (env = process.env) => {
  const { JWT_ACCESS_SECRET: accessSecret, JWT_REFRESH_SECRET: refreshSecret } = env;
  if (!accessSecret || accessSecret.length < 32) throw new Error('JWT_ACCESS_SECRET must contain at least 32 characters');
  if (!refreshSecret || refreshSecret.length < 32) throw new Error('JWT_REFRESH_SECRET must contain at least 32 characters');
  if (accessSecret === refreshSecret) throw new Error('JWT access and refresh secrets must be different');
  if (env.NODE_ENV === 'production') {
    assertNotSampleSecret('JWT_ACCESS_SECRET', accessSecret);
    assertNotSampleSecret('JWT_REFRESH_SECRET', refreshSecret);
  }
  return { accessSecret, refreshSecret };
};

const getCookieSameSite = () => process.env.COOKIE_SAME_SITE || 'lax';
const getTrustProxy = () => Number(process.env.TRUST_PROXY || 1);

const jwtConfig = {
  accessExpiresIn: '15m',
  refreshExpiresIn: '7d',
  algorithm: 'HS256',
};

export { getAuthSecrets, getCookieSameSite, getTrustProxy, jwtConfig };