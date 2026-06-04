'use strict';

const cron = require('node-cron');
const { main: runScraper } = require('../../scripts/scrape-multi');
const logger = require('../utils/logger');

let isRunning = false;

async function runJob() {
  if (isRunning) {
    logger.info('Scraper job is already running, skipping this trigger');
    return;
  }
  isRunning = true;
  logger.info('Starting scheduled scholarship scrape');
  try {
    const stats = await runScraper();
    logger.info(
      { inserted: stats?.inserted, skipped: stats?.skipped },
      'Scheduled scholarship scrape completed'
    );
  } catch (e) {
    logger.error({ err: e }, 'Scheduled scholarship scrape failed');
  } finally {
    isRunning = false;
  }
}

function startScrapeJob() {
  if (!process.env.GEMINI_API_KEY) {
    logger.warn('GEMINI_API_KEY is missing, skipping scraper cron registration');
    return;
  }

  // Chạy mỗi Chủ nhật lúc 2:00 sáng
  cron.schedule('0 2 * * 0', () => {
    logger.info('Scholarship scraper cron triggered');
    runJob();
  }, { timezone: 'Asia/Ho_Chi_Minh' });

  logger.info('Scholarship scraper cron registered for Sunday 02:00 Asia/Ho_Chi_Minh');
}

module.exports = { startScrapeJob, runJob };
