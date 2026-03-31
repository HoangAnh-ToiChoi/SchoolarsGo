/**
 * ScholarsGo — Cloud Seed Script
 * Cào học bổng từ scholars4dev.com (RSS → axios+cheerio fallback)
 * và seed vào Supabase Cloud.
 *
 * Chạy:
 *   node scripts/seed-cloud.js
 *
 * Tuỳ chọn:
 *   node scripts/seed-cloud.js --dry-run    → quét không lưu DB
 *   node scripts/seed-cloud.js --limit=20   → giới hạn số bản ghi quét
 *
 * Lưu ý:
 *  - Kết nối DB dùng @supabase/supabase-js (hỗ trợ IPv4/IPv6 tự động).
 *  - Biến SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY trong .env là bắt buộc.
 *  - INSERT dùng upsert (onConflict: 'title', ignoreDuplicates: true) chống trùng lặp.
 *  - Bảo vệ mạng: delay 1–2s giữa mỗi lần quét.
 *  - Script tự process.exit(0) khi hoàn tất.
 */

'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

// ── Supabase JS client (hỗ trợ IPv4/IPv6 tự động — không như pg) ─
let supabase;
function getSupabase() {
  if (supabase) return supabase;
  const { createClient } = require('@supabase/supabase-js');
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key  = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error('❌ Thiếu biến môi trường: SUPABASE_URL và SUPABASE_SERVICE_ROLE_KEY bắt buộc trong .env');
    console.error('   Thêm vào backend/.env:');
    console.error('   SUPABASE_URL=https://mthxqvnukejvjadldwob.supabase.co');
    console.error('   SUPABASE_SERVICE_ROLE_KEY=<key từ Supabase Dashboard → Settings → API → service_role secret>');
    process.exit(1);
  }

  // Chuẩn hoá URL (bỏ trailing slash)
  const cleanUrl = url.replace(/\/$/, '');
  supabase = createClient(cleanUrl, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return supabase;
}

// ── CLI arguments ──────────────────────────────────────────────────
const args = process.argv.slice(2);
const MODE_DRY_RUN = args.includes('--dry-run');
const limitArg = args.find((a) => a.startsWith('--limit='));
const SCRAPE_LIMIT = limitArg ? parseInt(limitArg.split('=')[1], 10) : 100;

// ── Helper: sleep ────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const delay = () => sleep(1000 + Math.floor(Math.random() * 1000)); // 1–2s random

// ── Helper: random ──────────────────────────────────────────────
const randFloat = (min, max, dec = 2) =>
  parseFloat((Math.random() * (max - min) + min).toFixed(dec));

// ═══════════════════════════════════════════════════════════════
// SECTION 1 — DATABASE CONNECTION VERIFY
// ═══════════════════════════════════════════════════════════════

async function verifyConnection() {
  console.log('────────────────────────────────────────────');
  console.log('  ScholarsGo Cloud Seed — Supabase Cloud');
  console.log('────────────────────────────────────────────\n');

  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '').replace(/\/$/, '');
  console.log(`📡 Supabase : ${supabaseUrl}`);

  if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
    console.error('❌ SUPABASE_URL không hợp lệ trong .env');
    console.error('   Giá trị hiện tại: "' + supabaseUrl + '"');
    process.exit(1);
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Thiếu SUPABASE_SERVICE_ROLE_KEY trong .env');
    console.error('   Lấy key tại: Supabase Dashboard → Settings → API → service_role secret');
    process.exit(1);
  }

  console.log('✅ Cấu hình Supabase đầy đủ\n');

  const sb = getSupabase();

  try {
    // Test: đếm scholarships hiện tại
    const { data, error, count } = await sb
      .from('scholarships')
      .select('id', { count: 'exact', head: true });

    if (error) throw error;

    console.log(`   Supabase REST: ✅ Kết nối OK`);
    console.log(`   Project URL  : ${supabaseUrl}`);
    console.log(`   Học bổng hiện tại: ${count ?? 0}\n`);
  } catch (err) {
    console.error(`\n❌ KẾT NỐI SUPABASE THẤT BẠI: ${err.message}`);
    console.error('\n   Nguyên nhân thường gặp:');
    console.error('   1. Chưa thêm SUPABASE_SERVICE_ROLE_KEY vào .env');
    console.error('      Lấy tại: Supabase Dashboard → Settings → API → service_role secret');
    console.error('');
    console.error('   2. Bảng scholarships chưa tồn tại → chạy migration database.sql trước');
    console.error('');
    console.error('   3. RLS policy chặn truy cập → kiểm tra policies trên bảng scholarships');
    console.error('');
    console.error('   4. IP của bạn chưa whitelist trong Supabase Dashboard → Network');
    console.error('');
    process.exit(1);
  }
}

