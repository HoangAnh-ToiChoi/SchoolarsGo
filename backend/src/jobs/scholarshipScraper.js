'use strict';

const cron = require('node-cron');
const { ingestionService, sessionRepository } = require('../container');

const TIMEZONE = 'Asia/Ho_Chi_Minh';
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
    const count = await sessionRepository.deleteOld();
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

module.exports = { startScrapeJob, runJob, deactivateExpiredJob, deleteOldSessionsJob };
