// Mảnh đặc tả dùng lại ở nhiều nhóm route: kiểu cột, vỏ response, tham số, phản hồi lỗi chung.
// swagger-jsdoc sao chép sâu toàn bộ đặc tả, nên dùng chung một object ở nhiều chỗ không sinh tham chiếu lặp.
import { APPLICATION_VALID_TRANSITIONS } from '~/constants/application.js';
import { DOCUMENT_VALID_TYPES } from '~/constants/document.js';

const BEARER_AUTH = [{ BearerAuth: [] }];

const UUID = { type: 'string', format: 'uuid' };
const DATE_TIME = { type: 'string', format: 'date-time' };
const NULLABLE_STRING = { type: 'string', nullable: true };
const NULLABLE_NUMBER = { type: 'number', nullable: true };

// Enum lấy từ hằng số nghiệp vụ để tài liệu không lệch khi thêm trạng thái / loại mới
const APPLICATION_STATUS = { type: 'string', enum: Object.keys(APPLICATION_VALID_TRANSITIONS) };
const DOCUMENT_TYPE = { type: 'string', enum: [...DOCUMENT_VALID_TYPES] };

const UNAUTHORIZED = { description: 'Chưa đăng nhập' };
const PAGE_PARAM = { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } };

function ref(name) {
  return { $ref: `#/components/schemas/${name}` };
}

function jsonContent(schema) {
  return { 'application/json': { schema } };
}

/** Phản hồi có thân JSON. */
function jsonResponse(description, schema) {
  return { description, content: jsonContent(schema) };
}

/** Vỏ thành công chuẩn `{ success, data, meta? }` của res.success. */
function envelope(data, meta) {
  const properties = { success: { type: 'boolean' }, data };
  if (meta) properties.meta = meta;
  return { type: 'object', properties };
}

function uuidPathParam(name) {
  return { name, in: 'path', required: true, schema: UUID };
}

function queryParam(name, schema, description) {
  const param = { name, in: 'query', schema };
  if (description) param.description = description;
  return param;
}

function limitParam(extra = {}) {
  return queryParam('limit', { type: 'integer', default: 20, ...extra });
}

export {
  BEARER_AUTH,
  UUID,
  DATE_TIME,
  NULLABLE_STRING,
  NULLABLE_NUMBER,
  APPLICATION_STATUS,
  DOCUMENT_TYPE,
  UNAUTHORIZED,
  PAGE_PARAM,
  ref,
  jsonContent,
  jsonResponse,
  envelope,
  uuidPathParam,
  queryParam,
  limitParam,
};
