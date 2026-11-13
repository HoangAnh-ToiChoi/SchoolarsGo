const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
const swaggerUi = require('swagger-ui-express');

const { swaggerSpec } = require('./utils/swagger');
const errorHandler = require('./middlewares/errorHandler');
const { apiLimiter } = require('./middlewares/rateLimiter');
const checkOrigin = require('./middlewares/checkOrigin');
const { corsOrigin } = require('./config/cors.config');
const { getTrustProxy } = require('./config/jwt.config');
const routes = require('./routes');

const app = express();
app.set('trust proxy', getTrustProxy());

// ── Security & Middleware ──────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(checkOrigin);

// Logging — chỉ log trong development
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ── Static Files ───────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Health Check ──────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
});

// ── API Routes ─────────────────────────────────────────
app.use('/api', apiLimiter, routes);

// ── Swagger UI ─────────────────────────────────────────
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'ScholarsGo API Docs',
    swaggerOptions: { persistAuthorization: true },
  })
);

// ── 404 Handler ───────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint not found', code: 404 });
});

// ── Global Error Handler ───────────────────────────────
app.use(errorHandler);

module.exports = app;
