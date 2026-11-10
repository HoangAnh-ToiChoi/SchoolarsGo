'use strict';

/**
 * Cửa vào duy nhất của module ingestion (kéo học bổng từ các nguồn bên ngoài).
 *
 * Module này không tự import DB, Gemini hay logger của ứng dụng. Nơi dùng truyền vào:
 *   - container.js (API server, cron job)
 *   - scripts/ingest.js (chạy tay)
 * Khi đổi cấu trúc thư mục backend, chỉ cần sửa hai nơi ráp nối trên.
 */

const IngestionService = require('./ingestionService');
const IngestionRepository = require('./store/ingestion.repository');
const ScholarshipWriter = require('./shared/scholarshipWriter');
const { createGeminiExtractor } = require('./shared/extract');
const { createSources, sourceNames } = require('./sources');

/**
 * @param {{
 *   db: { query: Function },
 *   logger?: import('./types').Logger,
 *   aiModel?: object | null,         model Gemini (có hàm generateContent). Không truyền = không dùng AI
 *   fetchImpl?: Function,            thay fetch (để test)
 *   now?: () => Date,
 * }} deps
 */
function createIngestion({ db, logger = console, aiModel = null, fetchImpl, now = () => new Date() }) {
  const store = new IngestionRepository(db);
  const writer = new ScholarshipWriter(store);
  const aiExtractor = createGeminiExtractor({ model: aiModel, logger, now });

  const service = new IngestionService({
    createSources: ({ only }) => createSources({ only, fetchImpl, now }),
    writer,
    store,
    aiExtractor,
    logger,
    now,
  });

  return { service, store, sourceNames };
}

module.exports = { createIngestion, sourceNames };
