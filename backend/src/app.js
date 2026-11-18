require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
const swaggerUi = require('swagger-ui-express');

const { swaggerSpec } = require('./utils/swagger');
const { corsOrigin } = require('./config/cors.config');
const { getTrustProxy } = require('./config/jwt.config');
const { apiLimiter } = require('./middlewares/rateLimiter');
const checkOrigin = require('./middlewares/checkOrigin');
const errorHandler = require('./middlewares/errorHandler');
require('./config/database.config');
const routes = require('./routes');

const app = express();

app.set('trust proxy', getTrustProxy());
app.use(helmet());
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(checkOrigin);
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.get('/api/health', healthCheck);
app.use('/api', apiLimiter, routes);
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'ScholarsGo API Docs',
    swaggerOptions: { persistAuthorization: true },
  })
);

app.use(notFound);
app.use(errorHandler);

module.exports = app;

function healthCheck(req, res) {
  res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
}

function notFound(req, res) {
  res.status(404).json({ success: false, message: 'Endpoint not found', code: 404 });
}
