import cron from 'node-cron';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as db from '#configs/database.config.js';
import sessionModel from '#models/session.model.js';
import { createIngestion } from '#ingestion/index.js';

const TIMEZONE = 'Asia/Ho_Chi_Minh';

// Không có khóa Gemini hoặc tắt AI thì module kéo học bổng chạy bằng luật thuần
function createAiModel() {
  if (process.env.INGESTION_USE_AI === 'false' || !process.env.GEMINI_API_KEY) return null;
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY).getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-flash-lite-latest',
    generationConfig: { responseMimeType: 'application/json', temperature: 0 },
  });
}

const ingestionService = createIngestion({ db, aiModel: createAiModel() });
let isRunning = false;

/** Kéo học bổng từ tất cả nguồn (module src/ingestion). Không cho hai lượt chạy chồng nhau. */
async function runJob() {
  if (isRunning) {
    console.log('[Ingestion] Job đang chạy, bỏ qua lần này');
    return;
  }
  isRunning = true;
  console.log('[Ingestion] Bắt đầu kéo học bổng định kỳ...');
  try {
    const results = await ingestionService.run();
    for (const r of results) {
      console.log(`[Ingestion] ${r.source}: lấy ${r.fetched}, thêm ${r.inserted}, làm mới ${r.updated}, bỏ qua ${r.skipped}${r.error ? `, LỖI: ${r.error}` : ''}`);
    }
  } catch (e) {
    console.error('[Ingestion] Lỗi:', e.message);
  } finally {
    isRunning = false;
  }
}

/** Tắt (không xoá) học bổng đã quá hạn. */
async function deactivateExpiredJob() {
  try {
    const count = await ingestionService.deactivateExpired();
    console.log(`[Ingestion] Đã tắt ${count} học bổng quá hạn`);
  } catch (e) {
    console.error('[Ingestion] Lỗi khi tắt học bổng quá hạn:', e.message);
  }
}

async function deleteOldSessionsJob() {
  try {
    const count = await sessionModel.deleteOld();
    console.log(`[Auth] Đã dọn ${count} phiên đăng nhập cũ`);
  } catch (e) {
    console.error('[Auth] Lỗi khi dọn phiên đăng nhập:', e.message);
  }
}

function startScrapeJob() {
  // Chủ nhật 2:00 sáng: kéo học bổng mới
  cron.schedule('0 2 * * 0', () => {
    console.log('[Ingestion] Cron trigger: Chủ nhật 2am');
    runJob();
  }, { timezone: TIMEZONE });

  // Mỗi đêm 3:00 sáng: tắt học bổng quá hạn
  cron.schedule('0 3 * * *', deactivateExpiredJob, { timezone: TIMEZONE });
  cron.schedule('0 3 * * *', deleteOldSessionsJob, { timezone: TIMEZONE });

  console.log('[Ingestion] Cron đã đăng ký: kéo học bổng Chủ nhật 2:00, tắt học bổng quá hạn mỗi đêm 3:00 (GMT+7)');
}

export { startScrapeJob, runJob, deactivateExpiredJob, deleteOldSessionsJob };