// ═══════════════════════════════════════════════════════════════
// SECTION 2 — DEADLINE PARSER
// ═══════════════════════════════════════════════════════════════

function parseDeadline(raw) {
  if (!raw) return null;

  const str = raw.trim().toLowerCase();
  const skip = ['varies', 'open', 'year-round', 'ongoing', 'check website',
                'contact us', 'tba', 'tbd', 'no deadline'];

  if (skip.some((v) => str.includes(v))) {
    // Fallback: 4 tháng tới, ngày 15
    const d = new Date();
    d.setMonth(d.getMonth() + 4);
    d.setDate(15);
    return d.toISOString();
  }

  const monthMap = {
    january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
    july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
  };

  const patterns = [
    [/^(\d{1,2})\s+([a-z]+)\s+(\d{4})$/i,        (m) => [+m[1], monthMap[m[2].toLowerCase()] ?? -1, +m[3]]],
    [/^([a-z]+)\s+(\d{1,2}),?\s+(\d{4})$/i,     (m) => [monthMap[m[1].toLowerCase()] ?? -1, +m[2], +m[3]]],
    [/^([a-z]+)\s+(\d{4})$/i,                    (m) => [monthMap[m[1].toLowerCase()] ?? -1, 15, +m[2]]],
    [/^(\d{4})-(\d{2})-(\d{2})$/,                (m) => [+m[3], +m[2] - 1, +m[1]]],
    [/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,        (m) => [+m[1] > 12 ? +m[1] : +m[2], +m[1] > 12 ? +m[2] - 1 : +m[1] - 1, +m[3]]],
  ];

  for (const [regex, extractor] of patterns) {
    const m = str.match(regex);
    if (m) {
      let [month, day, year] = extractor(m);
      if (month < 0 || month > 11 || year < 2020) continue;
      const d = new Date(year, month, Math.min(day, 28));
      if (d <= new Date()) d.setFullYear(d.getFullYear() + 1);
      return d.toISOString();
    }
  }

  // Fallback
  const fb = new Date();
  fb.setMonth(fb.getMonth() + 3);
  fb.setDate(15);
  return fb.toISOString();
}

// ═══════════════════════════════════════════════════════════════
// SECTION 3 — DEGREE MAPPER
// ═══════════════════════════════════════════════════════════════

function mapDegree(raw) {
  if (!raw) return 'Any';
  const s = raw.toLowerCase();
  if (s.includes('bachelor') || s.includes('undergraduate')) return 'Bachelor';
  if (s.includes('phd') || s.includes('doctoral')) return 'PhD';
  if (s.includes('master') && !s.includes('phd')) return 'Master';
  return 'Any';
}

// ═══════════════════════════════════════════════════════════════
// SECTION 4 — RSS PARSER (ưu tiên)
// ═══════════════════════════════════════════════════════════════

