const allowedOrigins = new Set((process.env.CORS_ORIGINS || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean));

const isAllowedOrigin = origin => Boolean(origin) && origin !== 'null' && allowedOrigins.has(origin);
const corsOrigin = (origin, callback) => callback(null, !origin || isAllowedOrigin(origin));

module.exports = { isAllowedOrigin, corsOrigin };
