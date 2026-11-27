import {
  APPLICATION_STATUS,
  BEARER_AUTH,
  DATE_TIME,
  PAGE_PARAM,
  UNAUTHORIZED,
  UUID,
  envelope,
  jsonContent,
  jsonResponse,
  limitParam,
  queryParam,
  ref,
  uuidPathParam,
} from './shared.js';

const TAGS = ['Applications'];
const ID_PARAMS = [uuidPathParam('id')];
const NOT_FOUND = { description: 'Không tìm thấy' };

const createBody = {
  type: 'object',
  required: ['scholarship_id'],
  properties: {
    scholarship_id: UUID,
    checklist: {
      type: 'array',
      items: {
        type: 'object',
        properties: { item: { type: 'string' }, done: { type: 'boolean' } },
      },
    },
    notes: { type: 'string' },
  },
};

const patchBody = {
  type: 'object',
  properties: {
    status: APPLICATION_STATUS,
    checklist: { type: 'array' },
    notes: { type: 'string' },
    applied_at: DATE_TIME,
    result: { type: 'string' },
  },
};

const listResponse = envelope({ type: 'array', items: ref('Application') }, ref('PaginationMeta'));

const applicationPaths = {
  '/api/applications': {
    get: {
      summary: 'Danh sách applications của user',
      tags: TAGS,
      security: BEARER_AUTH,
      parameters: [PAGE_PARAM, limitParam(), queryParam('status', APPLICATION_STATUS)],
      responses: {
        200: jsonResponse('Danh sách applications', listResponse),
        401: UNAUTHORIZED,
      },
    },
    post: {
      summary: 'Tạo application mới',
      tags: TAGS,
      security: BEARER_AUTH,
      requestBody: { required: true, content: jsonContent(createBody) },
      responses: {
        201: { description: 'Tạo thành công' },
        401: UNAUTHORIZED,
        409: { description: 'Đã ứng tuyển học bổng này rồi' },
      },
    },
  },
  '/api/applications/{id}': {
    get: {
      summary: 'Chi tiết application',
      tags: TAGS,
      security: BEARER_AUTH,
      parameters: ID_PARAMS,
      responses: {
        200: { description: 'Chi tiết application' },
        401: UNAUTHORIZED,
        404: NOT_FOUND,
      },
    },
    patch: {
      summary: 'Cập nhật application (partial)',
      tags: TAGS,
      security: BEARER_AUTH,
      parameters: ID_PARAMS,
      requestBody: { content: jsonContent(patchBody) },
      responses: {
        200: { description: 'Cập nhật thành công' },
        401: UNAUTHORIZED,
        404: NOT_FOUND,
      },
    },
    delete: {
      summary: 'Xóa application',
      tags: TAGS,
      security: BEARER_AUTH,
      parameters: ID_PARAMS,
      responses: {
        200: { description: 'Xóa thành công' },
        401: UNAUTHORIZED,
        404: NOT_FOUND,
      },
    },
  },
};

export { applicationPaths };