async function tryRSSFeeds() {
  let rssParser;
  try {
    rssParser = require('rss-parser');
  } catch (_) {
    return null; // rss-parser chưa cài → skip
  }

  // scholars4dev có RSS feed chính và category feeds
  const feeds = [
    'https://www.scholars4dev.com/feed/',
    'https://www.scholars4dev.com/category/masters-scholarships/feed/',
    'https://www.scholars4dev.com/category/phd-scholarships/feed/',
    'https://www.scholars4dev.com/category/fully-funded-scholarships/feed/',
  ];

  const scholarships = [];
  const seen = new Set();

  for (const feedUrl of feeds) {
    console.log(`📡 [RSS] Fetching: ${feedUrl}`);
    try {
      const parser = new rssParser({
        timeout: 10000,
        headers: { 'User-Agent': 'ScholarsGo/1.0 (+https://scholarsgo.app)' },
      });
      const feed = await parser.parseURL(feedUrl);

      console.log(`   → Found ${feed.items.length} items in feed`);

      for (const item of feed.items) {
        const key = (item.title || '').toLowerCase().replace(/\s+/g, ' ').trim();
        if (seen.has(key)) continue;
        seen.add(key);

        const rawDeadline = item.pubDate || item.isoDate || null;
        const deadline = parseDeadline(rawDeadline);

        scholarships.push({
          title:           (item.title || '').replace(/<\/?[^>]+(>|$)/g, '').trim(),
          provider:        'Various Institutions',
          country:         'Multiple Countries',
          city:            null,
          university:      null,
          degree:          mapDegree(item.title || ''),
          field_of_study:  null,
          amount:          null,
          currency:        'USD',
          coverage:        null,
          deadline,
          intake:          null,
          language:        null,
          min_gpa:         null,
          min_ielts:       null,
          eligibility:     null,
          requirements:    null,
          benefits:        item.contentSnippet || null,
          application_url: item.link || null,
          image_url:       null,
          is_featured:     false,
          is_active:       deadline ? new Date(deadline) > new Date() : true,
          source:          'scholars4dev',
        });
      }

      await delay();
    } catch (err) {
      console.warn(`   ⚠️  RSS failed (${feedUrl}): ${err.message}`);
    }
  }

  return scholarships.length > 0 ? scholarships : null;
}

// ═══════════════════════════════════════════════════════════════
// SECTION 5 — SCRAPER (fallback axios + cheerio)
// ═══════════════════════════════════════════════════════════════

