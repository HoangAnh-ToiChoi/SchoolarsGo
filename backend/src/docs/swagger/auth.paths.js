import {
  BEARER_AUTH,
  UNAUTHORIZED,
  envelope,
  jsonContent,
  jsonResponse,
  ref,
  uuidPathParam,
} from './shared.js';

const TAGS = ['Authentication'];
const SESSION_USER_BODY = envelope({ type: 'object', properties: { user: ref('SessionUser') } });

const registerBody = {
  type: 'object',
  required: ['email', 'password', 'full_name'],
  properties: {
    email: { type: 'string', format: 'email', example: 'user@example.com' },
    password: { type: 'string', minLength: 6, example: 'securePassword123' },
    full_name: { type: 'string', example: 'Nguyen Van A' },
  },
};

const loginBody = {
  type: 'object',
  required: ['email', 'password'],
  properties: {
    email: { type: 'string', format: 'email' },
    password: { type: 'string' },
  },
};

const authPaths = {
  '/api/auth/register': {
    post: {
      summary: 'Đăng ký tài khoản mới',
      tags: TAGS,
      requestBody: { required: true, content: jsonContent(registerBody) },
      responses: {
        201: jsonResponse('Đăng ký thành công', SESSION_USER_BODY),
        400: jsonResponse('Validation error', ref('Error')),
        409: { description: 'Email đã tồn tại' },
      },
    },
  },
  '/api/auth/login': {
    post: {
      summary: 'Đăng nhập',
      tags: TAGS,
      requestBody: { required: true, content: jsonContent(loginBody) },
      responses: {
        200: jsonResponse('Đăng nhập thành công', SESSION_USER_BODY),
        401: { description: 'Email hoặc password sai' },
      },
    },
  },
  '/api/auth/me': {
    get: {
      summary: 'Lấy thông tin user hiện tại',
      tags: TAGS,
      security: BEARER_AUTH,
      responses: {
        200: jsonResponse('Thông tin user', envelope(ref('SessionUser'))),
        401: UNAUTHORIZED,
      },
    },
  },
  '/api/auth/refresh': {
    post: {
      summary: 'Xoay access và refresh cookie',
      tags: TAGS,
      responses: {
        200: { description: 'Phiên được làm mới' },
        401: { description: 'Refresh token không hợp lệ hoặc đã hết hạn' },
      },
    },
  },
  '/api/auth/logout': {
    post: {
      summary: 'Thu hồi phiên hiện tại và xóa cookie',
      tags: TAGS,
      responses: { 200: { description: 'Đã đăng xuất' } },
    },
  },
  '/api/auth/account': {
    get: {
      summary: 'Lấy thông tin tài khoản riêng tư',
      tags: TAGS,
      security: BEARER_AUTH,
      responses: { 200: { description: 'Email, số điện thoại và ngày sinh' } },
    },
  },
  '/api/auth/sessions': {
    get: {
      summary: 'Danh sách tối đa ba thiết bị đăng nhập',
      tags: TAGS,
      security: BEARER_AUTH,
      responses: { 200: { description: 'Thiết bị và trạng thái hiện tại' } },
    },
  },
  '/api/auth/sessions/{id}': {
    delete: {
      summary: 'Thu hồi một thiết bị của người dùng hiện tại',
      tags: TAGS,
      security: BEARER_AUTH,
      parameters: [uuidPathParam('id')],
      responses: {
        200: { description: 'Thiết bị đã đăng xuất' },
        404: { description: 'Không tìm thấy thiết bị thuộc tài khoản này' },
      },
    },
  },
};

export { authPaths };
