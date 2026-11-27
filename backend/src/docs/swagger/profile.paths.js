import {
  BEARER_AUTH,
  DOCUMENT_TYPE,
  UNAUTHORIZED,
  envelope,
  jsonContent,
  jsonResponse,
  ref,
  uuidPathParam,
} from './shared.js';

const PROFILE_TAGS = ['Profile'];
const DOCUMENT_TAGS = ['Documents'];

const profilePaths = {
  '/api/profile': {
    get: {
      summary: 'Lấy profile user hiện tại',
      tags: PROFILE_TAGS,
      security: BEARER_AUTH,
      responses: {
        200: jsonResponse('Profile user', envelope(ref('Profile'))),
        401: UNAUTHORIZED,
      },
    },
    put: {
      summary: 'Cập nhật profile',
      tags: PROFILE_TAGS,
      security: BEARER_AUTH,
      requestBody: { content: jsonContent(ref('ProfileUpdate')) },
      responses: {
        200: { description: 'Cập nhật thành công' },
        401: UNAUTHORIZED,
      },
    },
  },
};

const uploadBody = {
  type: 'object',
  required: ['file', 'type'],
  properties: {
    file: { type: 'string', format: 'binary', description: 'File cần upload' },
    type: { ...DOCUMENT_TYPE, description: 'Loại document' },
  },
};

const documentPaths = {
  '/api/documents': {
    get: {
      summary: 'Danh sách documents của user',
      tags: DOCUMENT_TAGS,
      security: BEARER_AUTH,
      responses: {
        200: jsonResponse(
          'Danh sách documents',
          envelope({ type: 'array', items: ref('Document') })
        ),
        401: UNAUTHORIZED,
      },
    },
  },
  '/api/documents/upload': {
    post: {
      summary: 'Upload document',
      tags: DOCUMENT_TAGS,
      security: BEARER_AUTH,
      requestBody: {
        required: true,
        content: { 'multipart/form-data': { schema: uploadBody } },
      },
      responses: {
        201: { description: 'Upload thành công' },
        401: UNAUTHORIZED,
      },
    },
  },
  '/api/documents/{id}': {
    delete: {
      summary: 'Xóa document',
      tags: DOCUMENT_TAGS,
      security: BEARER_AUTH,
      parameters: [uuidPathParam('id')],
      responses: {
        200: { description: 'Xóa thành công' },
        401: UNAUTHORIZED,
        404: { description: 'Document không tồn tại' },
      },
    },
  },
};

export { profilePaths, documentPaths };
