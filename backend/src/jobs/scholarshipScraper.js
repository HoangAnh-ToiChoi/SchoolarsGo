'use strict';

const cron = require('node-cron');
const { main: runScraper } = require('../../scripts/scrape-multi');

let isRunning = false;

async function runJob() {
  if (isRunning) {
    console.log('[Scraper] Job đang chạy, bỏ qua lần này');
    return;
  }
  isRunning = true;
  console.log('[Scraper] Bắt đầu cào học bổng định kỳ...');
  try {
    const stats = await runScraper();
    console.log(`[Scraper] Hoàn tất — inserted: ${stats?.inserted ?? '?'}, skipped: ${stats?.skipped ?? '?'}`);
  } catch (e) {
    console.error('[Scraper] Lỗi:', e.message);
  } finally {
    isRunning = false;
  }
}

function startScrapeJob() {
  if (!process.env.GEMINI_API_KEY) {
    console.warn('[Scraper] GEMINI_API_KEY chưa có — bỏ qua cron job');
    return;
  }

  // Chạy mỗi Chủ nhật lúc 2:00 sáng
  cron.schedule('0 2 * * 0', () => {
    console.log('[Scraper] Cron trigger: Chủ nhật 2am');
    runJob();
  }, { timezone: 'Asia/Ho_Chi_Minh' });

  console.log('[Scraper] Cron job đã đăng ký — chạy mỗi Chủ nhật 2:00 SA (GMT+7)');
}

module.exports = { startScrapeJob, runJob };
