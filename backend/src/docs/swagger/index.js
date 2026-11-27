// Đặc tả OpenAPI cho /api-docs (app.js). Mỗi nhóm route một file *.paths.js; mảnh dùng chung ở shared.js.
import swaggerJsdoc from 'swagger-jsdoc';

import { applicationPaths } from './applications.paths.js';
import { authPaths } from './auth.paths.js';
import { documentPaths, profilePaths } from './profile.paths.js';
import { recommendPaths } from './recommend.paths.js';
import { savedPaths, scholarshipPaths } from './scholarships.paths.js';
import { componentSchemas, scholarshipSchemas, userSchemas } from './schemas.js';
import { jsonResponse } from './shared.js';

const healthBody = {
  type: 'object',
  properties: {
    success: { type: 'boolean', example: true },
    message: { type: 'string' },
    timestamp: { type: 'string' },
  },
};

const systemPaths = {
  '/api/health': {
    get: {
      summary: 'Health check',
      tags: ['System'],
      responses: { 200: jsonResponse('API đang chạy', healthBody) },
    },
  },
};

const definition = {
  openapi: '3.1.0',
  info: {
    title: 'ScholarsGo API',
    version: '1.0.0',
    description:
      'ScholarsGo — Nền tảng tìm kiếm học bổng & quản lý hồ sơ du học cho sinh viên Việt Nam',
    contact: { name: 'ScholarsGo Team', email: 'team@scholarsgo.com' },
  },
  servers: [{ url: 'http://localhost:5000', description: 'Development Server' }],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Access token (15 phút) nhận được qua cookie hoặc `/api/auth/login`',
      },
    },
    schemas: componentSchemas,
  },
  // Thứ tự gộp = thứ tự nhóm hiển thị trên /api-docs
  paths: {
    ...systemPaths,
    ...authPaths,
    ...scholarshipPaths,
    ...profilePaths,
    ...documentPaths,
    ...applicationPaths,
    ...savedPaths,
    ...recommendPaths,
  },
  // Giữ đúng vị trí cũ ở gốc đặc tả (ngoài components) để bản tách không đổi nội dung /api-docs
  schemas: { ...userSchemas, ...scholarshipSchemas },
};

const swaggerSpec = swaggerJsdoc({ definition, apis: [] });

export { swaggerSpec };
