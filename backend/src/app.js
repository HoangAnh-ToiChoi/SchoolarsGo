const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
const swaggerUi = require('swagger-ui-express');

const { swaggerSpec } = require('./utils/swagger');
const errorHandler = require('./middlewares/errorHandler');
const authRoutes = require('./routes/auth.routes');
const scholarshipRoutes = require('./routes/scholarship.routes');
const profileRoutes = require('./routes/profile.routes');
const documentRoutes = require('./routes/document.routes');
const applicationRoutes = require('./routes/application.routes');
const applicationV2Routes = require('./routes/application-v2.routes');
const savedRoutes = require('./routes/saved.routes');
const recommendRoutes = require('./routes/recommend.routes');

const app = express();

// ── Security & Middleware ──────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
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

// ── API Routes ─────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/scholarships', scholarshipRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/v2/applications', applicationV2Routes);
app.use('/api/saved', savedRoutes);
app.use('/api/recommend', recommendRoutes);

// ── Health Check ───────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'ScholarsGo API is running', timestamp: new Date().toISOString() });
});

// ── Swagger UI ─────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'ScholarsGo API Docs',
  swaggerOptions: { persistAuthorization: true },
}));

// ── 404 Handler ───────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint not found', code: 404 });
});

// ── Global Error Handler ───────────────────────────────
app.use(errorHandler);

module.exports = app;
