'use strict';

/**
 * Các kiểu dữ liệu dùng chung trong module ingestion (chỉ là JSDoc, không có code chạy).
 *
 * Luồng dữ liệu của một bài viết:
 *   nguồn → RawPost → Facts (trích xuất) → Score → Row (ghi vào DB)
 *
 * Module này KHÔNG import gì từ phần còn lại của ứng dụng. Mọi thứ bên ngoài (DB, Gemini,
 * logger) được truyền vào qua createIngestion(). Nhờ vậy đợt tái cấu trúc thư mục sau này
 * chỉ cần sửa chỗ ráp nối (container.js và scripts/ingest.js).
 */

/**
 * Bài viết thô, mọi nguồn đều trả ra đúng dạng này.
 * @typedef {object} RawPost
 * @property {string}   sourceName   tên nguồn, trùng tên folder trong sources/
 * @property {number}   priority     ưu tiên nguồn, số nhỏ thắng khi trùng học bổng
 * @property {string}   externalId   id bài trong hệ thống của nguồn
 * @property {string}   title        tiêu đề đã bỏ HTML
 * @property {string}   link         link bài đăng gốc
 * @property {Date}     publishedAt  ngày đăng
 * @property {string}   excerpt      đoạn tóm tắt
 * @property {string}   contentText  toàn bộ nội dung dạng chữ thuần
 * @property {string[]} categories   slug chuyên mục của nguồn
 * @property {string[]} signals      gợi ý nguồn gắn thêm, dạng "region:southeastAsia", "degree:Master", "country:Japan"
 */

/**
 * Thông tin trích xuất được từ bài viết.
 * @typedef {object} Facts
 * @property {Date|null}   deadline
 * @property {string}      degree        'Bachelor' | 'Master' | 'PhD' | 'Any'
 * @property {boolean}     degreeKnown
 * @property {string|null} country       nước đến học
 * @property {string|null} provider
 * @property {string|null} coverage      'Full' | 'Partial' | 'Tuition Only'
 * @property {string}      language
 * @property {number|null} minGpa        thang 4
 * @property {number|null} minIelts
 */

/**
 * Kết quả kiểm tra một luật lọc.
 * @typedef {{ ok: true } | { ok: false, rule: string, reason: string }} RuleResult
 */

/**
 * Nguồn dữ liệu (port). Mỗi folder trong sources/ tạo ra một đối tượng như vậy.
 * @typedef {object} Source
 * @property {string} name
 * @property {number} priority
 * @property {(opts: { limit?: number }) => AsyncIterable<RawPost>} fetchPosts
 */

/**
 * Nơi lưu (port). Cài đặt hiện tại: store/ingestion.repository.js (PostgreSQL).
 * @typedef {object} IngestionStore
 * @property {(args: { dedupKeys: string[], sourceUrls: string[] }) => Promise<Array<{ id: string, dedup_key: string|null, source_url: string|null }>>} findExisting
 * @property {(rows: object[]) => Promise<number>} insertMany
 * @property {(rows: object[]) => Promise<number>} updateMany
 * @property {(run: object) => Promise<void>} recordRun
 * @property {() => Promise<number>} deactivateExpired
 */

/**
 * Logger tối thiểu.
 * @typedef {{ info: Function, warn: Function, error: Function }} Logger
 */

module.exports = {};
