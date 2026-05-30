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
const authRoutes = require('./routes/auth.routes');
const scholarshipRoutes = require('./routes/scholarship.routes');
const profileRoutes = require('./routes/profile.routes');
const documentRoutes = require('./routes/document.routes');
const applicationRoutes = require('./routes/application.routes');
const savedRoutes = require('./routes/saved.routes');
const recommendRoutes = require('./routes/recommend.routes');
const adminRoutes = require('./routes/admin.routes');
const chatRoutes = require('./routes/chat.routes');

const app = express();

// ── Security & Middleware ──────────────────────────────
app.use(helmet());
const ALLOWED_ORIGINS = process.env.NODE_ENV === 'production'
  ? [process.env.FRONTEND_URL].filter(Boolean)
  : /^http:\/\/localhost:\d+$/;

app.use(
  cors({
    origin: ALLOWED_ORIGINS,
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

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
app.use('/api', apiLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/scholarships', scholarshipRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/saved', savedRoutes);
app.use('/api/recommend', recommendRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);

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
