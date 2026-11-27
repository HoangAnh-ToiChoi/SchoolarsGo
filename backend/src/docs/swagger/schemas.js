import { ADMIN_VALID_ROLES } from '~/constants/admin.js';

import {
  APPLICATION_STATUS,
  DATE_TIME,
  DOCUMENT_TYPE,
  NULLABLE_NUMBER,
  NULLABLE_STRING,
  UUID,
} from './shared.js';

const STRING = { type: 'string' };
const BOOLEAN = { type: 'boolean' };

// Hai schema mà response lỗi và danh sách phân trang ở mọi nhóm route cùng trỏ tới
const componentSchemas = {
  Error: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: false },
      message: { type: 'string', example: 'Mô tả lỗi' },
      code: { oneOf: [{ type: 'string' }, { type: 'integer' }], example: 'ACCESS_TOKEN_EXPIRED' },
    },
  },
  PaginationMeta: {
    type: 'object',
    properties: {
      page: { type: 'integer', example: 1 },
      limit: { type: 'integer', example: 20 },
      total: { type: 'integer', example: 500 },
      totalPages: { type: 'integer', example: 25 },
    },
  },
};

const userSchemas = {
  SessionUser: {
    type: 'object',
    properties: {
      id: UUID,
      full_name: STRING,
      avatar_url: NULLABLE_STRING,
      role: { type: 'string', enum: [...ADMIN_VALID_ROLES] },
    },
  },
  User: {
    type: 'object',
    properties: {
      id: UUID,
      email: { type: 'string', format: 'email' },
      full_name: STRING,
      avatar_url: NULLABLE_STRING,
      phone: NULLABLE_STRING,
      date_of_birth: { type: 'string', format: 'date', nullable: true },
      created_at: DATE_TIME,
    },
  },
  Profile: {
    type: 'object',
    properties: {
      id: UUID,
      user_id: UUID,
      bio: NULLABLE_STRING,
      gpa: NULLABLE_NUMBER,
      gpa_scale: { type: 'string', example: '4.0' },
      english_level: { type: 'string', nullable: true, example: 'IELTS 7.0' },
      target_country: NULLABLE_STRING,
      target_major: NULLABLE_STRING,
      target_degree: NULLABLE_STRING,
      target_intake: NULLABLE_STRING,
      created_at: DATE_TIME,
    },
  },
  ProfileUpdate: {
    type: 'object',
    properties: {
      bio: STRING,
      gpa: { type: 'number' },
      gpa_scale: STRING,
      english_level: STRING,
      target_country: STRING,
      target_major: STRING,
      target_degree: STRING,
      target_intake: STRING,
    },
  },
  Document: {
    type: 'object',
    properties: {
      id: UUID,
      user_id: UUID,
      type: DOCUMENT_TYPE,
      file_name: STRING,
      file_url: STRING,
      file_size: { type: 'integer' },
      mime_type: STRING,
      is_verified: BOOLEAN,
      created_at: DATE_TIME,
    },
  },
};

const scholarshipSchemas = {
  Scholarship: {
    type: 'object',
    properties: {
      id: UUID,
      title: STRING,
      provider: STRING,
      country: STRING,
      degree: STRING,
      amount: NULLABLE_NUMBER,
      currency: STRING,
      deadline: DATE_TIME,
      language: NULLABLE_STRING,
      is_featured: BOOLEAN,
      is_active: BOOLEAN,
      image_url: NULLABLE_STRING,
    },
  },
  ScholarshipDetail: {
    type: 'object',
    properties: {
      id: UUID,
      title: STRING,
      provider: STRING,
      country: STRING,
      city: NULLABLE_STRING,
      university: NULLABLE_STRING,
      degree: STRING,
      field_of_study: NULLABLE_STRING,
      amount: NULLABLE_NUMBER,
      currency: STRING,
      coverage: NULLABLE_STRING,
      deadline: DATE_TIME,
      intake: NULLABLE_STRING,
      language: NULLABLE_STRING,
      min_gpa: NULLABLE_NUMBER,
      min_ielts: NULLABLE_NUMBER,
      eligibility: NULLABLE_STRING,
      requirements: NULLABLE_STRING,
      benefits: NULLABLE_STRING,
      application_url: NULLABLE_STRING,
      image_url: NULLABLE_STRING,
      is_featured: BOOLEAN,
      is_active: BOOLEAN,
      source: NULLABLE_STRING,
      created_at: DATE_TIME,
      is_saved: BOOLEAN,
    },
  },
  Application: {
    type: 'object',
    properties: {
      id: UUID,
      scholarship_id: UUID,
      scholarship: {
        type: 'object',
        properties: { title: STRING, country: STRING, amount: { type: 'number' } },
      },
      status: APPLICATION_STATUS,
      applied_at: { ...DATE_TIME, nullable: true },
      notes: NULLABLE_STRING,
      checklist: { type: 'array', items: { type: 'object' } },
      documents_used: { type: 'array', items: STRING },
      result: NULLABLE_STRING,
      created_at: DATE_TIME,
      updated_at: DATE_TIME,
    },
  },
};

export { componentSchemas, userSchemas, scholarshipSchemas };
