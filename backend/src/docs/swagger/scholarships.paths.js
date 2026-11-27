import {
  BEARER_AUTH,
  PAGE_PARAM,
  UNAUTHORIZED,
  envelope,
  jsonContent,
  jsonResponse,
  limitParam,
  queryParam,
  ref,
  uuidPathParam,
} from './shared.js';

const SAVED_TAGS = ['Saved'];

const listFilters = [
  PAGE_PARAM,
  limitParam({ maximum: 50 }),
  queryParam('country', { type: 'string' }, 'Lọc theo quốc gia'),
  queryParam('degree', { type: 'string', enum: ['Bachelor', 'Master', 'PhD', 'Any'] }),
  queryParam('field', { type: 'string' }, 'Ngành học'),
  queryParam('language', { type: 'string' }),
  queryParam('min_gpa', { type: 'number' }),
  queryParam('min_ielts', { type: 'number' }),
  queryParam('deadline_from', { type: 'string', format: 'date' }),
  queryParam('deadline_to', { type: 'string', format: 'date' }),
  queryParam('amount_min', { type: 'number' }),
  queryParam('coverage', { type: 'string', enum: ['Full', 'Partial', 'Tuition', 'Stipend'] }),
  queryParam('featured', { type: 'boolean' }),
  queryParam('search', { type: 'string' }, 'Tìm theo title/provider'),
];

const scholarshipPaths = {
  '/api/scholarships': {
    get: {
      summary: 'Danh sách học bổng (có filter)',
      tags: ['Scholarships'],
      parameters: listFilters,
      responses: {
        200: jsonResponse(
          'Danh sách học bổng',
          envelope({ type: 'array', items: ref('Scholarship') }, ref('PaginationMeta'))
        ),
      },
    },
  },
  '/api/scholarships/{id}': {
    get: {
      summary: 'Chi tiết một học bổng',
      tags: ['Scholarships'],
      parameters: [uuidPathParam('id')],
      responses: {
        200: jsonResponse('Chi tiết học bổng', envelope(ref('ScholarshipDetail'))),
        404: { description: 'Không tìm thấy học bổng' },
      },
    },
  },
};

const noteBody = {
  type: 'object',
  properties: { note: { type: 'string', description: 'Ghi chú riêng' } },
};

const savedPaths = {
  '/api/saved': {
    get: {
      summary: 'Danh sách học bổng đã lưu',
      tags: SAVED_TAGS,
      security: BEARER_AUTH,
      responses: {
        200: { description: 'Danh sách saved scholarships' },
        401: UNAUTHORIZED,
      },
    },
  },
  '/api/saved/{scholarshipId}': {
    post: {
      summary: 'Lưu học bổng',
      tags: SAVED_TAGS,
      security: BEARER_AUTH,
      parameters: [uuidPathParam('scholarshipId')],
      requestBody: { content: jsonContent(noteBody) },
      responses: {
        201: { description: 'Lưu thành công' },
        401: UNAUTHORIZED,
        409: { description: 'Đã lưu học bổng này rồi' },
      },
    },
    delete: {
      summary: 'Bỏ lưu học bổng',
      tags: SAVED_TAGS,
      security: BEARER_AUTH,
      parameters: [uuidPathParam('scholarshipId')],
      responses: {
        200: { description: 'Bỏ lưu thành công' },
        401: UNAUTHORIZED,
        404: { description: 'Chưa lưu học bổng này' },
      },
    },
  },
};

export { scholarshipPaths, savedPaths };
