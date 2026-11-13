const getAuthSecrets = (env = process.env) => {
  const { JWT_ACCESS_SECRET: accessSecret, JWT_REFRESH_SECRET: refreshSecret } = env;
  if (!accessSecret || accessSecret.length < 32) throw new Error('JWT_ACCESS_SECRET must contain at least 32 characters');
  if (!refreshSecret || refreshSecret.length < 32) throw new Error('JWT_REFRESH_SECRET must contain at least 32 characters');
  if (accessSecret === refreshSecret) throw new Error('JWT access and refresh secrets must be different');
  return { accessSecret, refreshSecret };
};

const getCookieSameSite = () => process.env.COOKIE_SAME_SITE || 'lax';
const getTrustProxy = () => Number(process.env.TRUST_PROXY || 1);

module.exports = { getAuthSecrets, getCookieSameSite, getTrustProxy };
