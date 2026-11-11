/**
 * Kéo học bổng từ các nguồn bên ngoài (module src/ingestion).
 *
 * Cách dùng (trong backend/):
 *   node scripts/ingest.js --env=.env.cloud --allow-remote --dry-run          -- chạy thử tất cả nguồn, không ghi DB
 *   node scripts/ingest.js --env=.env.cloud --allow-remote --source=scholars4dev --dry-run
 *   node scripts/ingest.js --env=.env.cloud --allow-remote                    -- kéo thật
 *
 * Tuỳ chọn:
 *   --source=a,b    chỉ chạy các nguồn này (mặc định: tất cả)
 *   --limit=N       mỗi nguồn chỉ lấy tối đa N bài (để thử nhanh)
 *   --no-ai         không dùng Gemini (mặc định tự dùng khi có GEMINI_API_KEY)
 *   --verbose       in thêm ví dụ bài được nhận / bị loại
 *   --env=FILE      file .env (mặc định .env, tức DB local)
 *   --allow-remote  bắt buộc khi DB không phải localhost
 */

'use strict';

const path = require('path');

const argValue = (name) => (process.argv.find((a) => a.startsWith(`--${name}=`)) || '').split('=').slice(1).join('=');
const hasFlag = (name) => process.argv.includes(`--${name}`);

// Nạp .env gốc (chứa GEMINI_API_KEY...) rồi để --env (ví dụ .env.cloud) ghi đè các biến PG_*
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
if (argValue('env')) require('dotenv').config({ path: path.resolve(__dirname, '..', argValue('env')), override: true });

const db = require('../src/utils/db');
const { createIngestion, sourceNames } = require('../src/ingestion');

const { RULES: RULE_NAMES } = require('../src/ingestion/filter');

async function buildAiModel() {
  if (hasFlag('no-ai') || process.env.INGESTION_USE_AI === 'false') return null;
  if (!process.env.GEMINI_API_KEY) {
    console.warn('⚠️  Chưa có GEMINI_API_KEY nên chỉ dùng luật chữ (không có AI). Điền khoá vào backend/.env để bật.');
    return null;
  }
  console.log('🤖 Gemini bật: dùng để điền nước, bậc học, đơn vị cấp, hạn nộp còn thiếu.');
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY).getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-flash-lite-latest', generationConfig: { responseMimeType: 'application/json', temperature: 0 } });
}

function printResult(stats, verbose) {
  const rejected = Object.entries(stats.rejected)
    .map(([rule, n]) => `${rule} ${RULE_NAMES[rule]}: ${n}`)
    .join(' | ') || 'không có';
  console.log(`\n── ${stats.source} ${'─'.repeat(Math.max(0, 50 - stats.source.length))}`);
  if (stats.error) console.log(`   ❌ Lỗi: ${stats.error}`);
  console.log(`   Lấy về        : ${stats.fetched}`);
  console.log(`   Bị loại       : ${rejected}`);
  console.log(`   Trùng trong lượt: ${stats.duplicateInRun}`);
  console.log(`   Đạt           : ${stats.passed}`);
  console.log(`   ${stats.dryRun ? 'Sẽ thêm' : 'Đã thêm'}       : ${stats.inserted}   làm mới: ${stats.updated}   bỏ qua (đã có): ${stats.skipped}`);

  if (!verbose) return;
  console.log('   Ví dụ bài được nhận:');
  for (const row of stats.samples) {
    const deadline = row.deadline ? row.deadline.toISOString().slice(0, 10) : 'chưa rõ hạn';
    console.log(`     [${String(row.relevance_score).padStart(3)}] ${row.title.slice(0, 60)} | ${row.country} | ${row.degree} | ${deadline}`);
  }
  for (const [rule, titles] of Object.entries(stats.rejectedSamples)) {
    console.log(`   Ví dụ bị loại ${rule}:`);
    titles.forEach((t) => console.log(`     - ${t}`));
  }
}

async function main() {
  const host = process.env.PG_HOST || 'localhost';
  const dryRun = hasFlag('dry-run');
  if (!['localhost', '127.0.0.1'].includes(host) && !hasFlag('allow-remote')) {
    console.error(`❌ PG_HOST là "${host}", không phải localhost. Thêm --allow-remote nếu thật sự muốn.`);
    process.exit(1);
  }

  const only = argValue('source') ? argValue('source').split(',') : [];
  const limit = argValue('limit') ? Number(argValue('limit')) : Infinity;
  console.log(`🌐 Kéo học bổng → ${process.env.PG_DATABASE}@${host}  (nguồn: ${only.join(', ') || sourceNames().join(', ')})`);

  const ingestion = createIngestion({ db, aiModel: await buildAiModel(), logger: { info: console.log, warn: console.warn, error: console.error } });
  const results = await ingestion.run({ only, dryRun, limit });
  results.forEach((r) => printResult(r, hasFlag('verbose')));

  const total = results.reduce((acc, r) => ({ inserted: acc.inserted + r.inserted, updated: acc.updated + r.updated }), { inserted: 0, updated: 0 });
  console.log(`\n${dryRun ? '🔎 Chạy thử xong' : '✅ Xong'}. ${dryRun ? 'Sẽ thêm' : 'Đã thêm'} ${total.inserted}, làm mới ${total.updated}.`);
  if (results.some((r) => r.error)) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error('❌ Lỗi:', error.message);
    process.exitCode = 1;
  })
  .finally(() => db.pool?.end?.());