async function scrapeScholars4Dev() {
  let axios, cheerio;
  try {
    axios   = require('axios');
    cheerio = require('cheerio');
  } catch (_) {
    console.error('❌ axios hoặc cheerio chưa được cài. Chạy: npm install axios cheerio');
    process.exit(1);
  }

  const CATEGORIES = [
    'https://www.scholars4dev.com/category/masters-scholarships/',
    'https://www.scholars4dev.com/category/phd-scholarships/',
    'https://www.scholars4dev.com/category/fully-funded-scholarships/',
    'https://www.scholars4dev.com/category/bachelors-scholarships/',
    'https://www.scholars4dev.com/',
  ];

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  };

  const allScholarships = [];
  const seen = new Set();
  let pageCount = 0;

  for (const categoryUrl of CATEGORIES) {
    if (allScholarships.length >= SCRAPE_LIMIT) break;

    pageCount++;
    console.log(`\n📄 [${pageCount}/${CATEGORIES.length}] Scraping: ${categoryUrl}`);
    await delay();

    let listings;
    try {
      const res = await axios.get(categoryUrl, { headers, timeout: 20000 });
      const $ = cheerio.load(res.data);

      // Tìm tất cả link trỏ đến scholarship detail page
      const links = new Map();
      $('a[href]').each((_, el) => {
        const href = $(el).attr('href') || '';
        const text  = $(el).text().replace(/\s+/g, ' ').trim();

        // Link pattern: /NXXX/ hoặc chứa /scholarship/
        const isDetail =
          (href.match(/\/\d+\//) || href.match(/\/scholarship\//i)) &&
          text.length > 10 &&
          text.length < 250 &&
          !text.toLowerCase().includes('category') &&
          !text.toLowerCase().includes('home') &&
          !href.includes('scholars4dev.com/comments');

        if (isDetail) {
          const fullUrl = href.startsWith('http') ? href : `https://www.scholars4dev.com${href}`;
          links.set(fullUrl, text);
        }
      });

      listings = Array.from(links.entries());
      console.log(`   → Found ${listings.length} listing links`);
    } catch (err) {
      console.warn(`   ❌ Fetch category failed: ${err.message}`);
      continue;
    }

    // Quét từng detail page
    let itemCount = 0;
    for (const [detailUrl, title] of listings) {
      if (allScholarships.length >= SCRAPE_LIMIT) break;
      itemCount++;

      console.log(`   [${itemCount}/${listings.length}] ↗  ${title.substring(0, 60)}…`);

      let provider = null, degree = null, deadline = null, country = null;
      let field = null, benefits = null, applicationUrl = null, imageUrl = null;

      try {
        await delay();

        const res2 = await axios.get(detailUrl, { headers, timeout: 20000 });
        const $$   = cheerio.load(res2.data);

        // Trích xuất metadata từ page text
        $$('p, li, span, td').each((_, el) => {
          const text  = $$(el).text().replace(/\s+/g, ' ').trim();
          const lower = text.toLowerCase();

          if (!provider  && (lower.includes('provider')   || lower.includes('sponsor')    || lower.includes('host institution'))) {
            provider = text.replace(/^(provider|sponsor|host institution|provided by):\s*/i, '').substring(0, 255);
          }
          if (!deadline && (lower.includes('deadline')   || lower.includes('apply by')    || lower.includes('closes'))) {
            deadline = text.replace(/^(deadline|application deadline|apply by|closes):\s*/i, '').trim();
          }
          if (!degree   && (lower.includes('degree')      || lower.includes('study level') || lower.includes('level:'))) {
            degree = text.replace(/^(degree|study level|level):\s*/i, '').trim();
          }
          if (!country  && (lower.includes('study in')    || lower.includes('country:')   || lower.includes('destination:'))) {
            country = text.replace(/^(study in|country|destination):\s*/i, '').split(/[,/]/)[0].trim();
          }
          if (!field    && (lower.includes('field of study') || lower.includes('subject:') || lower.includes('major:'))) {
            field = text.replace(/^(field of study|subject|major):\s*/i, '').trim();
          }
          if (!benefits && (lower.includes('benefit') || lower.includes('coverage') || lower.includes('award'))) {
            benefits = text.replace(/^(benefits?|coverage|award):\s*/i, '').trim();
          }
        });

        // Trích xuất bảng thông tin (table, ul)
        $$('table, ul').each((_, el) => {
          const tableText = $$(el).text().toLowerCase();
          $$(el).find('tr, li').each((_, row) => {
            const rowText = $$(row).text().replace(/\s+/g, ' ').trim();
            const rLower  = rowText.toLowerCase();
            if (rLower.includes('deadline') && !deadline)  deadline  = rowText.replace(/deadline:?\s*/i, '').trim();
            if (rLower.includes('degree')   && !degree)    degree    = rowText.replace(/degree:?\s*/i, '').trim();
            if (rLower.includes('study in') && !country)   country   = rowText.replace(/study in:?\s*/i, '').split(/[,/]/)[0].trim();
            if ((rLower.includes('field') || rLower.includes('subject')) && !field) field = rowText.replace(/field of study:|subject:?\s*/i, '').trim();
            if ((rLower.includes('benefit') || rLower.includes('coverage')) && !benefits) benefits = rowText.replace(/benefits?:?|coverage:?|award:?\s*/i, '').trim();
          });
        });

        // Trích xuất link nộp đơn
        $$('a[href]').each((_, el) => {
          if (applicationUrl) return;
          const href = $$(el).attr('href') || '';
          const text  = $$(el).text().toLowerCase();
          const applySignal = text.includes('apply') || text.includes('official') || text.includes('learn more');
          const external    = href.startsWith('http') && !href.includes('scholars4dev');
          if (applySignal && external) applicationUrl = href;
        });

        // Trích xuất image
        imageUrl = $$('meta[property="og:image"]').attr('content') || null;

      } catch (err) {
        console.warn(`      ⚠️  Detail page error: ${err.message}`);
      }

      // Kiểm tra trùng title
      const titleKey = title.toLowerCase().replace(/\s+/g, ' ').trim();
      if (seen.has(titleKey)) {
        console.log(`      ⏭  Skip (duplicate: "${title.substring(0, 50)}…")`);
        continue;
      }
      seen.add(titleKey);

      // Parse deadline
      const parsedDeadline = parseDeadline(deadline);
      const isActive = parsedDeadline ? new Date(parsedDeadline) > new Date() : true;

      allScholarships.push({
        title:           title.substring(0, 498),
        provider:        provider || 'Various Institutions',
        country:         country  || 'Multiple Countries',
        city:            null,
        university:      null,
        degree:          mapDegree(degree),
        field_of_study:  field    || null,
        amount:          null,
        currency:        'USD',
        coverage:        null,
        deadline:        parsedDeadline,
        intake:          null,
        language:        null,
        min_gpa:         null,
        min_ielts:       null,
        eligibility:     null,
        requirements:    null,
        benefits:        benefits || null,
        application_url: applicationUrl || null,
        image_url:       imageUrl || null,
        is_featured:     false,
        is_active:       isActive,
        source:          'scholars4dev',
      });

      // Progress: mỗi 10 items
      if (allScholarships.length % 10 === 0) {
        console.log(`\n   ⏳ Đã quét ${allScholarships.length} học bổng…`);
      }
    }
  }

  return allScholarships.slice(0, SCRAPE_LIMIT);
}

// Truncate trường VARCHAR để khớp giới hạn cột trong DB
function normalizeForDB(item) {
  // deadline NOT NULL → set mặc định 1 năm sau nếu thiếu
  const defaultDeadline = new Date();
  defaultDeadline.setFullYear(defaultDeadline.getFullYear() + 1);

  return {
    ...item,
    title:          item.title          ? String(item.title).substring(0, 500) : '',
    provider:       item.provider       ? String(item.provider).substring(0, 255) : '',
    country:        item.country        ? String(item.country).substring(0, 255) : '',
    city:           item.city           ? String(item.city).substring(0, 255) : null,
    university:     item.university     ? String(item.university).substring(0, 255) : null,
    degree:         item.degree         ? String(item.degree).substring(0, 50) : '',
    field_of_study: item.field_of_study ? String(item.field_of_study).substring(0, 255) : null,
    currency:       item.currency       ? String(item.currency).substring(0, 10) : 'USD',
    coverage:       item.coverage       ? String(item.coverage).substring(0, 255) : null,
    intake:         item.intake         ? String(item.intake).substring(0, 50) : null,
    language:       item.language       ? String(item.language).substring(0, 50) : null,
    deadline:       item.deadline       ? new Date(item.deadline) : defaultDeadline,
    application_url: item.application_url ? String(item.application_url).substring(0, 2048) : null,
    image_url:      item.image_url      ? String(item.image_url).substring(0, 2048) : null,
    source:         'scholars4dev',
  };
}

// ═══════════════════════════════════════════════════════════════
// SECTION 6 — INSERT (ON CONFLICT DO NOTHING via Supabase SDK)
// ═══════════════════════════════════════════════════════════════

async function insertBatch(items) {
  if (items.length === 0) return { inserted: 0, skipped: 0, errors: [] };

  const BATCH = 50;
  let inserted = 0;
  let skipped  = 0;
  const errors = [];
  const sb = getSupabase();

  for (let i = 0; i < items.length; i += BATCH) {
    const batch = items.slice(i, i + BATCH).map(normalizeForDB);
    const progress = Math.min(i + BATCH, items.length);

    try {
      // Plain insert — unique constraint trên title đã có trong schema
      const { data, error } = await sb
        .from('scholarships')
        .insert(batch)
        .select('id, title');

      if (error) {
        const msg = error.message || String(error);
        // Bất kỳ lỗi constraint nào → skip batch (unique, not-null, too long...)
        if (msg.includes('23505') || msg.includes('23502') || msg.includes('too long') || msg.toLowerCase().includes('null')) {
          skipped += batch.length;
          process.stdout.write(`\r   💾 Inserted: ${inserted} | Skip (trùng): ${skipped} | Tiến độ: ${progress}/${items.length}   `);
        } else {
          errors.push({ batch: Math.floor(i / BATCH) + 1, error: msg });
          console.error(`\n   ❌ Batch ${Math.floor(i / BATCH) + 1} error: ${msg}`);
        }
      } else {
        const rowsInserted = Array.isArray(data) ? data.length : 0;
        inserted += rowsInserted;
        skipped  += batch.length - rowsInserted;
        process.stdout.write(`\r   💾 Đã insert: ${inserted} | Skip (trùng): ${skipped} | Tiến độ: ${progress}/${items.length}   `);
      }
    } catch (err) {
      const msg = err.message || String(err);
      if (msg.includes('23505') || msg.toLowerCase().includes('unique')) {
        skipped += batch.length;
        process.stdout.write(`\r   💾 Inserted: ${inserted} | Skip (trùng): ${skipped} | Tiến độ: ${progress}/${items.length}   `);
      } else {
        errors.push({ batch: Math.floor(i / BATCH) + 1, error: msg });
        console.error(`\n   ❌ Batch ${Math.floor(i / BATCH) + 1} exception: ${msg}`);
      }
    }
  }

  process.stdout.write('\n');
  return { inserted, skipped, errors };
}

// ═══════════════════════════════════════════════════════════════
// SECTION 7 — MAIN
// ═══════════════════════════════════════════════════════════════

async function main() {
  // 1. Verify DB connection
  await verifyConnection();

  // 2. Dry-run check
  if (MODE_DRY_RUN) {
    console.log('🔍 [DRY-RUN] Chế độ quét không lưu DB\n');
  }

  // 3. Scrape
  console.log('🌐 Bắt đầu cào dữ liệu từ scholars4dev.com...\n');

  let scholarships = [];

  // 3a. Thử RSS trước (nhẹ, ít tốn bandwidth)
  console.log('── Try: RSS Feeds ─────────────────────────────');
  const rssResult = await tryRSSFeeds();

  if (rssResult && rssResult.length > 0) {
    console.log(`✅ RSS thành công — lấy được ${rssResult.length} học bổng qua RSS`);
    scholarships = rssResult;
  } else {
    console.log('⚠️  RSS không khả dụng hoặc không có dữ liệu → chuyển sang axios+cheerio\n');
    console.log('── Fallback: Web Scraping ─────────────────────');
    scholarships = await scrapeScholars4Dev();
  }

  console.log(`\n✅ Quay về ${scholarships.length} học bổng`);

  // 4. In sample
  console.log('\n📋 Mẫu 5 học bổng đầu tiên:');
  scholarships.slice(0, 5).forEach((s, i) => {
    console.log(
      `  ${i + 1}. [${s.degree}] ${s.title.substring(0, 60)}…`
    );
    console.log(`     → Provider: ${s.provider} | Country: ${s.country}`);
    console.log(`     → Deadline: ${s.deadline ? new Date(s.deadline).toLocaleDateString('en-GB') : 'N/A'} | Active: ${s.is_active}`);
    console.log('');
  });

  // 5. Dry-run: kết thúc luôn
  if (MODE_DRY_RUN) {
    console.log('🏁 [DRY-RUN] Hoàn tất — không lưu vào DB.');
    process.exit(0);
  }

  // 6. Insert vào DB
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '').replace(/\/$/, '');
  console.log('── Insert vào Supabase Cloud ──────────────────');
  console.log(`   Target : ${supabaseUrl}`);
  console.log(`   Số bản ghi : ${scholarships.length}`);
  console.log(`   Batch size : 50`);
  console.log(`   Upsert     : ON CONFLICT (title) DO NOTHING\n`);

  const { inserted, skipped, errors } = await insertBatch(scholarships);

  // 7. Tổng kết
  console.log('\n════════════════════════════════════════════');
  console.log('  📊 BÁO CÁO SEED');
  console.log('════════════════════════════════════════════');
  console.log(`  ✅ Inserted   : ${inserted} bản ghi`);
  console.log(`  ⏭  Skipped   : ${skipped} bản ghi (trùng title — đã có trong DB)`);
  console.log(`  ❌ Errors     : ${errors.length}`);

  if (errors.length > 0) {
    console.log('\n  Chi tiết lỗi:');
    errors.slice(0, 5).forEach((e, i) => {
      console.log(`    ${i + 1}. Batch ${e.batch}: ${e.error}`);
    });
  }

  // 8. Verify tổng số trong DB
  try {
    const sb = getSupabase();
    const { count, error: countErr } = await sb
      .from('scholarships')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true);
    if (!countErr) {
      console.log(`\n  📈 Tổng học bổng active trong DB : ${count ?? 0}`);
    }
  } catch (_) {}

  console.log('════════════════════════════════════════════\n');
  console.log('🏁 Hoàn tất. 🎉');
  process.exit(errors.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('\n❌ Lỗi không mong đợi:', err.message);
  if (err.stack) console.error(err.stack);
  process.exit(1);
});
