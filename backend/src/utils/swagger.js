const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.1.0',
    info: {
      title: 'ScholarsGo API',
      version: '1.0.0',
      description: 'ScholarsGo — Nền tảng tìm kiếm học bổng & quản lý hồ sơ du học cho sinh viên Việt Nam',
      contact: {
        name: 'ScholarsGo Team',
        email: 'team@scholarsgo.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development Server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token nhận được từ `/api/auth/login`',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Mô tả lỗi' },
            code: { type: 'integer', example: 400 },
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
      },
    },
    paths: {
      '/api/health': {
        get: {
          summary: 'Health check',
          tags: ['System'],
          responses: {
            200: {
              description: 'API đang chạy',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string' },
                      timestamp: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },

      // ─── Auth ─────────────────────────────────────────
      '/api/auth/register': {
        post: {
          summary: 'Đăng ký tài khoản mới',
          tags: ['Authentication'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password', 'full_name'],
                  properties: {
                    email: { type: 'string', format: 'email', example: 'user@example.com' },
                    password: { type: 'string', minLength: 6, example: 'securePassword123' },
                    full_name: { type: 'string', example: 'Nguyen Van A' },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: 'Đăng ký thành công',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'object',
                        properties: {
                          user: { $ref: '#/components/schemas/User' },
                          token: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
            400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            409: { description: 'Email đã tồn tại' },
          },
        },
      },

      '/api/auth/login': {
        post: {
          summary: 'Đăng nhập',
          tags: ['Authentication'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Đăng nhập thành công',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'object',
                        properties: {
                          user: { $ref: '#/components/schemas/User' },
                          token: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
            401: { description: 'Email hoặc password sai' },
          },
        },
      },

      '/api/auth/me': {
        get: {
          summary: 'Lấy thông tin user hiện tại',
          tags: ['Authentication'],
          security: [{ BearerAuth: [] }],
          responses: {
            200: {
              description: 'Thông tin user',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: { $ref: '#/components/schemas/User' },
                    },
                  },
                },
              },
            },
            401: { description: 'Chưa đăng nhập' },
          },
        },
      },

      // ─── Scholarships ─────────────────────────────────
      '/api/scholarships': {
        get: {
          summary: 'Danh sách học bổng (có filter)',
          tags: ['Scholarships'],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 50 } },
            { name: 'country', in: 'query', schema: { type: 'string' }, description: 'Lọc theo quốc gia' },
            { name: 'degree', in: 'query', schema: { type: 'string', enum: ['Bachelor', 'Master', 'PhD', 'Any'] } },
            { name: 'field', in: 'query', schema: { type: 'string' }, description: 'Ngành học' },
            { name: 'language', in: 'query', schema: { type: 'string' } },
            { name: 'min_gpa', in: 'query', schema: { type: 'number' } },
            { name: 'min_ielts', in: 'query', schema: { type: 'number' } },
            { name: 'deadline_from', in: 'query', schema: { type: 'string', format: 'date' } },
            { name: 'deadline_to', in: 'query', schema: { type: 'string', format: 'date' } },
            { name: 'amount_min', in: 'query', schema: { type: 'number' } },
            { name: 'coverage', in: 'query', schema: { type: 'string', enum: ['Full', 'Partial', 'Tuition', 'Stipend'] } },
            { name: 'featured', in: 'query', schema: { type: 'boolean' } },
            { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Tìm theo title/provider' },
          ],
          responses: {
            200: {
              description: 'Danh sách học bổng',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: { type: 'array', items: { $ref: '#/components/schemas/Scholarship' } },
                      meta: { $ref: '#/components/schemas/PaginationMeta' },
                    },
                  },
                },
              },
            },
          },
        },
      },

      '/api/scholarships/{id}': {
        get: {
          summary: 'Chi tiết một học bổng',
          tags: ['Scholarships'],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          responses: {
            200: {
              description: 'Chi tiết học bổng',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: { $ref: '#/components/schemas/ScholarshipDetail' },
                    },
                  },
                },
              },
            },
            404: { description: 'Không tìm thấy học bổng' },
          },
        },
      },

      // ─── Profile ───────────────────────────────────────
      '/api/profile': {
        get: {
          summary: 'Lấy profile user hiện tại',
          tags: ['Profile'],
          security: [{ BearerAuth: [] }],
          responses: {
            200: {
              description: 'Profile user',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: { $ref: '#/components/schemas/Profile' },
                    },
                  },
                },
              },
            },
            401: { description: 'Chưa đăng nhập' },
          },
        },
        put: {
          summary: 'Cập nhật profile',
          tags: ['Profile'],
          security: [{ BearerAuth: [] }],
          requestBody: {
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ProfileUpdate' },
              },
            },
          },
          responses: {
            200: { description: 'Cập nhật thành công' },
            401: { description: 'Chưa đăng nhập' },
          },
        },
      },

      // ─── Documents ─────────────────────────────────────
      '/api/documents': {
        get: {
          summary: 'Danh sách documents của user',
          tags: ['Documents'],
          security: [{ BearerAuth: [] }],
          responses: {
            200: {
              description: 'Danh sách documents',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: { type: 'array', items: { $ref: '#/components/schemas/Document' } },
                    },
                  },
                },
              },
            },
            401: { description: 'Chưa đăng nhập' },
          },
        },
      },

      '/api/documents/upload': {
        post: {
          summary: 'Upload document',
          tags: ['Documents'],
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  required: ['file', 'type'],
                  properties: {
                    file: { type: 'string', format: 'binary', description: 'File cần upload' },
                    type: {
                      type: 'string',
                      enum: ['cv', 'sop', 'transcript', 'recommendation_letter', 'other'],
                      description: 'Loại document',
                    },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Upload thành công' },
            401: { description: 'Chưa đăng nhập' },
          },
        },
      },

      '/api/documents/{id}': {
        delete: {
          summary: 'Xóa document',
          tags: ['Documents'],
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          responses: {
            200: { description: 'Xóa thành công' },
            401: { description: 'Chưa đăng nhập' },
            404: { description: 'Document không tồn tại' },
          },
        },
      },

      // ─── Applications ──────────────────────────────────
      '/api/applications': {
        get: {
          summary: 'Danh sách applications của user',
          tags: ['Applications'],
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['draft', 'submitted', 'under_review', 'interview', 'accepted', 'rejected', 'withdrawn'] } },
          ],
          responses: {
            200: {
              description: 'Danh sách applications',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: { type: 'array', items: { $ref: '#/components/schemas/Application' } },
                      meta: { $ref: '#/components/schemas/PaginationMeta' },
                    },
                  },
                },
              },
            },
            401: { description: 'Chưa đăng nhập' },
          },
        },
        post: {
          summary: 'Tạo application mới',
          tags: ['Applications'],
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['scholarship_id'],
                  properties: {
                    scholarship_id: { type: 'string', format: 'uuid' },
                    checklist: { type: 'array', items: { type: 'object', properties: { item: { type: 'string' }, done: { type: 'boolean' } } } },
                    notes: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Tạo thành công' },
            401: { description: 'Chưa đăng nhập' },
            409: { description: 'Đã ứng tuyển học bổng này rồi' },
          },
        },
      },

      '/api/applications/{id}': {
        get: {
          summary: 'Chi tiết application',
          tags: ['Applications'],
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          responses: {
            200: { description: 'Chi tiết application' },
            401: { description: 'Chưa đăng nhập' },
            404: { description: 'Không tìm thấy' },
          },
        },
        patch: {
          summary: 'Cập nhật application (partial)',
          tags: ['Applications'],
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', enum: ['draft', 'submitted', 'under_review', 'interview', 'accepted', 'rejected', 'withdrawn'] },
                    checklist: { type: 'array' },
                    notes: { type: 'string' },
                    applied_at: { type: 'string', format: 'date-time' },
                    result: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Cập nhật thành công' },
            401: { description: 'Chưa đăng nhập' },
            404: { description: 'Không tìm thấy' },
          },
        },
        delete: {
          summary: 'Xóa application',
          tags: ['Applications'],
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          responses: {
            200: { description: 'Xóa thành công' },
            401: { description: 'Chưa đăng nhập' },
            404: { description: 'Không tìm thấy' },
          },
        },
      },

      // ─── Saved Scholarships ─────────────────────────────
      '/api/saved': {
        get: {
          summary: 'Danh sách học bổng đã lưu',
          tags: ['Saved'],
          security: [{ BearerAuth: [] }],
          responses: {
            200: { description: 'Danh sách saved scholarships' },
            401: { description: 'Chưa đăng nhập' },
          },
        },
      },

      '/api/saved/{scholarshipId}': {
        post: {
          summary: 'Lưu học bổng',
          tags: ['Saved'],
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'scholarshipId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    note: { type: 'string', description: 'Ghi chú riêng' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Lưu thành công' },
            401: { description: 'Chưa đăng nhập' },
            409: { description: 'Đã lưu học bổng này rồi' },
          },
        },
        delete: {
          summary: 'Bỏ lưu học bổng',
          tags: ['Saved'],
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'scholarshipId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          responses: {
            200: { description: 'Bỏ lưu thành công' },
            401: { description: 'Chưa đăng nhập' },
            404: { description: 'Chưa lưu học bổng này' },
          },
        },
      },

      // ─── AI Recommender ────────────────────────────────
      '/api/recommend': {
        post: {
          summary: 'Gợi ý học bổng theo profile (AI hoặc rule-based)',
          tags: ['AI'],
          security: [{ BearerAuth: [] }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    top_n: { type: 'integer', default: 10, description: 'Số lượng gợi ý' },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Danh sách gợi ý',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            scholarship: { $ref: '#/components/schemas/Scholarship' },
                            match_score: { type: 'number', example: 0.92 },
                            reasons: { type: 'array', items: { type: 'string' } },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            401: { description: 'Chưa đăng nhập' },
          },
        },
      },
    },

    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          full_name: { type: 'string' },
          avatar_url: { type: 'string', nullable: true },
          phone: { type: 'string', nullable: true },
          date_of_birth: { type: 'string', format: 'date', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      Profile: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          user_id: { type: 'string', format: 'uuid' },
          bio: { type: 'string', nullable: true },
          gpa: { type: 'number', nullable: true },
          gpa_scale: { type: 'string', example: '4.0' },
          english_level: { type: 'string', nullable: true, example: 'IELTS 7.0' },
          target_country: { type: 'string', nullable: true },
          target_major: { type: 'string', nullable: true },
          target_degree: { type: 'string', nullable: true },
          target_intake: { type: 'string', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      ProfileUpdate: {
        type: 'object',
        properties: {
          bio: { type: 'string' },
          gpa: { type: 'number' },
          gpa_scale: { type: 'string' },
          english_level: { type: 'string' },
          target_country: { type: 'string' },
          target_major: { type: 'string' },
          target_degree: { type: 'string' },
          target_intake: { type: 'string' },
        },
      },
      Document: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          user_id: { type: 'string', format: 'uuid' },
          type: { type: 'string', enum: ['cv', 'sop', 'transcript', 'recommendation_letter', 'other'] },
          file_name: { type: 'string' },
          file_url: { type: 'string' },
          file_size: { type: 'integer' },
          mime_type: { type: 'string' },
          is_verified: { type: 'boolean' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      Scholarship: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string' },
          provider: { type: 'string' },
          country: { type: 'string' },
          degree: { type: 'string' },
          amount: { type: 'number', nullable: true },
          currency: { type: 'string' },
          deadline: { type: 'string', format: 'date-time' },
          language: { type: 'string', nullable: true },
          is_featured: { type: 'boolean' },
          is_active: { type: 'boolean' },
          image_url: { type: 'string', nullable: true },
        },
      },
      ScholarshipDetail: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string' },
          provider: { type: 'string' },
          country: { type: 'string' },
          city: { type: 'string', nullable: true },
          university: { type: 'string', nullable: true },
          degree: { type: 'string' },
          field_of_study: { type: 'string', nullable: true },
          amount: { type: 'number', nullable: true },
          currency: { type: 'string' },
          coverage: { type: 'string', nullable: true },
          deadline: { type: 'string', format: 'date-time' },
          intake: { type: 'string', nullable: true },
          language: { type: 'string', nullable: true },
          min_gpa: { type: 'number', nullable: true },
          min_ielts: { type: 'number', nullable: true },
          eligibility: { type: 'string', nullable: true },
          requirements: { type: 'string', nullable: true },
          benefits: { type: 'string', nullable: true },
          application_url: { type: 'string', nullable: true },
          image_url: { type: 'string', nullable: true },
          is_featured: { type: 'boolean' },
          is_active: { type: 'boolean' },
          source: { type: 'string', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
          is_saved: { type: 'boolean' },
        },
      },
      Application: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          scholarship_id: { type: 'string', format: 'uuid' },
          scholarship: { type: 'object', properties: { title: { type: 'string' }, country: { type: 'string' }, amount: { type: 'number' } } },
          status: { type: 'string', enum: ['draft', 'submitted', 'under_review', 'interview', 'accepted', 'rejected', 'withdrawn'] },
          applied_at: { type: 'string', format: 'date-time', nullable: true },
          notes: { type: 'string', nullable: true },
          checklist: { type: 'array', items: { type: 'object' } },
          documents_used: { type: 'array', items: { type: 'string' } },
          result: { type: 'string', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  apis: [],
};

const swaggerSpec = swaggerJsdoc(options);
module.exports = { swaggerSpec };
