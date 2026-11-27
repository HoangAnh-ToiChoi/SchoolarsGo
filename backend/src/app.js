import 'dotenv/config';

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import swaggerUi from 'swagger-ui-express';

import { swaggerSpec } from './utils/swagger.js';
import { corsOrigin } from './configs/cors.config.js';
import { getTrustProxy } from './configs/jwt.config.js';
import { apiLimiter } from './middlewares/rateLimiter.js';
import checkOrigin from './middlewares/checkOrigin.js';
import responseController from './controllers/response.controller.js';
import errorHandleController from './controllers/errorHandle.controller.js';
import healthController from './controllers/health.controller.js';
import './configs/database.config.js';
import routes from './routes/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.set('trust proxy', getTrustProxy());
app.use(responseController.attach);
app.use(helmet());
app.use(cors({ origin: corsOrigin, credentials: true }));
// File đi qua multipart (multer, có giới hạn riêng); JSON lớn nhất là ghi chú / checklist vài chục KB. 10MB cũ là chỗ làm cạn RAM
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  // Express 5: req.body là undefined khi request không có body
  req.body ??= {};
  next();
});
app.use(cookieParser());
app.use(checkOrigin);
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.get('/api/health', healthController.check);
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

app.use(errorHandleController.notFound);
app.use(errorHandleController.handle);

export default app;
