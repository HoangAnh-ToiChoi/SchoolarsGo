'use strict';

/**
 * ScholarsGo — Multi-Source Scholarship Scraper
 *
 * Cào học bổng từ nhiều nguồn.
 * Primary: Gemini AI để parse HTML → JSON chính xác.
 * Fallback: Cheerio regex parser khi Gemini unavailable (quota/lỗi).
 *
 * Nguồn:
 *   1. scholars4dev.com        — học bổng cho developing countries
 *   2. opportunitydesk.org     — học bổng quốc tế cập nhật hàng ngày
 *   3. scholarship-positions.com — database học bổng lớn, thay scholarshipdb.net
 *   4. afterschoolalpha.com    — scholarship aggregator
 *
 * Chạy:
 *   node scripts/scrape-multi.js
 *   node scripts/scrape-multi.js --dry-run
 *   node scripts/scrape-multi.js --source=scholars4dev
 *   node scripts/scrape-multi.js --limit=50
 *   node scripts/scrape-multi.js --no-gemini   (chỉ dùng cheerio)
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const axios   = require('axios');
const cheerio = require('cheerio');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createClient } = require('@supabase/supabase-js');

// Supabase JS client (REST API) — works even when direct PG connection is unavailable
let _supabase;
function getSupabase() {
  if (!_supabase) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('Thiếu SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY');
    _supabase = createClient(url, key, { auth: { persistSession: false } });
  }
  return _supabase;
}

// ── CLI args ──────────────────────────────────────────────────────────────────
const args       = process.argv.slice(2);
const DRY_RUN    = args.includes('--dry-run');
const NO_GEMINI  = args.includes('--no-gemini');
const sourceArg  = args.find(a => a.startsWith('--source='))?.split('=')[1];
const limitArg   = args.find(a => a.startsWith('--limit='))?.split('=')[1];
const MAX_ITEMS  = limitArg ? parseInt(limitArg) : 1000;

// ── Helpers ───────────────────────────────────────────────────────────────────
const sleep  = ms => new Promise(r => setTimeout(r, ms));
const delay  = (extra = 0) => sleep(1500 + extra + Math.floor(Math.random() * 1500)); // 1.5–3s base + optional extra
const geminiDelay = () => sleep(4500 + Math.floor(Math.random() * 1000)); // 4.5–5.5s — stay under 15 rpm free tier
const log    = (...a) => console.log(...a);
const warn   = (...a) => console.warn('⚠️ ', ...a);

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
};

// ── Gemini setup ──────────────────────────────────────────────────────────────
let gemini;
let geminiQuotaExhausted = false; // skip further attempts once daily quota is gone

function getGemini() {
  if (!gemini) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error('Thiếu GEMINI_API_KEY trong .env');
    gemini = new GoogleGenerativeAI(key).getGenerativeModel({ model: 'gemini-2.0-flash' });
  }
  return gemini;
}

// ── Cheerio fallback parser (no AI needed) ────────────────────────────────────
const COUNTRY_LIST = [
  'Australia','USA','United States','UK','United Kingdom','Canada','Germany',
  'France','Japan','South Korea','Netherlands','Sweden','Norway','Switzerland',
  'New Zealand','Singapore','Austria','Belgium','Ireland','Denmark','Finland',
  'Spain','Italy','China','Turkey','Malaysia','Taiwan','Hungary','Czech',
];
const COUNTRY_REGEX = new RegExp(`\\b(${COUNTRY_LIST.join('|')})\\b`, 'i');
const MONTHS = 'January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec';
const DEADLINE_PATTERNS = [
  new RegExp(`[Dd]eadline[:\\s]+([A-Za-z]+ \\d{1,2},?\\s*\\d{4})`),
  new RegExp(`[Dd]eadline[:\\s]+(\\d{1,2} (?:${MONTHS}) \\d{4})`),
  new RegExp(`[Dd]eadline[:\\s]+(\\d{4}-\\d{2}-\\d{2})`),
  new RegExp(`[Cc]losing [Dd]ate[:\\s]+([A-Za-z]+ \\d{1,2},?\\s*\\d{4})`),
  new RegExp(`[Cc]losing [Dd]ate[:\\s]+(\\d{1,2} (?:${MONTHS}) \\d{4})`),
  new RegExp(`[Aa]pply (?:by|before)[:\\s]+([A-Za-z]+ \\d{1,2},?\\s*\\d{4})`),
  new RegExp(`(\\d{1,2} (?:${MONTHS}),?\\s*20(?:2[5-9]|3[0-9]))`),
];

function parseWithCheerio(html, sourceUrl) {
  const $ = cheerio.load(html);

  // Remove chrome/noise
  $('nav, header, footer, .sidebar, script, style, .menu, .widget, .advertisement, .ad').remove();

  const title = ($('h1.entry-title, h1.post-title, h1').first().text() || '').trim();
  if (!title || title.length < 10) return [];

  // Title must look like a scholarship/study post — filter ads, gambling, nav pages
  const VALID_TITLE_RE = /scholar|fellowship|grant|award|fund|study|abroad|intern|bursary|program|opportunit|university|college|education/i;
  if (!VALID_TITLE_RE.test(title)) return [];

  // Only process pages that look like a single scholarship article
  const bodyText = $('article, .entry-content, .post-content, main').first().text()
    || $('body').text();
  const cleanText = bodyText.replace(/\s+/g, ' ');

  // Skip listing pages (multiple articles)
  if ($('article').length > 3) return [];

  // --- Deadline ---
  let deadline = null;
  for (const p of DEADLINE_PATTERNS) {
    const m = cleanText.match(p);
    if (m) { deadline = m[1].trim(); break; }
  }

  // --- Country ---
  const hostLine = cleanText.match(/[Hh]ost [Cc]ountry[:\s]+([A-Za-z ,]+?)(?:\.|,|\n|  )/);
  const countryFromHost = hostLine ? hostLine[1].trim().split(/[,/]/)[0].trim() : null;
  const countryFromText = (cleanText.match(COUNTRY_REGEX) || [])[1] || null;
  const country = countryFromHost || countryFromText || 'International';

  // --- Degree ---
  // Priority: title first (most reliable), then h2/h3 headings, then body (risk of false match)
  const titleText = title.toLowerCase();
  const headings = ($('h1, h2, h3').map((_, el) => $(el).text()).get().join(' ')).toLowerCase();
  const degree = /\bphd\b|doctoral|postdoctoral/.test(titleText) ? 'PhD'
    : /\bmasters?\b|postgraduate|msc\b|mba\b|meng\b/.test(titleText) ? 'Master'
    : /\bundergraduate\b|bachelors?\b/.test(titleText) ? 'Bachelor'
    : /\bphd\b|doctoral/.test(headings) ? 'PhD'
    : /\bmasters?\b|postgraduate/.test(headings) ? 'Master'
    : /\bundergraduate\b|bachelors?\b/.test(headings) ? 'Bachelor'
    : 'Any';

  // --- Coverage ---
  const coverage = /fully.?funded/i.test(cleanText) ? 'Full'
    : /partial/i.test(cleanText) ? 'Partial'
    : /tuition.?fee/i.test(cleanText) ? 'Tuition Only'
    : null;

  // --- Provider ---
  // Try structured patterns first; fallback to org-name pattern in first 600 chars only
  const providerPatterns = [
    /[Oo]ffered by[:\s]+([^.\n]{5,80})/,
    /[Ss]ponsored by[:\s]+([^.\n]{5,80})/,
    /[Ff]unded by[:\s]+([^.\n]{5,80})/,
    /[Pp]rovided by[:\s]+([^.\n]{5,80})/,
  ];
  let provider = 'Unknown';
  for (const p of providerPatterns) {
    const m = cleanText.match(p);
    if (m && m[1].trim().length < 80) { provider = m[1].trim().substring(0, 100); break; }
  }
  if (provider === 'Unknown') {
    // Extract prefix from title before "Scholarship|Fellowship|Program|Award|Grant"
    const titleProvider = title.match(/^(.+?)\s+(?:[Ss]cholarship|[Ff]ellowship|[Pp]rogram|[Aa]ward|[Gg]rant|[Ss]cholar)/);
    if (titleProvider && titleProvider[1].length > 3 && titleProvider[1].length < 70) {
      provider = titleProvider[1].trim();
    }
  }

  // --- University ---
  const uniMatch = cleanText.match(/(?:at|in|by)\s+([A-Z][A-Za-z\s]+(?:University|Institute|College))/);
  const university = uniMatch ? uniMatch[1].trim().substring(0, 100) : null;

  // --- IELTS ---
  const ieltsMatch = cleanText.match(/IELTS[:\s]+(\d+\.?\d*)/i);
  const min_ielts = ieltsMatch ? parseFloat(ieltsMatch[1]) : null;

  // --- GPA ---
  const gpaMatch = cleanText.match(/GPA[:\s]+(\d+\.?\d*)/i);
  const min_gpa = gpaMatch && parseFloat(gpaMatch[1]) <= 4 ? parseFloat(gpaMatch[1]) : null;

  // --- Eligibility snippet ---
  const eligMatch = cleanText.match(/[Ee]ligibilit(?:y|ies)[:\s]+([^.!?]{20,300})/);
  const eligibility = eligMatch ? eligMatch[1].trim().substring(0, 500) : null;

  return [{
    title: title.substring(0, 250),
    provider,
    country,
    university,
    degree,
    field_of_study: null,
    amount: null,
    currency: 'USD',
    coverage,
    deadline,
    language: 'English',
    min_gpa,
    min_ielts,
    eligibility,
    benefits: null,
    application_url: sourceUrl,
    _parsed_by: 'cheerio',
  }];
}

// ── Gemini HTML → scholarships[] (with cheerio fallback) ─────────────────────
async function parsePage(html, sourceUrl) {
  // Skip Gemini if quota already exhausted this run or --no-gemini flag
  if (!NO_GEMINI && !geminiQuotaExhausted) {
    try {
      const model = getGemini();
      const trimmed = html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/\s{2,}/g, ' ')
        .substring(0, 12000);

      const prompt = `Extract ALL scholarship information from this HTML page and return a JSON array.

For EACH scholarship found, extract:
{
  "title": "full scholarship name",
  "provider": "organization/government offering it",
  "country": "host country (where you study, e.g. UK, Australia, USA, Germany)",
  "university": "specific university or null",
  "degree": "Bachelor|Master|PhD|Any",
  "field_of_study": "specific field or null",
  "amount": number in USD or null,
  "currency": "USD|EUR|AUD|GBP|JPY|KRW|null",
  "coverage": "Full|Partial|Tuition Only|Living Allowance",
  "deadline": "YYYY-MM-DD or null (if 'varies' or 'rolling', return null)",
  "language": "English|French|German|Japanese|null",
  "min_gpa": number 0-4 or null,
  "min_ielts": number like 6.5 or null,
  "eligibility": "brief eligibility description or null",
  "benefits": "brief benefits description or null",
  "application_url": "direct URL to apply or scholarship page"
}

Rules:
- Return ONLY a JSON array, no explanation
- If a field is unknown, use null
- Only include scholarships with future deadlines OR null deadline
- Do NOT include expired scholarships (past 2026)
- Minimum 1 scholarship, maximum 20 per page

Page URL: ${sourceUrl}
HTML:
${trimmed}

JSON array:`;

      await geminiDelay();
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      const match = text.match(/\[[\s\S]*\]/);
      if (!match) return parseWithCheerio(html, sourceUrl);
      const parsed = JSON.parse(match[0]).filter(s => s.title && s.title.length > 5);
      return parsed.length > 0 ? parsed : parseWithCheerio(html, sourceUrl);
    } catch (e) {
      const isQuotaError = e.message && (e.message.includes('429') || e.message.includes('quota'));
      if (isQuotaError) {
        geminiQuotaExhausted = true;
        log('   ⚡ Gemini quota exhausted — switching to cheerio fallback for this run');
      } else {
        warn(`Gemini error: ${e.message?.substring(0, 100)}`);
      }
    }
  }

  // Cheerio fallback
  return parseWithCheerio(html, sourceUrl);
}

// ── Fetch HTML ────────────────────────────────────────────────────────────────
async function fetchHtml(url, referer) {
  const headers = { ...HEADERS };
  if (referer) headers['Referer'] = referer;
  const res = await axios.get(url, { headers, timeout: 20000 });
  return res.data;
}

// ── Extract article links from listing page ───────────────────────────────────
const MEDIA_EXT = /\.(jpg|jpeg|png|gif|webp|svg|pdf|zip|mp4|mp3|doc|docx)$/i;
const SKIP_PATHS = ['/category/', '/tag/', '/page/', '/author/', '/wp-content/', '/wp-admin/', '/feed/', '/cdn-cgi/', '/contact', '/about', '/privacy', '/disclaimer', '/terms'];
// Link text must contain at least one scholarship-signal word
const LINK_TEXT_RE = /scholar|fellowship|grant|award|fund|opportunit|study|internship|bursary|program|apply/i;

function extractLinks(html, baseUrl, urlPattern) {
  const $ = cheerio.load(html);
  const links = new Set();
  const domain = new URL(baseUrl).origin;

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const linkText = $(el).text().trim();
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('javascript:')) return;
    // Skip links with no relevant text (ads, generic nav); check path not domain
    const urlPath = href.replace(/^https?:\/\/[^/]+/, '');
    if (linkText && linkText.length > 0 && !LINK_TEXT_RE.test(linkText) && !LINK_TEXT_RE.test(urlPath)) return;
    const full = href.startsWith('http') ? href : `${domain}${href.startsWith('/') ? '' : '/'}${href}`;
    // If source defines a URL pattern, only accept matching links (e.g. date-based article URLs)
    if (urlPattern && !urlPattern.test(full)) return;
    if (
      full.startsWith(domain) &&
      !full.includes('?') &&
      !MEDIA_EXT.test(full) &&
      !SKIP_PATHS.some(p => full.includes(p)) &&
      full !== baseUrl &&
      full !== domain + '/' &&
      full.length > domain.length + 5
    ) {
      links.add(full);
    }
  });

  return [...links].slice(0, 30);
}

// ── Source definitions ────────────────────────────────────────────────────────
// Tested & working:
//   scholars4dev.com           ✅ reliable, no rate limit
//   scholarship-positions.com  ✅ works with 3s+ delay between articles (rate-limit 429 after 2-3 pages)
//   scholarships360.org        ✅ static HTML, individual scholarship pages at /scholarship/<slug>/
//   youthop.com                ✅ blog-style scholarship articles, article URLs at /<year>/<slug>/
//   studyqa.com                ✅ scholarship listings with /scholarships/page/<n>/ pagination
// Tested & rejected:
//   scholarshipdb.net          ❌ HTTP 403 blocked
//   afterschoolalpha.com       ❌ DNS ENOTFOUND (domain dead)
//   worldscholarshipforum.com  ❌ many article URLs return 404
//   opportunitydesk.org        ❌ serves gambling/ad content for bot requests (22Bet injection)
const SOURCES = [
  {
    name: 'scholars4dev',
    type: 'listing',
    delayExtra: 0, // 1.5-3s base
    // Pages 1-7 mostly in seed; pages 8-15 provide ~20% new entries
    listingPages: [
      // Masters — pages 1-15 verified (pages 1-7 likely already seeded, 8-15 new)
      'https://www.scholars4dev.com/category/masters-scholarships/',
      'https://www.scholars4dev.com/category/masters-scholarships/page/2/',
      'https://www.scholars4dev.com/category/masters-scholarships/page/3/',
      'https://www.scholars4dev.com/category/masters-scholarships/page/4/',
      'https://www.scholars4dev.com/category/masters-scholarships/page/5/',
      'https://www.scholars4dev.com/category/masters-scholarships/page/6/',
      'https://www.scholars4dev.com/category/masters-scholarships/page/7/',
      'https://www.scholars4dev.com/category/masters-scholarships/page/8/',
      'https://www.scholars4dev.com/category/masters-scholarships/page/9/',
      'https://www.scholars4dev.com/category/masters-scholarships/page/10/',
      'https://www.scholars4dev.com/category/masters-scholarships/page/11/',
      'https://www.scholars4dev.com/category/masters-scholarships/page/12/',
      'https://www.scholars4dev.com/category/masters-scholarships/page/13/',
      'https://www.scholars4dev.com/category/masters-scholarships/page/14/',
      'https://www.scholars4dev.com/category/masters-scholarships/page/15/',
      // PhD — pages 1-12 verified
      'https://www.scholars4dev.com/category/phd-scholarships/',
      'https://www.scholars4dev.com/category/phd-scholarships/page/2/',
      'https://www.scholars4dev.com/category/phd-scholarships/page/3/',
      'https://www.scholars4dev.com/category/phd-scholarships/page/4/',
      'https://www.scholars4dev.com/category/phd-scholarships/page/5/',
      'https://www.scholars4dev.com/category/phd-scholarships/page/6/',
      'https://www.scholars4dev.com/category/phd-scholarships/page/7/',
      'https://www.scholars4dev.com/category/phd-scholarships/page/8/',
      'https://www.scholars4dev.com/category/phd-scholarships/page/9/',
      'https://www.scholars4dev.com/category/phd-scholarships/page/10/',
      'https://www.scholars4dev.com/category/phd-scholarships/page/11/',
      'https://www.scholars4dev.com/category/phd-scholarships/page/12/',
      // Undergraduate — pages 1-8 verified
      'https://www.scholars4dev.com/category/undergraduate-scholarships/',
      'https://www.scholars4dev.com/category/undergraduate-scholarships/page/2/',
      'https://www.scholars4dev.com/category/undergraduate-scholarships/page/3/',
      'https://www.scholars4dev.com/category/undergraduate-scholarships/page/4/',
      'https://www.scholars4dev.com/category/undergraduate-scholarships/page/5/',
      'https://www.scholars4dev.com/category/undergraduate-scholarships/page/6/',
      'https://www.scholars4dev.com/category/undergraduate-scholarships/page/7/',
      'https://www.scholars4dev.com/category/undergraduate-scholarships/page/8/',
    ],
  },
  {
    name: 'scholarship-positions',
    type: 'listing',
    delayExtra: 3000, // 4.5-6s total — avoid 429 rate limit
    // Rate-limited after ~2-3 listing pages. Use urlPattern to filter nav sidebar links.
    // Article URLs follow date pattern: /slug/YYYY/MM/DD/
    urlPattern: /\/\d{4}\/\d{2}\/\d{2}\//,
    listingPages: [
      'https://scholarship-positions.com/category/masters-scholarships/',
      'https://scholarship-positions.com/category/masters-scholarships/page/2/',
      'https://scholarship-positions.com/category/under-graduate-scholarship/',
      'https://scholarship-positions.com/category/under-graduate-scholarship/page/2/',
      'https://scholarship-positions.com/category/phd-scholarships/',
      'https://scholarship-positions.com/category/phd-scholarships/page/2/',
      'https://scholarship-positions.com/category/scholarships-for-developing-countries/',
    ],
  },
  {
    name: 'scholarships360',
    type: 'listing',
    delayExtra: 1000,
    // Individual scholarship pages at /scholarship/<slug>/ — filter with urlPattern
    urlPattern: /\/scholarship\//,
    listingPages: [
      'https://scholarships360.org/scholarships/international-scholarships/',
      'https://scholarships360.org/scholarships/graduate-scholarships/',
      'https://scholarships360.org/scholarships/college-scholarships/',
      'https://scholarships360.org/scholarships/stem-scholarships/',
      'https://scholarships360.org/scholarships/undergraduate-scholarships/',
    ],
  },
  {
    name: 'youthop',
    type: 'listing',
    delayExtra: 1000,
    // Blog-style scholarship articles; article URLs contain year segment
    urlPattern: /\/\d{4}\//,
    listingPages: [
      'https://youthop.com/scholarships',
      'https://youthop.com/scholarships/page/2',
      'https://youthop.com/scholarships/page/3',
      'https://youthop.com/scholarships/page/4',
      'https://youthop.com/scholarships/page/5',
      'https://youthop.com/fellowships',
      'https://youthop.com/fellowships/page/2',
      'https://youthop.com/fellowships/page/3',
    ],
  },
  {
    name: 'studyqa',
    type: 'listing',
    delayExtra: 1000,
    // Individual scholarship pages at /scholarships/<slug>
    urlPattern: /\/scholarships\/[^/]+$/,
    listingPages: [
      'https://studyqa.com/scholarships',
      'https://studyqa.com/scholarships/page/2',
      'https://studyqa.com/scholarships/page/3',
      'https://studyqa.com/scholarships/page/4',
      'https://studyqa.com/scholarships/page/5',
      'https://studyqa.com/scholarships/page/6',
    ],
  },
];

// ── Scrape one listing source ─────────────────────────────────────────────────
async function scrapeListingSource(source, collected, globalFetchedUrls) {
  log(`\n📡 [${source.name}] Bắt đầu cào ${source.listingPages.length} trang...`);
  let sourceCount = 0;

  for (const pageUrl of source.listingPages) {
    if (collected.length >= MAX_ITEMS) break;
    try {
      log(`   → Fetching: ${pageUrl}`);
      const html = await fetchHtml(pageUrl);
      const links = extractLinks(html, pageUrl, source.urlPattern);
      const newLinks = links.filter(l => !globalFetchedUrls.has(l));
      log(`   → Found ${links.length} article links (${links.length - newLinks.length} already fetched, ${newLinks.length} new)`);

      for (const link of newLinks) {
        if (collected.length >= MAX_ITEMS) break;
        globalFetchedUrls.add(link);
        try {
          await delay(source.delayExtra || 0);
          const detailHtml = await fetchHtml(link, pageUrl);
          const items = await parsePage(detailHtml, link);
          if (items.length > 0) {
            const tag = items[0]._parsed_by === 'cheerio' ? '🔧' : '✨';
            log(`     ${tag} ${items[0].title?.substring(0, 55)}... [${items[0].degree || '?'}]`);
            items.forEach(s => {
              delete s._parsed_by;
              s.source = source.name;
              s.application_url = s.application_url || link;
              collected.push(s);
              sourceCount++;
            });
          }
        } catch (e) {
          warn(`Detail fetch failed: ${link} — ${e.message?.substring(0, 60)}`);
        }
      }

      await delay(source.delayExtra || 0);
    } catch (e) {
      warn(`Listing fetch failed: ${pageUrl} — ${e.message?.substring(0, 80)}`);
    }
  }

  log(`   📊 [${source.name}] ${sourceCount} học bổng`);
}

// ── DB: normalize + insert ────────────────────────────────────────────────────
const VALID_DEGREES = ['Bachelor', 'Master', 'PhD', 'Any'];

function normalize(s) {
  return {
    title:           (s.title || '').trim().substring(0, 500),
    provider:        (s.provider || 'Unknown').trim().substring(0, 255),
    country:         (s.country || 'International').trim().substring(0, 255),
    city:            null,
    university:      s.university ? String(s.university).substring(0, 255) : null,
    degree:          VALID_DEGREES.includes(s.degree) ? s.degree : 'Any',
    field_of_study:  s.field_of_study ? String(s.field_of_study).substring(0, 255) : null,
    amount:          s.amount && !isNaN(s.amount) ? Number(s.amount) : null,
    currency:        s.currency && s.currency !== 'null' ? String(s.currency).substring(0, 10) : 'USD',
    coverage:        s.coverage ? String(s.coverage).substring(0, 255) : null,
    deadline:        parseDeadline(s.deadline),
    intake:          null,
    language:        s.language && s.language !== 'null' ? String(s.language).substring(0, 100) : 'English',
    min_gpa:         s.min_gpa && !isNaN(s.min_gpa) && s.min_gpa > 0 && s.min_gpa <= 4 ? Number(s.min_gpa) : null,
    min_ielts:       s.min_ielts && !isNaN(s.min_ielts) && s.min_ielts > 0 && s.min_ielts <= 9 ? Number(s.min_ielts) : null,
    eligibility:     s.eligibility ? String(s.eligibility).substring(0, 1000) : null,
    requirements:    null,
    benefits:        s.benefits ? String(s.benefits).substring(0, 1000) : null,
    application_url: s.application_url ? String(s.application_url).substring(0, 2048) : null,
    image_url:       null,
    is_featured:     false,
    is_active:       true,
    source:          s.source || 'scraped',
  };
}

const DEADLINE_UNKNOWN = new Date('2099-01-01'); // sentinel: "no known deadline"

function parseDeadline(raw) {
  if (!raw || raw === 'null') return DEADLINE_UNKNOWN;
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return DEADLINE_UNKNOWN;
    if (d < new Date()) return DEADLINE_UNKNOWN; // treat expired as "unknown, not rolling"
    return d;
  } catch {
    return DEADLINE_UNKNOWN;
  }
}

async function insertBatch(items) {
  if (items.length === 0) return { inserted: 0, skipped: 0 };

  const normalized = items.map(normalize).filter(s => s.title.length > 3);

  const seen = new Set();
  const unique = normalized.filter(s => {
    if (seen.has(s.title.toLowerCase())) return false;
    seen.add(s.title.toLowerCase());
    return true;
  });

  if (unique.length === 0) return { inserted: 0, skipped: 0 };

  const supabase = getSupabase();
  let inserted = 0, skipped = 0;

  // Insert in batches of 50 (Supabase REST limit)
  for (let i = 0; i < unique.length; i += 50) {
    const chunk = unique.slice(i, i + 50);
    try {
      const { data, error } = await supabase
        .from('scholarships')
        .upsert(chunk, { onConflict: 'title', ignoreDuplicates: true })
        .select('id');

      if (error) {
        warn(`Batch insert error: ${error.message}`);
        skipped += chunk.length;
      } else {
        inserted += (data || []).length;
        skipped += chunk.length - (data || []).length;
      }
    } catch (e) {
      warn(`Batch insert exception: ${e.message}`);
      skipped += chunk.length;
    }
  }

  return { inserted, skipped };
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  log('\n════════════════════════════════════════════════');
  log('  ScholarsGo — Multi-Source Scholarship Scraper');
  log('════════════════════════════════════════════════\n');

  if (DRY_RUN) log('🔍 DRY-RUN mode — không lưu vào DB\n');
  if (NO_GEMINI) log('🔧 NO-GEMINI mode — chỉ dùng cheerio parser\n');

  if (!DRY_RUN) {
    try {
      const supabase = getSupabase();
      const { error } = await supabase.from('scholarships').select('id', { count: 'exact', head: true });
      if (error) throw new Error(error.message);
      log('✅ Supabase kết nối OK\n');
    } catch (e) {
      log(`❌ Supabase kết nối thất bại: ${e.message}`);
      process.exit(1);
    }
  }

  const activeSources = sourceArg
    ? SOURCES.filter(s => s.name === sourceArg)
    : SOURCES;

  if (activeSources.length === 0) {
    log(`❌ Không tìm thấy source: ${sourceArg}`);
    process.exit(1);
  }

  const collected = [];
  const globalFetchedUrls = new Set(); // dedup across all listing pages and sources

  for (const source of activeSources) {
    await scrapeListingSource(source, collected, globalFetchedUrls);
    log(`\n📊 Tổng collected: ${collected.length}`);
  }

  log(`\n\n📊 Tổng cào được: ${collected.length} học bổng`);
  log(`   Dùng Gemini: ${!geminiQuotaExhausted && !NO_GEMINI ? 'Có' : 'Không (dùng cheerio fallback)'}`);

  if (DRY_RUN) {
    log('\n🔍 [DRY-RUN] Sample (10 đầu tiên):');
    collected.slice(0, 10).forEach((s, i) => {
      log(`  ${i + 1}. [${s.degree || '?'}] ${(s.title || '').substring(0, 65)}`);
      log(`     → ${s.country || '?'} | ${s.provider || '?'} | Deadline: ${s.deadline || 'N/A'}`);
    });
    return collected;
  }

  log('\n💾 Đang lưu vào DB...');
  const stats = await insertBatch(collected);

  log(`\n✅ Hoàn tất:`);
  log(`   Inserted : ${stats.inserted}`);
  log(`   Skipped  : ${stats.skipped} (trùng lặp hoặc lỗi)`);
  log(`   Tổng xử lý: ${collected.length}\n`);

  return stats;
}

module.exports = { main };

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch(e => { console.error(e); process.exit(1); });
}
