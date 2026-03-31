/**
 * ScholarsGo — Scholarship Seed + Scraping Script
 * Scrape real scholarships từ scholars4dev.com và seed vào Supabase/PostgreSQL.
 *
 * Chạy:
 *   node scripts/seed-scholarships.js                   → scrape từ web + seed
 *   node scripts/seed-scholarships.js --mock            → chỉ chạy mock data
 *   node scripts/seed-scholarships.js --scrape-only      → chỉ scrape, không insert
 *
 * Lưu ý:
 *  - Deadline phải > now, is_active = true
 *  - degree chỉ thuộc: Bachelor, Master, PhD, Any
 *  - min_gpa theo thang 4.0
 *  - currency mặc định: USD
 *  - Trường nullable: city, university, field_of_study, min_ielts
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { Client } = require('pg');

// ── CLI Arguments ───────────────────────────────────────────────
const args = process.argv.slice(2);
const MODE_MOCK = args.includes('--mock');
const MODE_SCRAPE_ONLY = args.includes('--scrape-only');
const SCRAPE_COUNT = parseInt(args.find((a) => a.startsWith('--count='))?.split('=')[1] || '50');

// ── Supabase Admin Client ────────────────────────────────────────
let supabaseAdmin = null;
try {
  const { createClient } = require('@supabase/supabase-js');
  supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
} catch (e) {
  // Supabase SDK not available — will use pg Client
}

// ── Axios + Cheerio (web scraping) ─────────────────────────────
let axios, cheerio;
try {
  axios = require('axios');
  cheerio = require('cheerio');
} catch (e) {
  console.warn('⚠️  axios/cheerio not installed. Run: npm install axios cheerio');
}

// ── Helpers: Random ──────────────────────────────────────────────
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randFloat = (min, max, decimals = 2) =>
  parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
const randPick = (arr) => arr[randInt(0, arr.length - 1)];

const randDate = (start, end) => {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString();
};

// ── Helper: sleep (rate limiting) ────────────────────────────────
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ═══════════════════════════════════════════════════════════════
// SECTION 1: SCRAPING FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Parse deadline string thành PostgreSQL timestamp.
 * Xử lý các format: "30 April 2026", "April 2026", "varies", "Open year-round"
 * Trả về null nếu không parse được và không thể fallback an toàn.
 */
function parseDeadline(deadlineStr) {
  if (!deadlineStr) return null;

  const str = deadlineStr.trim().toLowerCase();

  // Bỏ qua các giá trị không có ngày cụ thể
  if (
    ['varies', 'open', 'year-round', 'ongoing', 'check website', 'contact us', 'tba', 'tbd'].some(
      (v) => str.includes(v)
    )
  ) {
    // Fallback: lấy ngày cuối cùng của tháng hiện tại + 3 tháng
    const d = new Date();
    d.setMonth(d.getMonth() + 4);
    d.setDate(0); // last day of previous month = last day of (month+3)
    return d.toISOString();
  }

  // Map tháng tiếng Anh
  const monthMap = {
    january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
    july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
  };

  // Format: "30 April 2026" hoặc "April 30, 2026" hoặc "30 Apr 2026"
  const patterns = [
    // "30 April 2026"
    /^(\d{1,2})\s+([a-z]+)\s+(\d{4})$/i,
    // "April 30, 2026" hoặc "April 2026" (không có ngày → lấy ngày 28)
    /^([a-z]+)\s+(\d{1,2}),?\s+(\d{4})$/i,
    /^([a-z]+)\s+(\d{4})$/i,
    // "2026-04-30" (ISO format)
    /^(\d{4})-(\d{2})-(\d{2})$/,
    // "30/04/2026" hoặc "04/30/2026"
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
  ];

  for (const pattern of patterns) {
    const match = str.match(pattern);
    if (match) {
      let year, month, day;

      if (pattern === patterns[0]) {
        // "30 April 2026"
        day = parseInt(match[1]);
        month = monthMap[match[2].toLowerCase()] ?? -1;
        year = parseInt(match[3]);
      } else if (pattern === patterns[1]) {
        // "April 30, 2026"
        month = monthMap[match[1].toLowerCase()] ?? -1;
        day = parseInt(match[2]);
        year = parseInt(match[3]);
      } else if (pattern === patterns[2]) {
        // "April 2026" — không có ngày, fallback ngày 28
        month = monthMap[match[1].toLowerCase()] ?? -1;
        year = parseInt(match[2]);
        day = 28;
      } else if (pattern === patterns[3]) {
        // ISO format
        year = parseInt(match[1]);
        month = parseInt(match[2]) - 1;
        day = parseInt(match[3]);
      } else if (pattern === patterns[4]) {
        // DD/MM/YYYY hoặc MM/DD/YYYY
        const p1 = parseInt(match[1]);
        const p2 = parseInt(match[2]);
        year = parseInt(match[3]);
        if (p1 > 12) {
          day = p1; month = p2 - 1;
        } else {
          month = p1 - 1; day = p2;
        }
      }

      if (month >= 0 && month <= 11 && year >= 2020) {
        const d = new Date(year, month, Math.min(day, 28));
        // Nếu deadline đã qua, fallback 1 năm sau
        if (d <= new Date()) {
          d.setFullYear(d.getFullYear() + 1);
        }
        return d.toISOString();
      }
    }
  }

  // Không parse được → fallback 3 tháng tới
  const fallback = new Date();
  fallback.setMonth(fallback.getMonth() + 3);
  fallback.setDate(15);
  return fallback.toISOString();
}

/**
 * Map degree text từ web sang enum của DB.
 * Trả về 1 trong: Bachelor, Master, PhD, Any
 */
function mapDegree(degreeStr) {
  if (!degreeStr) return 'Any';

  const lower = degreeStr.toLowerCase();

  if (lower.includes('bachelor') || lower.includes('undergraduate')) return 'Bachelor';
  if (lower.includes('master') && !lower.includes('phd')) return 'Master';
  if (lower.includes('phd') || lower.includes('doctoral')) return 'PhD';
  if (lower.includes('any') || lower.includes('all') || lower.includes('open')) return 'Any';

  // Heuristic: nếu chỉ có "Masters/PhD" → lấy Master (phổ biến hơn)
  return 'Master';
}

// ── Scrape danh sách scholarships từ trang chủ scholars4dev ─────
async function scrapeScholarshipListPage(pageUrl) {
  try {
    const response = await axios.get(pageUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      timeout: 15000,
    });

    const $ = cheerio.load(response.data);
    const scholarships = [];

    // scholars4dev uses different layouts depending on the category page.
    // Common selectors for scholarship cards/listings:
    const cardSelectors = [
      // Main list format: each item inside a section or div
      'article',
      '.scholarship-item',
      '.scholarship',
      '.post',
      '.entry',
      // Table row format (common in scholarship list pages)
      'table tbody tr td',
      // Generic list
      '.listing-item',
      '.scholarship-card',
    ];

    // We'll look for entries that have at least a link (title) and country/provider info
    const entries = [];

    // Approach: find all anchor tags that point to individual scholarship detail pages
    // scholars4dev scholarship links look like: /4232/xxx-scholarship/
    $('a[href*="/"]').each((_, el) => {
      const href = $(el).attr('href');
      const text = $(el).text().trim();

      // Filter: href looks like a scholarship detail URL (numeric ID)
      if (
        href &&
        (href.match(/\/\d+\//) || href.match(/\/scholarship\//i)) &&
        text.length > 10 &&
        text.length < 200
      ) {
        const fullUrl = href.startsWith('http') ? href : `https://www.scholars4dev.com${href}`;
        if (!entries.find((e) => e.url === fullUrl)) {
          entries.push({ url: fullUrl, title: text });
        }
      }
    });

    // Remove duplicates
    const uniqueEntries = [];
    const seen = new Set();
    for (const entry of entries) {
      if (!seen.has(entry.url)) {
        seen.add(entry.url);
        uniqueEntries.push(entry);
      }
    }

    console.log(`  🔍 Found ${uniqueEntries.length} scholarship links on ${pageUrl}`);

    // Get adjacent context for each entry (provider, degree, deadline, country)
    for (const entry of uniqueEntries) {
      // Navigate to the parent container to extract metadata
      const response2 = await axios.get(entry.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        timeout: 15000,
      });

      const $$ = cheerio.load(response2.data);
      let provider = null, degree = null, deadline = null, country = null;
      let fieldOfStudy = null, amount = null, language = null;
      let eligibility = null, benefits = null, requirements = null;
      let applicationUrl = null, imageUrl = null;

      // Extract page text for pattern matching
      const pageText = $$('body').text().toLowerCase();

      // Provider: look in common patterns
      // Usually near "Provider:", "Sponsor:", "Host Institution:", "Provided by:"
      $$('p, li, span, div').each((_, el) => {
        const text = $$(el).text();
        const lower = text.toLowerCase();

        if (!provider && (lower.includes('provider:') || lower.includes('sponsor:') || lower.includes('provided by:') || lower.includes('host institution:'))) {
          provider = text.replace(/^(provider|sponsor|provided by|host institution):\s*/i, '').trim();
          if (provider.length > 100) provider = provider.substring(0, 100);
        }

        if (!deadline && (lower.includes('deadline:') || lower.includes('application deadline:') || lower.includes('apply by:'))) {
          deadline = text.replace(/^(deadline|application deadline|apply by):\s*/i, '').trim();
        }

        if (!degree && (lower.includes('degree:') || lower.includes('level:') || lower.includes('study level:'))) {
          degree = text.replace(/^(degree|level|study level):\s*/i, '').trim();
        }

        if (!country && (lower.includes('study in:') || lower.includes('country:') || lower.includes('destination:'))) {
          country = text.replace(/^(study in|country|destination):\s*/i, '').trim();
          // Clean up: remove extra whitespace, take first country if multiple
          country = country.split(/[,\/]/)[0].trim();
        }
      });

      // Fallback: if not found in structured fields, try extracting from page
      if (!provider) {
        // Look for the first non-empty paragraph that might be the provider
        $$('h2, h3, p').each((_, el) => {
          if (!provider) {
            const text = $$(el).text().trim();
            if (text.length > 5 && text.length < 150 && !text.includes('Scholarship')) {
              provider = text;
            }
          }
          return !!provider;
        });
      }

      // Extract scholarship details from structured table/list
      $$('table, ul').each((_, el) => {
        const tableText = $$(el).text().toLowerCase();

        if (tableText.includes('deadline') && !deadline) {
          $$(el).find('tr, li').each((_, row) => {
            const rowText = $$(row).text();
            if (rowText.toLowerCase().includes('deadline')) {
              deadline = rowText.replace(/deadline:?\s*/i, '').trim();
            }
          });
        }

        if (tableText.includes('degree') && !degree) {
          $$(el).find('tr, li').each((_, row) => {
            const rowText = $$(row).text();
            if (rowText.toLowerCase().includes('degree')) {
              degree = rowText.replace(/degree:?\s*/i, '').trim();
            }
          });
        }

        if (tableText.includes('country') || tableText.includes('study in')) {
          $$(el).find('tr, li').each((_, row) => {
            const rowText = $$(row).text();
            if (!country && (rowText.toLowerCase().includes('study in') || rowText.toLowerCase().includes('country'))) {
              country = rowText.replace(/study in:?|country:?\s*/gi, '').trim();
              country = country.split(/[,\/]/)[0].trim();
            }
          });
        }

        if (tableText.includes('field') || tableText.includes('subject') || tableText.includes('major')) {
          $$(el).find('tr, li').each((_, row) => {
            const rowText = $$(row).text();
            if (!fieldOfStudy && (rowText.toLowerCase().includes('field') || rowText.toLowerCase().includes('subject'))) {
              fieldOfStudy = rowText.replace(/field of study:|subject:?\s*/i, '').trim();
            }
          });
        }

        if (tableText.includes('benefit') || tableText.includes('coverage') || tableText.includes('award')) {
          $$(el).find('tr, li').each((_, row) => {
            const rowText = $$(row).text();
            if (!benefits && (rowText.toLowerCase().includes('benefit') || rowText.toLowerCase().includes('coverage') || rowText.toLowerCase().includes('award'))) {
              benefits = rowText.replace(/benefits?:?|coverage:?|award:?\s*/i, '').trim();
            }
          });
        }
      });

      // Extract application URL
      const applyLinks = [];
      $$('a').each((_, el) => {
        const href = $$(el).attr('href') || '';
        const text = $$(el).text().toLowerCase();
        if (
          href &&
          (text.includes('apply') || text.includes('apply now') || text.includes('official website') || text.includes('learn more') || href.includes('apply')) &&
          !href.includes('scholars4dev') &&
          href.startsWith('http')
        ) {
          applyLinks.push(href);
        }
      });
      applicationUrl = applyLinks[0] || null;

      // Extract image
      const ogImage = $$('meta[property="og:image"]').attr('content');
      const firstImg = $$('article img, .post img, .entry img, main img').first().attr('src');
      imageUrl = ogImage || firstImg || null;
      if (imageUrl && !imageUrl.startsWith('http')) {
        imageUrl = `https://www.scholars4dev.com${imageUrl}`;
      }

      // Build scholarship object
      const scholarship = {
        title: entry.title,
        provider: provider || 'Various Institutions',
        country: country || 'Multiple Countries',
        city: null,
        university: null,
        degree: mapDegree(degree),
        field_of_study: fieldOfStudy,
        amount: null,
        currency: 'USD',
        coverage: null,
        deadline: parseDeadline(deadline),
        intake: null,
        language: null,
        min_gpa: null,
        min_ielts: null,
        eligibility,
        requirements,
        benefits,
        application_url: applicationUrl,
        image_url: imageUrl,
        is_featured: false,
        is_active: null, // set after deadline check
        source: 'scholars4dev',
      };

      // Set is_active
      if (scholarship.deadline) {
        scholarship.is_active = new Date(scholarship.deadline) > new Date();
      } else {
        // Nếu không parse được deadline rõ ràng → coi là active
        scholarship.is_active = true;
        // Fallback deadline 1 năm tới
        const fallbackDeadline = new Date();
        fallbackDeadline.setFullYear(fallbackDeadline.getFullYear() + 1);
        scholarship.deadline = fallbackDeadline.toISOString();
      }

      scholarships.push(scholarship);
      await sleep(1200); // Rate limit: 1.2s giữa mỗi detail page

      // Progress indicator
      if (scholarships.length % 5 === 0) {
        console.log(`  ⏳ Scraped ${scholarships.length} scholarships so far...`);
      }
    }

    return scholarships;
  } catch (err) {
    console.error(`  ❌ Error scraping ${pageUrl}: ${err.message}`);
    return [];
  }
}

// ── Main scrape orchestrator ─────────────────────────────────────
async function scrapeScholarships4Dev() {
  console.log('\n🌐 Starting Scholars4Dev Web Scraper...\n');

  if (!axios || !cheerio) {
    console.error('❌ Missing dependencies. Install with: npm install axios cheerio');
    return [];
  }

  // Các trang danh mục của scholars4dev để scrape
  const categoryPages = [
    'https://www.scholars4dev.com/category/masters-scholarships/',
    'https://www.scholars4dev.com/category/phd-scholarships/',
    'https://www.scholars4dev.com/category/fully-funded-scholarships/',
  ];

  const allScholarships = [];
  const seen = new Set();

  for (const pageUrl of categoryPages) {
    console.log(`\n📄 Scraping category: ${pageUrl}`);
    await sleep(2000); // 2s giữa các page

    const scraped = await scrapeScholarshipListPage(pageUrl);

    // Deduplicate và filter
    for (const s of scraped) {
      const key = s.title.toLowerCase().replace(/\s+/g, ' ').trim();
      if (!seen.has(key)) {
        seen.add(key);
        allScholarships.push(s);
      }
    }

    if (allScholarships.length >= SCRAPE_COUNT) break;
  }

  // Limit to requested count
  const result = allScholarships.slice(0, SCRAPE_COUNT);

  console.log(`\n✅ Scraping complete! Total scraped: ${result.length}`);

  // In sample
  console.log('\n📋 Sample scraped scholarships:');
  result.slice(0, 5).forEach((s, i) => {
    console.log(
      `  ${i + 1}. [${s.degree}] ${s.title} | ${s.provider} | ${s.country} | Deadline: ${s.deadline}`
    );
  });

  return result;
}

// ═══════════════════════════════════════════════════════════════
// SECTION 2: MOCK SEED DATA (50 scholarships)
// ═══════════════════════════════════════════════════════════════

const mockScholarships = [
  // ─── USA ───────────────────────────────────────────────────────────
  {
    title: 'Fulbright Scholar Program 2026',
    provider: 'U.S. Department of State',
    country: 'USA',
    city: 'Washington D.C.',
    university: null,
    degree: 'PhD',
    field_of_study: 'Any',
    amount: randFloat(30000, 80000),
    currency: 'USD',
    coverage: 'Full',
    deadline: randDate(new Date('2026-03-28'), new Date('2026-06-30')),
    intake: 'Fall 2026',
    language: 'English',
    min_gpa: 3.5,
    min_ielts: 7.0,
    eligibility:
      'Vietnamese citizens with a Bachelor degree or equivalent; minimum 5 years of professional experience.',
    requirements:
      'Online application, research proposal (2-3 pages), three letters of recommendation, academic transcripts.',
    benefits:
      'Tuition waiver, monthly stipend ($2,000-$3,500), travel allowance, health insurance.',
    application_url: 'https://apply.usembassy.gov/',
    image_url: 'https://images.unsplash.com/photo-1564981797816-1043664bf78d?w=800',
    is_featured: true,
    is_active: true,
    source: 'own',
  },
  {
    title: 'Harvard Kennedy School Scholarships',
    provider: 'Harvard University',
    country: 'USA',
    city: 'Cambridge',
    university: 'Harvard University',
    degree: 'Master',
    field_of_study: 'Public Policy',
    amount: 75000,
    currency: 'USD',
    coverage: 'Full',
    deadline: randDate(new Date('2026-03-28'), new Date('2026-05-15')),
    intake: 'Fall 2026',
    language: 'English',
    min_gpa: 3.7,
    min_ielts: 7.5,
    eligibility: 'International applicants with a Bachelor degree; demonstrated leadership and public service commitment.',
    requirements: 'GMAT/GRE scores, essays, CV, recommendation letters, interview.',
    benefits: 'Full tuition, living stipend, health insurance, career coaching.',
    application_url: 'https://www.hks.harvard.edu/application',
    image_url: 'https://images.unsplash.com/photo-1564981797816-1043664bf78d?w=800',
    is_featured: true,
    is_active: true,
    source: 'own',
  },
  {
    title: 'Yale World Fellows Program',
    provider: 'Yale University',
    country: 'USA',
    city: 'New Haven',
    university: 'Yale University',
    degree: 'Any',
    field_of_study: 'Leadership',
    amount: randFloat(20000, 45000),
    currency: 'USD',
    coverage: 'Full',
    deadline: randDate(new Date('2026-03-28'), new Date('2026-04-30')),
    intake: 'Fall 2026',
    language: 'English',
    min_gpa: 3.3,
    min_ielts: 7.0,
    eligibility: 'Mid-career professionals from any country with at least 5 years of experience.',
    requirements: 'Online application, personal statement, professional biography, two letters of reference.',
    benefits: 'Residential fellowship, tuition, stipend, networking events.',
    application_url: 'https://worldfellows.yale.edu/apply',
    image_url: 'https://images.unsplash.com/photo-1564981797816-1043664bf78d?w=800',
    is_featured: false,
    is_active: true,
    source: 'own',
  },
  {
    title: 'MIT Schwarzman Scholars',
    provider: 'Massachusetts Institute of Technology',
    country: 'USA',
    city: 'Cambridge',
    university: 'MIT',
    degree: 'Master',
    field_of_study: 'Global Affairs',
    amount: randFloat(80000, 100000),
    currency: 'USD',
    coverage: 'Full',
    deadline: randDate(new Date('2026-03-28'), new Date('2026-04-30')),
    intake: 'Fall 2026',
    language: 'English',
    min_gpa: 3.5,
    min_ielts: 7.0,
    eligibility: 'Bachelor degree holders under 40; strong academic record and leadership potential.',
    requirements: 'Essays, transcripts, recommendations, video interview.',
    benefits: 'Full tuition, room and board, travel, field trips, stipends.',
    application_url: 'https://schwarzman.scholars.mit.edu/apply',
    image_url: 'https://images.unsplash.com/photo-1564981797816-1043664bf78d?w=800',
    is_featured: true,
    is_active: true,
    source: 'own',
  },
  {
    title: 'Stanford Knight-Hennessy Scholars',
    provider: 'Stanford University',
    country: 'USA',
    city: 'Stanford',
    university: 'Stanford University',
    degree: 'Master',
    field_of_study: 'Any',
    amount: randFloat(60000, 90000),
    currency: 'USD',
    coverage: 'Full',
    deadline: randDate(new Date('2026-03-28'), new Date('2026-05-31')),
    intake: 'Fall 2026',
    language: 'English',
    min_gpa: 3.6,
    min_ielts: 7.0,
    eligibility: 'Independent of citizenship; must have a Bachelor degree completed after Jan 2016.',
    requirements: 'Online application, personal essay, two recommendations, proof of funding.',
    benefits: 'Full tuition, living stipend, travel, leadership development program.',
    application_url: 'https://knight-hennessy.stanford.edu/apply',
    image_url: 'https://images.unsplash.com/photo-1564981797816-1043664bf78d?w=800',
    is_featured: true,
    is_active: true,
    source: 'own',
  },
  {
    title: 'Columbia University GSAS Fellowships',
    provider: 'Columbia University',
    country: 'USA',
    city: 'New York',
    university: 'Columbia University',
    degree: 'PhD',
    field_of_study: 'Humanities',
    amount: randFloat(35000, 55000),
    currency: 'USD',
    coverage: 'Full',
    deadline: randDate(new Date('2026-03-28'), new Date('2026-06-15')),
    intake: 'Fall 2026',
    language: 'English',
    min_gpa: 3.5,
    min_ielts: 7.0,
    eligibility: 'International PhD applicants in humanities disciplines.',
    requirements: 'Research proposal, writing sample, three recommendations, GRE scores.',
    benefits: 'Full tuition, annual stipend, health insurance.',
    application_url: 'https://gsas.columbia.edu/apply',
    image_url: 'https://images.unsplash.com/photo-1564981797816-1043664bf78d?w=800',
    is_featured: false,
    is_active: true,
    source: 'own',
  },
  {
    title: 'University of Michigan Rackham Merit Fellowship',
    provider: 'University of Michigan',
    country: 'USA',
    city: 'Ann Arbor',
    university: 'University of Michigan',
    degree: 'PhD',
    field_of_study: 'STEM',
    amount: randFloat(28000, 40000),
    currency: 'USD',
    coverage: 'Full',
    deadline: randDate(new Date('2026-03-28'), new Date('2026-07-01')),
    intake: 'Fall 2026',
    language: 'English',
    min_gpa: 3.4,
    min_ielts: 6.5,
    eligibility: 'U.S. citizens and permanent residents; underrepresented groups in STEM.',
    requirements: 'Research statement, transcripts, recommendations.',
    benefits: 'Full tuition waiver, stipend, health insurance.',
    application_url: 'https://rackham.umich.edu/admissions/',
    image_url: 'https://images.unsplash.com/photo-1564981797816-1043664bf78d?w=800',
    is_featured: false,
    is_active: true,
    source: 'own',
  },
  {
    title: 'Cornell University Graduate Fellowships',
    provider: 'Cornell University',
    country: 'USA',
    city: 'Ithaca',
    university: 'Cornell University',
    degree: 'Master',
    field_of_study: 'Agriculture',
    amount: randFloat(25000, 45000),
    currency: 'USD',
    coverage: 'Full',
    deadline: randDate(new Date('2026-03-28'), new Date('2026-05-31')),
    intake: 'Fall 2026',
    language: 'English',
    min_gpa: 3.3,
    min_ielts: 7.0,
    eligibility: "International students applying to Cornell's graduate programs.",
    requirements: 'SOP, transcripts, letters of recommendation.',
    benefits: 'Tuition coverage, stipend, research assistantship.',
    application_url: 'https://gradschool.cornell.edu/adstitute/',
    image_url: 'https://images.unsplash.com/photo-1564981797816-1043664bf78d?w=800',
    is_featured: false,
    is_active: true,
    source: 'own',
  },

  // ─── UK ──────────────────────────────────────────────────────────────
  {
    title: 'Chevening Scholarship 2026-2027',
    provider: 'UK Government (FCDO)',
    country: 'UK',
    city: 'London',
    university: null,
    degree: 'Master',
    field_of_study: 'Any',
    amount: null,
    currency: 'USD',
    coverage: 'Full',
    deadline: randDate(new Date('2026-03-28'), new Date('2026-05-01')),
    intake: 'Fall 2026',
    language: 'English',
    min_gpa: 3.5,
    min_ielts: 6.5,
    eligibility:
      'Vietnamese citizens with at least 2 years (2,800 hours) of work experience; hold a Bachelor degree.',
    requirements:
      'Online application, IELTS/TOEFL, university offer letter, references, essays (3 required).',
    benefits: 'Full tuition, living allowance (\u00a31,800/month), travel to UK, arrival allowance.',
    application_url: 'https://www.chevening.org/apply/',
    image_url: 'https://images.unsplash.com/photo-1587385744395-8c1e28c5d38b?w=800',
    is_featured: true,
    is_active: true,
    source: 'own',
  },
  {
    title: 'Commonwealth Scholarship & Fellowship',
    provider: 'Commonwealth Scholarship Commission',
    country: 'UK',
    city: 'London',
    university: null,
    degree: 'Master',
    field_of_study: 'Any',
    amount: randFloat(15000, 30000),
    currency: 'USD',
    coverage: 'Full',
    deadline: randDate(new Date('2026-03-28'), new Date('2026-04-30')),
    intake: 'Fall 2026',
    language: 'English',
    min_gpa: 3.3,
    min_ielts: 6.5,
    eligibility:
      'Citizen of a Commonwealth developing country; Bachelor degree with at least upper second class.',
    requirements: 'Application form, transcripts, employer endorsement, medical form.',
    benefits: 'Tuition, airfare, living stipend, clothing allowance.',
    application_url: 'https://cscuk.fcdo.gov.uk/how-to-apply/',
    image_url: 'https://images.unsplash.com/photo-1587385744395-8c1e28c5d38b?w=800',
    is_featured: false,
    is_active: true,
    source: 'own',
  },
  {
    title: 'Rhodes Scholarship at Oxford',
    provider: 'Rhodes Trust',
    country: 'UK',
    city: 'Oxford',
    university: 'University of Oxford',
    degree: 'Master',
    field_of_study: 'Any',
    amount: randFloat(20000, 55000),
    currency: 'USD',
    coverage: 'Full',
    deadline: randDate(new Date('2026-03-28'), new Date('2026-04-30')),
    intake: 'Fall 2026',
    language: 'English',
    min_gpa: 3.85,
    min_ielts: 7.5,
    eligibility:
      'Vietnamese citizens aged 18-24 with a Bachelor degree; demonstrated academic excellence, leadership, and character.',
    requirements:
      'Online application, full academic transcripts, personal statement, English test scores, endorsement.',
    benefits: 'Full tuition at Oxford, living stipend (\u00a318,000/year), airfare, health insurance.',
    application_url: 'https://www.rhodestrust.com/scholarships',
    image_url: 'https://images.unsplash.com/photo-1587385744395-8c1e28c5d38b?w=800',
    is_featured: true,
    is_active: true,
    source: 'own',
  },
  {
    title: 'Gates Cambridge Scholarship',
    provider: 'Bill & Melinda Gates Foundation',
    country: 'UK',
    city: 'Cambridge',
    university: 'University of Cambridge',
    degree: 'Master',
    field_of_study: 'Any',
    amount: randFloat(20000, 45000),
    currency: 'USD',
    coverage: 'Full',
    deadline: randDate(new Date('2026-03-28'), new Date('2026-05-31')),
    intake: 'Fall 2026',
    language: 'English',
    min_gpa: 3.6,
    min_ielts: 7.0,
    eligibility: 'Non-UK citizens with a Bachelor degree; strong academic and social leadership record.',
    requirements: 'CAMS application, Cambridge application, Gates Cambridge essay, references.',
    benefits: 'Full tuition, living stipend (\u00a317,500/year), airfare, family allowances.',
    application_url: 'https://www.gatescambridge.org/apply/',
    image_url: 'https://images.unsplash.com/photo-1587385744395-8c1e28c5d38b?w=800',
    is_featured: true,
    is_active: true,
    source: 'own',
  },
  {
    title: 'LSE Global Justice Scholarship',
    provider: 'London School of Economics',
    country: 'UK',
    city: 'London',
    university: 'LSE',
    degree: 'Master',
    field_of_study: 'International Development',
    amount: randFloat(15000, 25000),
    currency: 'USD',
    coverage: 'Partial',
    deadline: randDate(new Date('2026-03-28'), new Date('2026-05-15')),
    intake: 'Fall 2026',
    language: 'English',
    min_gpa: 3.3,
    min_ielts: 7.0,
    eligibility: 'International students with a Bachelor in related social sciences.',
    requirements: 'Online application, personal statement, transcripts, references.',
    benefits: 'Partial tuition fee waiver, stipend.',
    application_url: 'https://www.lse.ac.uk/study-at-lse/Graduate/Fees-and-funding',
    image_url: 'https://images.unsplash.com/photo-1587385744395-8c1e28c5d38b?w=800',
    is_featured: false,
    is_active: true,
    source: 'own',
  },
  {
    title: "Warwick Chancellor's International Scholarship",
    provider: 'University of Warwick',
    country: 'UK',
    city: 'Coventry',
    university: 'University of Warwick',
    degree: 'PhD',
    field_of_study: 'STEM',
    amount: randFloat(20000, 35000),
    currency: 'USD',
    coverage: 'Full',
    deadline: randDate(new Date('2026-03-28'), new Date('2026-05-31')),
    intake: 'Fall 2026',
    language: 'English',
    min_gpa: 3.5,
    min_ielts: 6.5,
    eligibility: 'International PhD applicants to Warwick with strong research proposal.',
    requirements: 'Research proposal, academic references, transcripts.',
    benefits: 'Full tuition waiver, stipend.',
    application_url: 'https://warwick.ac.uk/funding/scholarships/science/',
    image_url: 'https://images.unsplash.com/photo-1587385744395-8c1e28c5d38b?w=800',
    is_featured: false,
    is_active: true,
    source: 'own',
  },

  // ─── Australia ───────────────────────────────────────────────────────
  {
    title: 'Australia Awards Scholarships 2026',
    provider: 'Australian Government (DFAT)',
    country: 'Australia',
    city: 'Canberra',
    university: null,
    degree: 'Master',
    field_of_study: 'Any',
    amount: null,
    currency: 'USD',
    coverage: 'Full',
    deadline: randDate(new Date('2026-03-28'), new Date('2026-04-30')),
    intake: 'Fall 2026',
    language: 'English',
    min_gpa: 3.0,
    min_ielts: 6.5,
    eligibility:
      'Vietnamese citizens meeting the Australia Awards eligibility criteria; must return to Vietnam for 2 years after study.',
    requirements: 'Online application, country-specific requirements, medical clearance.',
    benefits: 'Full tuition, return airfare, living allowance, establishment allowance.',
    application_url: 'https://www.australiaawardsaustralia.org/',
    image_url: 'https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=800',
    is_featured: true,
    is_active: true,
    source: 'own',
  },
  {
    title: 'University of Melbourne Graduate Scholarships',
    provider: 'University of Melbourne',
    country: 'Australia',
    city: 'Melbourne',
    university: 'University of Melbourne',
    degree: 'Master',
    field_of_study: 'Any',
    amount: randFloat(8000, 25000),
    currency: 'USD',
    coverage: 'Partial',
    deadline: randDate(new Date('2026-03-28'), new Date('2026-05-31')),
    intake: 'Fall 2026',
    language: 'English',
    min_gpa: 3.2,
    min_ielts: 6.5,
    eligibility: 'International students applying for graduate coursework at Melbourne.',
    requirements: 'Course application, academic transcripts, personal statement.',
    benefits: 'Tuition fee remission, living allowance.',
    application_url: 'https://scholarships.unimelb.edu.au/graduate/',
    image_url: 'https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=800',
    is_featured: false,
    is_active: true,
    source: 'own',
  },
  {
    title: 'ANU College of Business & Economics Scholarship',
    provider: 'Australian National University',
    country: 'Australia',
    city: 'Canberra',
    university: 'ANU',
    degree: 'Master',
    field_of_study: 'Business',
    amount: randFloat(10000, 20000),
    currency: 'USD',
    coverage: 'Partial',
    deadline: randDate(new Date('2026-03-28'), new Date('2026-05-15')),
    intake: 'Fall 2026',
    language: 'English',
    min_gpa: 3.3,
    min_ielts: 6.5,
    eligibility: 'International students with strong GMAT/GRE or prior business degree.',
    requirements: 'GMAT/GRE scores, CV, personal statement, references.',
    benefits: 'Tuition fee reduction (25%-50%).',
    application_url: 'https://www.anu.edu.au/students/scholarships',
    image_url: 'https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=800',
    is_featured: false,
    is_active: true,
    source: 'own',
  },

  // ─── Canada ──────────────────────────────────────────────────────────
  {
    title: 'Vanier Canada Graduate Scholarships',
    provider: 'Canada Government (CIHR, NSERC, SSHRC)',
    country: 'Canada',
    city: 'Ottawa',
    university: null,
    degree: 'PhD',
    field_of_study: 'STEM',
    amount: 50000,
    currency: 'USD',
    coverage: 'Full',
    deadline: randDate(new Date('2026-03-28'), new Date('2026-04-30')),
    intake: 'Fall 2026',
    language: 'English',
    min_gpa: 3.5,
    min_ielts: 6.5,
    eligibility:
      "International PhD students with a Bachelor and Master degree; leadership and research excellence.",
    requirements: 'Research proposal, leadership statement, supervisor nomination, transcripts.',
    benefits: 'CAD $50,000/year for 3 years.',
    application_url: 'https://www.vanier.gc.ca/en/how_to_apply.html',
    image_url: 'https://images.unsplash.com/photo-1517935706615-2717063c2225?w=800',
    is_featured: true,
    is_active: true,
    source: 'own',
  },
  {
    title: 'Lester Pearson International Scholarship',
    provider: 'University of Toronto',
    country: 'Canada',
    city: 'Toronto',
    university: 'University of Toronto',
    degree: 'Bachelor',
    field_of_study: 'Any',
    amount: randFloat(25000, 60000),
    currency: 'USD',
    coverage: 'Full',
    deadline: randDate(new Date('2026-03-28'), new Date('2026-04-15')),
    intake: 'Fall 2026',
    language: 'English',
    min_gpa: 3.8,
    min_ielts: 6.5,
    eligibility: 'International high school students with exceptional academic achievement and leadership.',
    requirements: 'Nomination by high school, application to U of T, supplementary form.',
    benefits: 'Full tuition, books, living expenses for 4 years.',
    application_url: 'https://future.utoronto.ca/pearson/',
    image_url: 'https://images.unsplash.com/photo-1517935706615-2717063c2225?w=800',
    is_featured: true,
    is_active: true,
    source: 'own',
  },
  {
    title: 'UBC International Leader of Tomorrow Award',
    provider: 'University of British Columbia',
    country: 'Canada',
    city: 'Vancouver',
    university: 'UBC',
    degree: 'Bachelor',
    field_of_study: 'Any',
    amount: randFloat(20000, 50000),
    currency: 'USD',
    coverage: 'Full',
    deadline: randDate(new Date('2026-03-28'), new Date('2026-04-30')),
    intake: 'Fall 2026',
    language: 'English',
    min_gpa: 3.6,
    min_ielts: 6.5,
    eligibility: 'International students with outstanding academic and leadership achievements entering UBC for the first time.',
    requirements: 'Nominations from high school, online application, financial need documentation.',
    benefits: 'Full tuition plus residence and living costs.',
    application_url: 'https://you.ubc.ca/financial-planning/scholarships-awards/international-leader-of-tomorrow/',
    image_url: 'https://images.unsplash.com/photo-1517935706615-2717063c2225?w=800',
    is_featured: false,
    is_active: true,
    source: 'own',
  },
  {
    title: 'McGill University Entrance Scholarships',
    provider: 'McGill University',
    country: 'Canada',
    city: 'Montreal',
    university: 'McGill University',
    degree: 'Bachelor',
    field_of_study: 'Any',
    amount: randFloat(8000, 20000),
    currency: 'USD',
    coverage: 'Partial',
    deadline: randDate(new Date('2026-03-28'), new Date('2026-05-01')),
    intake: 'Fall 2026',
    language: 'English',
    min_gpa: 3.5,
    min_ielts: 6.5,
    eligibility: 'International undergraduate applicants with excellent academic record.',
    requirements: 'Automatic consideration upon application; no separate form required.',
    benefits: 'Tuition fee reduction ranging from CAD $3,000 to $12,000.',
    application_url: 'https://www.mcgill.ca/studentaid/scholarships',
    image_url: 'https://images.unsplash.com/photo-1517935706615-2717063c2225?w=800',
    is_featured: false,
    is_active: true,
    source: 'own',
  },

  // ─── Germany ────────────────────────────────────────────────────────
  {
    title: 'DAAD Helmut Schmidt Programme',
    provider: 'DAAD (German Academic Exchange Service)',
    country: 'Germany',
    city: 'Bonn',
    university: null,
    degree: 'Master',
    field_of_study: 'Public Policy',
    amount: randFloat(1000, 2000) * 10,
    currency: 'USD',
    coverage: 'Full',
    deadline: randDate(new Date('2026-03-28'), new Date('2026-05-01')),
    intake: 'Fall 2026',
    language: 'English',
    min_gpa: 3.0,
    min_ielts: 6.5,
    eligibility: 'Graduates from developing countries; leadership potential; Bachelor degree.',
    requirements: 'Online application, university admission, references, CV.',
    benefits: 'Monthly stipend (\u20ac1,200), tuition waiver, travel allowance, health insurance.',
    application_url: 'https://www.daad.de/ausland/scholarships/helmut-schmidt/en/',
    image_url: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=800',
    is_featured: true,
    is_active: true,
    source: 'own',
  },
  {
    title: 'DAAD EPOS Scholarship',
    provider: 'DAAD (German Academic Exchange Service)',
    country: 'Germany',
    city: 'Bonn',
    university: null,
    degree: 'Master',
    field_of_study: 'Development',
    amount: randFloat(1000, 2000) * 10,
    currency: 'USD',
    coverage: 'Full',
    deadline: randDate(new Date('2026-03-28'), new Date('2026-05-01')),
    intake: 'Fall 2026',
    language: 'English',
    min_gpa: 3.0,
    min_ielts: 6.0,
    eligibility: 'Graduates from developing countries with 2+ years of professional experience.',
    requirements: 'Application through DAAD portal, university admission, employment references.',
    benefits: 'Monthly stipend (\u20ac1,200), tuition, insurance, travel.',
    application_url: 'https://www.daad.de/ausland/scholarships/epos/en/',
    image_url: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=800',
    is_featured: false,
    is_active: true,
    source: 'own',
  },
  {
    title: "Heinrich B\u00f6ll Foundation Master's Scholarship",
    provider: 'Heinrich B\u00f6ll Foundation',
    country: 'Germany',
    city: 'Berlin',
    university: null,
    degree: 'Master',
    field_of_study: 'Environment',
    amount: randFloat(1000, 1800) * 10,
    currency: 'USD',
    coverage: 'Full',
    deadline: randDate(new Date('2026-03-28'), new Date('2026-05-31')),
    intake: 'Fall 2026',
    language: 'English',
    min_gpa: 3.0,
    min_ielts: 6.0,
    eligibility: 'International students admitted to a German university; motivation for environmental/social policy.',
    requirements: 'Online application, university admission letter, essay on motivation, references.',
    benefits: 'Monthly stipend (\u20ac1,350), family allowance if applicable.',
    application_url: 'https://www.boell.de/en/scholarships',
    image_url: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=800',
    is_featured: false,
    is_active: true,
    source: 'own',
  },
  {
    title: 'Konrad-Adenauer-Stiftung Scholarship',
    provider: 'Konrad-Adenauer-Stiftung',
    country: 'Germany',
    city: 'Berlin',
    university: null,
    degree: 'Master',
    field_of_study: 'Political Science',
    amount: randFloat(1000, 1800) * 10,
    currency: 'USD',
    coverage: 'Full',
    deadline: randDate(new Date('2026-03-28'), new Date('2026-05-15')),
    intake: 'Fall 2026',
    language: 'English',
    min_gpa: 3.2,
    min_ielts: 6.5,
    eligibility: 'International students with excellent academic record; leadership in political or civic engagement.',
    requirements: 'Application via online portal, CV, academic records, motivational letter.',
    benefits: 'Monthly stipend (\u20ac1,350), tuition waiver, seminar programme.',
    application_url: 'https://www.kas.de/en/scholarships',
    image_url: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=800',
    is_featured: false,
    is_active: true,
    source: 'own',
  },

  // ─── Netherlands ────────────────────────────────────────────────────
  {
    title: 'Holland Scholarship (HS) 2026-2027',
    provider: 'Dutch Ministry of Education, Culture and Science',
    country: 'Netherlands',
    city: 'The Hague',
    university: null,
    degree: 'Master',
    field_of_study: 'Any',
    amount: 5000,
    currency: 'USD',
    coverage: 'Partial',
    deadline: randDate(new Date('2026-03-28'), new Date('2026-05-01')),
    intake: 'Fall 2026',
    language: 'English',
    min_gpa: 3.0,
    min_ielts: 6.5,
    eligibility: "Non-EU/EEA students admitted to a Dutch research university for a Master's programme.",
    requirements: 'Nomination by Dutch university, motivation letter, CV.',
    benefits: 'One-time payment of \u20ac5,000.',
    application_url: 'https://www.studyinholland.nl/scholarships/holland-scholarship',
    image_url: 'https://images.unsplash.com/photo-1521198711515-3e14c5dcc8bb?w=800',
    is_featured: false,
    is_active: true,
    source: 'own',
  },
  {
    title: 'Erasmus Mundus Joint Master Degrees',
    provider: 'European Commission',
    country: 'Netherlands',
    city: 'Rotterdam',
    university: null,
    degree: 'Master',
    field_of_study: 'Any',
    amount: randFloat(800, 1500) * 10,
    currency: 'USD',
    coverage: 'Full',
    deadline: randDate(new Date('2026-03-28'), new Date('2026-05-31')),
    intake: 'Fall 2026',
    language: 'English',
    min_gpa: 3.0,
    min_ielts: 6.5,
    eligibility: "Students from any country applying to an Erasmus Mundus Joint Master programme.",
    requirements: "Apply through the specific programme's website; EU/non-EU eligible.",
    benefits: 'Contribution to travel, installation and other costs, monthly stipend.',
    application_url: 'https://www.eacea.ec.europa.eu/subsides/emjd',
    image_url: 'https://images.unsplash.com/photo-1521198711515-3e14c5dcc8bb?w=800',
    is_featured: true,
    is_active: true,
    source: 'own',
  },
  {
    title: 'Delft University of Technology Excellence Scholarship',
    provider: 'TU Delft',
    country: 'Netherlands',
    city: 'Delft',
    university: 'TU Delft',
    degree: 'Master',
    field_of_study: 'Engineering',
    amount: randFloat(10000, 25000),
    currency: 'USD',
    coverage: 'Full',
    deadline: randDate(new Date('2026-03-28'), new Date('2026-05-01')),
    intake: 'Fall 2026',
    language: 'English',
    min_gpa: 3.5,
    min_ielts: 6.5,
    eligibility: "International non-EU Master's applicants with excellent academic record.",
    requirements: 'Application for admission + scholarship application form.',
    benefits: 'Full tuition waiver + monthly allowance (\u20ac900/month) for 2 years.',
    application_url: 'https://www.tudelft.nl/scholarships',
    image_url: 'https://images.unsplash.com/photo-1521198711515-3e14c5dcc8bb?w=800',
    is_featured: false,
    is_active: true,
    source: 'own',
  },

  // ─── France ─────────────────────────────────────────────────────────
  {
    title: '\u00c9iffel Excellence Scholarship Program',
    provider: 'Campus France',
    country: 'France',
    city: 'Paris',
    university: null,
    degree: 'Master',
    field_of_study: 'Any',
    amount: randFloat(1000, 1800) * 10,
    currency: 'USD',
    coverage: 'Full',
    deadline: randDate(new Date('2026-03-28'), new Date('2026-04-30')),
    intake: 'Fall 2026',
    language: 'English',
    min_gpa: 3.2,
    min_ielts: 6.5,
    eligibility: 'Non-French nationals under 30; admitted to a French higher education institution.',
    requirements: 'Nominated by French institution; must submit via Campus France.',
    benefits: 'Monthly stipend (\u20ac1,181), health insurance, round-trip flights.',
    application_url: 'https://www.campusfrance.org/en/eiffel-scholarship',
    image_url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800',
    is_featured: true,
    is_active: true,
    source: 'own',
  },
  {
    title: 'PSL University Master Scholarship',
    provider: 'Universit\u00e9 Paris Sciences et Lettres',
    country: 'France',
    city: 'Paris',
    university: 'PSL University',
    degree: 'Master',
    field_of_study: 'Science',
    amount: randFloat(800, 1500) * 10,
    currency: 'USD',
    coverage: 'Partial',
    deadline: randDate(new Date('2026-03-28'), new Date('2026-05-31')),
    intake: 'Fall 2026',
    language: 'English',
    min_gpa: 3.0,
    min_ielts: 6.0,
    eligibility: "International Master's applicants with strong academic background.",
    requirements: 'Application via PSL portal, CV, personal statement.',
    benefits: 'Monthly stipend (\u20ac1,000-1,200) for up to 2 years.',
    application_url: 'https://www.psl.eu/en/admission/scholarships',
    image_url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800',
    is_featured: false,
    is_active: true,
    source: 'own',
  },

  // ─── Japan ───────────────────────────────────────────────────────────
  {
    title: 'MEXT University Recommendation Scholarship',
    provider: 'Japanese Ministry of Education (MEXT)',
    country: 'Japan',
    city: 'Tokyo',
    university: null,
    degree: 'Master',
    field_of_study: 'Any',
    amount: randFloat(140000, 180000) / 100,
    currency: 'USD',
    coverage: 'Full',
    deadline: randDate(new Date('2026-03-28'), new Date('2026-05-15')),
    intake: 'Fall 2026',
    language: 'English',
    min_gpa: 3.0,
    min_ielts: 6.5,
    eligibility: 'Vietnamese nationals aged 35 or below; university recommendation required.',
    requirements: 'University nomination, application form, academic transcripts, research plan.',
    benefits: 'Full tuition, monthly allowance (\u00a5143,000/month), travel expenses.',
    application_url: 'https://www.studyinjapan.go.jp/en/smap4j-001.html',
    image_url: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800',
    is_featured: true,
    is_active: true,
    source: 'own',
  },
  {
    title: 'Kyoto University ASEAN Scholarship',
    provider: 'Kyoto University',
    country: 'Japan',
    city: 'Kyoto',
    university: 'Kyoto University',
    degree: 'Master',
    field_of_study: 'Any',
    amount: randFloat(140000, 170000) / 100,
    currency: 'USD',
    coverage: 'Full',
    deadline: randDate(new Date('2026-03-28'), new Date('2026-05-31')),
    intake: 'Fall 2026',
    language: 'English',
    min_gpa: 3.3,
    min_ielts: 6.5,
    eligibility: 'Students from ASEAN countries applying for graduate programmes at Kyoto University.',
    requirements: "Graduate school application + separate scholarship form.",
    benefits: 'Tuition waiver, monthly stipend (\u00a5120,000), travel grant.',
    application_url: 'https://www.kyoto-u.ac.jp/en/admissions/scholarships',
    image_url: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800',
    is_featured: false,
    is_active: true,
    source: 'own',
  },
  {
    title: 'University of Tokyo Graduate Scholarship',
    provider: 'University of Tokyo',
    country: 'Japan',
    city: 'Tokyo',
    university: 'University of Tokyo',
    degree: 'PhD',
    field_of_study: 'STEM',
    amount: randFloat(140000, 180000) / 100,
    currency: 'USD',
    coverage: 'Full',
    deadline: randDate(new Date('2026-03-28'), new Date('2026-06-30')),
    intake: 'Fall 2026',
    language: 'English',
    min_gpa: 3.5,
    min_ielts: 6.5,
    eligibility: "International PhD applicants with a Master's degree in a STEM field.",
    requirements: 'Application via UTAS portal, research proposal, supervisor approval.',
    benefits: 'Tuition waiver, monthly stipend (\u00a5150,000), international conference support.',
    application_url: 'https://www.u-tokyo.ac.jp/en/prospective-students/scholarships.html',
    image_url: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800',
    is_featured: false,
    is_active: true,
    source: 'own',
  },

  // ─── Singapore ──────────────────────────────────────────────────────
  {
    title: 'ASEAN Undergraduate Scholarship',
    provider: 'National University of Singapore',
    country: 'Singapore',
    city: 'Singapore',
    university: 'NUS',
    degree: 'Bachelor',
    field_of_study: 'Any',
    amount: randFloat(10000, 20000),
    currency: 'USD',
    coverage: 'Full',
    deadline: randDate(new Date('2026-03-28'), new Date('2026-04-30')),
    intake: 'Fall 2026',
    language: 'English',
    min_gpa: 3.5,
    min_ielts: 7.0,
    eligibility: 'Citizens of ASEAN member states (excluding Singapore) applying for NUS undergraduate programmes.',
    requirements: 'Application to NUS, separate scholarship application.',
    benefits: 'Tuition fees, annual living allowance (SGD 5,800), hostel fees.',
    application_url: 'https://www.nus.edu.sg/admissions/scholarships',
    image_url: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800',
    is_featured: false,
    is_active: true,
    source: 'own',
  },
  {
    title: 'NUS Graduate School (NUSGS) Scholarships',
    provider: 'National University of Singapore',
    country: 'Singapore',
    city: 'Singapore',
    university: 'NUS',
    degree: 'PhD',
    field_of_study: 'STEM',
    amount: randFloat(2000, 3000) * 10,
    currency: 'USD',
    coverage: 'Full',
    deadline: randDate(new Date('2026-03-28'), new Date('2026-06-30')),
    intake: 'Fall 2026',
    language: 'English',
    min_gpa: 3.5,
    min_ielts: 6.5,
    eligibility: "International PhD applicants with a Bachelor or Master's degree.",
    requirements: 'Online application, research proposal, GRE scores, references.',
    benefits: 'Monthly stipend (SGD 2,000-2,700), tuition waiver, conference allowance.',
    application_url: 'https://www.nus.edu.sg/admissions/graduate/scholarships',
    image_url: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800',
    is_featured: true,
    is_active: true,
    source: 'own',
  },
  {
    title: 'Lee Kuan Yew School Merit Scholarship',
    provider: 'Lee Kuan Yew School of Public Policy',
    country: 'Singapore',
    city: 'Singapore',
    university: 'NUS',
    degree: 'Master',
    field_of_study: 'Public Policy',
    amount: randFloat(30000, 50000),
    currency: 'USD',
    coverage: 'Full',
    deadline: randDate(new Date('2026-03-28'), new Date('2026-05-01')),
    intake: 'Fall 2026',
    language: 'English',
    min_gpa: 3.5,
    min_ielts: 7.0,
    eligibility: 'Outstanding students with demonstrated leadership and commitment to public service.',
    requirements: 'LKY School application, essay on public service, references.',
    benefits: 'Full tuition, living stipend, laptop, health insurance.',
    application_url: 'https://lkyspp.nus.edu.sg/admissions/scholarships',
    image_url: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800',
    is_featured: true,
    is_active: true,
    source: 'own',
  },

  // ─── Sweden ──────────────────────────────────────────────────────────
  {
    title: 'Swedish Institute Scholarships (SI) 2026',
    provider: 'Swedish Institute',
    country: 'Sweden',
    city: 'Stockholm',
    university: null,
    degree: 'Master',
    field_of_study: 'Any',
    amount: randFloat(8000, 12000),
    currency: 'USD',
    coverage: 'Full',
    deadline: randDate(new Date('2026-03-28'), new Date('2026-05-01')),
    intake: 'Fall 2026',
    language: 'English',
    min_gpa: 3.2,
    min_ielts: 6.5,
    eligibility:
      'Citizens of selected countries (including Vietnam); work experience of at least 3,000 hours; Bachelor degree.',
    requirements: 'Online application via Swedish Institute portal, university admission.',
    benefits: 'Full tuition, living expenses (SEK 12,000/month), travel grant, health insurance.',
    application_url: 'https://si.se/en/apply/scholarships/swedish-institute-scholarships/',
    image_url: 'https://images.unsplash.com/photo-1527838832700-5059252407fa?w=800',
    is_featured: true,
    is_active: true,
    source: 'own',
  },
  {
    title: 'Uppsala University IPK Scholarship',
    provider: 'Uppsala University',
    country: 'Sweden',
    city: 'Uppsala',
    university: 'Uppsala University',
    degree: 'Master',
    field_of_study: 'Any',
    amount: randFloat(8000, 20000),
    currency: 'USD',
    coverage: 'Partial',
    deadline: randDate(new Date('2026-03-28'), new Date('2026-05-01')),
    intake: 'Fall 2026',
    language: 'English',
    min_gpa: 3.0,
    min_ielts: 6.5,
    eligibility: "Non-EU/EEA students admitted to Uppsala University's Master's programmes.",
    requirements: 'University application first; scholarship application follows automatically.',
    benefits: 'Covers tuition fees for 2 years.',
    application_url: 'https://www.uu.se/en/admissions/scholarships/uppsala-university-ipk/',
    image_url: 'https://images.unsplash.com/photo-1527838832700-5059252407fa?w=800',
    is_featured: false,
    is_active: true,
    source: 'own',
  },

  // ─── Ireland ────────────────────────────────────────────────────────
  {
    title: 'Government of Ireland International Education Scholarship',
    provider: 'Higher Education Authority (Ireland)',
    country: 'Ireland',
    city: 'Dublin',
    university: null,
    degree: 'Master',
    field_of_study: 'Any',
    amount: randFloat(10000, 18000),
    currency: 'USD',
    coverage: 'Full',
    deadline: randDate(new Date('2026-03-28'), new Date('2026-04-30')),
    intake: 'Fall 2026',
    language: 'English',
    min_gpa: 3.3,
    min_ielts: 6.5,
    eligibility: 'Non-EU students with an offer from an Irish higher education institution.',
    requirements: 'Online application, proof of offer, personal statement.',
    benefits: 'Full tuition fee waiver, \u20ac10,000 subsistence award for one academic year.',
    application_url: 'https://hea.ie/skills-and-talent/government-of-ireland-international-education-scholarships/',
    image_url: 'https://images.unsplash.com/photo-1509023464722-18d996393ca8?w=800',
    is_featured: false,
    is_active: true,
    source: 'own',
  },
  {
    title: 'Trinity College Dublin Global Excellence Scholarship',
    provider: 'Trinity College Dublin',
    country: 'Ireland',
    city: 'Dublin',
    university: 'Trinity College Dublin',
    degree: 'Master',
    field_of_study: 'Any',
    amount: randFloat(5000, 15000),
    currency: 'USD',
    coverage: 'Partial',
    deadline: randDate(new Date('2026-03-28'), new Date('2026-05-31')),
    intake: 'Fall 2026',
    language: 'English',
    min_gpa: 3.3,
    min_ielts: 6.5,
    eligibility: 'Non-EU international students with excellent academic record.',
    requirements: 'Automatic consideration upon application to TCD.',
    benefits: '50%-100% tuition fee reduction.',
    application_url: 'https://www.tcd.ie/study/international/scholarships/',
    image_url: 'https://images.unsplash.com/photo-1509023464722-18d996393ca8?w=800',
    is_featured: false,
    is_active: true,
    source: 'own',
  },

  // ─── Switzerland ────────────────────────────────────────────────────
  {
    title: 'Swiss Government Excellence Scholarships',
    provider: 'Swiss Federal Department of Economic Affairs (FDEA)',
    country: 'Switzerland',
    city: 'Bern',
    university: null,
    degree: 'PhD',
    field_of_study: 'Any',
    amount: randFloat(1800, 2500) * 10,
    currency: 'USD',
    coverage: 'Full',
    deadline: randDate(new Date('2026-03-28'), new Date('2026-05-01')),
    intake: 'Fall 2026',
    language: 'English',
    min_gpa: 3.5,
    min_ielts: 6.5,
    eligibility: "Researchers with a Master's degree from a recognised university; nominated by a Swiss professor.",
    requirements: 'Research plan, CV, letters of recommendation, nomination letter from Swiss host professor.',
    benefits: 'Monthly stipend (CHF 1,920), health insurance, airfare.',
    application_url: 'https://www.sbfi.admin.ch/sbfi/en/home/education/scholarships_and_grants/swiss-government-excellence.html',
    image_url: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=800',
    is_featured: true,
    is_active: true,
    source: 'own',
  },

  // ─── New Zealand ────────────────────────────────────────────────────
  {
    title: 'New Zealand International Scholarships (NZIS)',
    provider: 'Ministry of Foreign Affairs & Trade (MFAT)',
    country: 'New Zealand',
    city: 'Wellington',
    university: null,
    degree: 'Master',
    field_of_study: 'Any',
    amount: null,
    currency: 'USD',
    coverage: 'Full',
    deadline: randDate(new Date('2026-03-28'), new Date('2026-04-30')),
    intake: 'Fall 2026',
    language: 'English',
    min_gpa: 3.0,
    min_ielts: 6.5,
    eligibility:
      'Citizens of developing countries (including Vietnam); return-home commitment; Bachelor degree with good GPA.',
    requirements: 'Online application via NZ Aid Portal, medical clearance, references.',
    benefits: 'Full tuition, living allowance, return airfare, health insurance.',
    application_url: 'https://www.mfat.govt.nz/en/aid-and-development/scholarships/',
    image_url: 'https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=800',
    is_featured: true,
    is_active: true,
    source: 'own',
  },
  {
    title: 'University of Auckland International Student Scholarship',
    provider: 'University of Auckland',
    country: 'New Zealand',
    city: 'Auckland',
    university: 'University of Auckland',
    degree: 'Master',
    field_of_study: 'Any',
    amount: randFloat(8000, 20000),
    currency: 'USD',
    coverage: 'Partial',
    deadline: randDate(new Date('2026-03-28'), new Date('2026-05-31')),
    intake: 'Fall 2026',
    language: 'English',
    min_gpa: 3.3,
    min_ielts: 6.5,
    eligibility: "International students with excellent academic results applying for a Master's by thesis.",
    requirements: 'Research proposal, academic transcripts, supervisor agreement.',
    benefits: 'Tuition fees for 1-2 years, living allowance.',
    application_url: 'https://www.auckland.ac.nz/en/study/scholarships-and-awards/',
    image_url: 'https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=800',
    is_featured: false,
    is_active: true,
    source: 'own',
  },

  // ─── Belgium ─────────────────────────────────────────────────────────
  {
    title: 'VLIR-UOS Scholarships for Master Programmes',
    provider: 'VLIR-UOS (Flanders government)',
    country: 'Belgium',
    city: 'Brussels',
    university: null,
    degree: 'Master',
    field_of_study: 'Development',
    amount: randFloat(800, 1500) * 10,
    currency: 'USD',
    coverage: 'Full',
    deadline: randDate(new Date('2026-03-28'), new Date('2026-04-30')),
    intake: 'Fall 2026',
    language: 'English',
    min_gpa: 3.0,
    min_ielts: 6.5,
    eligibility: 'Citizens of countries on the DAC list (including Vietnam); Bachelor degree; relevant work experience.',
    requirements: 'Online application, motivation letter, CV, references.',
    benefits: 'Full tuition, monthly stipend (\u20ac1,150), travel, insurance.',
    application_url: 'https://www.vliruos.be/en/scholarships',
    image_url: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800',
    is_featured: false,
    is_active: true,
    source: 'own',
  },

  // ─── Finland ────────────────────────────────────────────────────────
  {
    title: 'University of Helsinki Fully Funded Scholarships',
    provider: 'University of Helsinki',
    country: 'Finland',
    city: 'Helsinki',
    university: 'University of Helsinki',
    degree: 'Master',
    field_of_study: 'Any',
    amount: randFloat(8000, 15000),
    currency: 'USD',
    coverage: 'Full',
    deadline: randDate(new Date('2026-03-28'), new Date('2026-05-15')),
    intake: 'Fall 2026',
    language: 'English',
    min_gpa: 3.0,
    min_ielts: 6.5,
    eligibility: "Non-EU/EEA Master's programme applicants to the University of Helsinki.",
    requirements: "Apply to Master's programme; scholarship application via studyinfo.fi.",
    benefits: 'Tuition waiver + \u20ac6,000/year living cost support.',
    application_url: 'https://www.helsinki.fi/en/education/scholarships',
    image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    is_featured: false,
    is_active: true,
    source: 'own',
  },

  // ─── Norway ─────────────────────────────────────────────────────────
  {
    title: 'University of Oslo International Scholarship',
    provider: 'University of Oslo',
    country: 'Norway',
    city: 'Oslo',
    university: 'University of Oslo',
    degree: 'Master',
    field_of_study: 'Any',
    amount: randFloat(8000, 15000),
    currency: 'USD',
    coverage: 'Partial',
    deadline: randDate(new Date('2026-03-28'), new Date('2026-05-01')),
    intake: 'Fall 2026',
    language: 'English',
    min_gpa: 3.0,
    min_ielts: 6.5,
    eligibility: "Non-EU/EEA students applying to Master's programmes at UiO.",
    requirements: 'University admission application + scholarship application form.',
    benefits: 'Tuition fee reduction.',
    application_url: 'https://www.uio.no/english/studies/scholarships/',
    image_url: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=800',
    is_featured: false,
    is_active: true,
    source: 'own',
  },

  // ─── South Korea ────────────────────────────────────────────────────
  {
    title: 'Korean Government Scholarship Program (KGSP)',
    provider: 'NIIED (Korean Ministry of Education)',
    country: 'South Korea',
    city: 'Seoul',
    university: null,
    degree: 'Master',
    field_of_study: 'Any',
    amount: randFloat(800000, 1200000) / 1000,
    currency: 'USD',
    coverage: 'Full',
    deadline: randDate(new Date('2026-03-28'), new Date('2026-05-01')),
    intake: 'Fall 2026',
    language: 'English',
    min_gpa: 3.0,
    min_ielts: 6.5,
    eligibility: 'Vietnamese nationals under 40; Bachelor degree; healthy and of good character.',
    requirements: 'Application through Korean Embassy, university nomination, health certificate.',
    benefits: 'Full tuition, monthly allowance (KRW 900,000), airfare, settlement allowance.',
    application_url: 'https://www.studyinkorea.go.kr/en/sub/scholarship/infoDetail.do',
    image_url: 'https://images.unsplash.com/photo-1535962946867-b1e09db0abf9?w=800',
    is_featured: true,
    is_active: true,
    source: 'own',
  },

  // ─── Austria ────────────────────────────────────────────────────────
  {
    title: 'Austrian Development Cooperation Scholarships',
    provider: 'Austrian Development Cooperation (ADC)',
    country: 'Austria',
    city: 'Vienna',
    university: null,
    degree: 'Master',
    field_of_study: 'Development',
    amount: randFloat(800, 1400) * 10,
    currency: 'USD',
    coverage: 'Full',
    deadline: randDate(new Date('2026-03-28'), new Date('2026-04-30')),
    intake: 'Fall 2026',
    language: 'English',
    min_gpa: 3.0,
    min_ielts: 6.0,
    eligibility: 'Citizens of ADC priority countries (including Vietnam) with relevant work experience.',
    requirements: 'Application via Austrian Development Cooperation website, references.',
    benefits: 'Tuition waiver, monthly stipend (\u20ac1,150), health insurance, travel.',
    application_url: 'https://www.entwicklung.at/en/cooperation/scholarships/',
    image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    is_featured: false,
    is_active: true,
    source: 'own',
  },

  // ─── Spain ───────────────────────────────────────────────────────────
  {
    title: 'La Caixa Foundation Fellowships (INPhINIT)',
    provider: 'La Caixa Banking Foundation',
    country: 'Spain',
    city: 'Barcelona',
    university: null,
    degree: 'PhD',
    field_of_study: 'STEM',
    amount: randFloat(1200, 2000) * 10,
    currency: 'USD',
    coverage: 'Full',
    deadline: randDate(new Date('2026-03-28'), new Date('2026-05-01')),
    intake: 'Fall 2026',
    language: 'English',
    min_gpa: 3.5,
    min_ielts: 6.5,
    eligibility: 'Researchers who have not spent more than 12 months in Spain in the last 3 years.',
    requirements: 'Online application, research project, supervisor agreement, academic records.',
    benefits: 'Annual stipend (\u20ac22,400), tuition fees, training, mobility allowance.',
    application_url: 'https://fundacaolacaixa.org/en/inphinit',
    image_url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800',
    is_featured: false,
    is_active: true,
    source: 'own',
  },

  // ─── Italy ───────────────────────────────────────────────────────────
  {
    title: 'Politecnico di Milano Merit-Based Scholarships',
    provider: 'Politecnico di Milano',
    country: 'Italy',
    city: 'Milan',
    university: 'Politecnico di Milano',
    degree: 'Master',
    field_of_study: 'Engineering',
    amount: randFloat(5000, 15000),
    currency: 'USD',
    coverage: 'Partial',
    deadline: randDate(new Date('2026-03-28'), new Date('2026-05-31')),
    intake: 'Fall 2026',
    language: 'English',
    min_gpa: 3.3,
    min_ielts: 6.0,
    eligibility: 'Non-EU international students with excellent academic record in engineering.',
    requirements: 'Apply for admission; automatic scholarship consideration.',
    benefits: 'Tuition fee waiver (50%-100%).',
    application_url: 'https://www.polimi.it/en/scholarships',
    image_url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800',
    is_featured: false,
    is_active: true,
    source: 'own',
  },

  // ─── China ───────────────────────────────────────────────────────────
  {
    title: 'Chinese Government Scholarship (CSC)',
    provider: 'Chinese Scholarship Council (CSC)',
    country: 'China',
    city: 'Beijing',
    university: null,
    degree: 'Master',
    field_of_study: 'Any',
    amount: randFloat(1200, 2000) * 10,
    currency: 'USD',
    coverage: 'Full',
    deadline: randDate(new Date('2026-03-28'), new Date('2026-04-30')),
    intake: 'Fall 2026',
    language: 'English',
    min_gpa: 3.0,
    min_ielts: 6.0,
    eligibility: "Vietnamese citizens with a Bachelor's degree; under 35 for Master's programmes.",
    requirements: 'Online CSC application, university nomination, physical examination form.',
    benefits: 'Tuition waiver, accommodation, monthly stipend (\u00a53,000), health insurance.',
    application_url: 'https://www.csc.edu.cn/studyinchina',
    image_url: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=800',
    is_featured: true,
    is_active: true,
    source: 'own',
  },

  // ─── Taiwan ─────────────────────────────────────────────────────────
  {
    title: 'Taiwan International Humanitarian H Scholarship',
    provider: 'ICDF (International Cooperation and Development Fund)',
    country: 'Taiwan',
    city: 'Taipei',
    university: null,
    degree: 'Master',
    field_of_study: 'Development',
    amount: null,
    currency: 'USD',
    coverage: 'Full',
    deadline: randDate(new Date('2026-03-28'), new Date('2026-04-30')),
    intake: 'Fall 2026',
    language: 'English',
    min_gpa: 3.0,
    min_ielts: 6.0,
    eligibility: 'Citizens of ROC (Taiwan) diplomatic allies (including Vietnam); Bachelor degree; under 45.',
    requirements: 'Online application, health certificate, two reference letters.',
    benefits: 'Full tuition, housing allowance, textbooks, round-trip airfare, insurance.',
    application_url: 'https://www.icdf.org.tw/ct.asp?xItem=12505&ctNode=29880&mp=2',
    image_url: 'https://images.unsplash.com/photo-1501190209034-7d11e8a27f89?w=800',
    is_featured: false,
    is_active: true,
    source: 'own',
  },

  // ─── Poland ─────────────────────────────────────────────────────────
  {
    title: 'Polish National Agency for Academic Exchange (NAWA) Scholarship',
    provider: 'NAWA',
    country: 'Poland',
    city: 'Warsaw',
    university: null,
    degree: 'Master',
    field_of_study: 'Any',
    amount: randFloat(600, 1200) * 10,
    currency: 'USD',
    coverage: 'Full',
    deadline: randDate(new Date('2026-03-28'), new Date('2026-05-31')),
    intake: 'Fall 2026',
    language: 'English',
    min_gpa: 3.0,
    min_ielts: 6.0,
    eligibility: "International students admitted to Polish universities for Master's programmes.",
    requirements: 'University admission + NAWA application form, CV.',
    benefits: 'Monthly stipend (PLN 1,500), tuition waiver.',
    application_url: 'https://nawa.gov.pl/en/scholarships',
    image_url: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800',
    is_featured: false,
    is_active: true,
    source: 'own',
  },
];

// ═══════════════════════════════════════════════════════════════
// SECTION 3: VALIDATION
// ═══════════════════════════════════════════════════════════════

const VALID_DEGREES = ['Bachelor', 'Master', 'PhD', 'Any'];

function validateScholarship(s) {
  if (!VALID_DEGREES.includes(s.degree)) {
    throw new Error(
      `Invalid degree: "${s.degree}" — must be one of ${VALID_DEGREES.join(', ')}`
    );
  }
  if (s.min_gpa !== null && (s.min_gpa < 0 || s.min_gpa > 4.0)) {
    throw new Error(`min_gpa out of range (0-4.0): ${s.min_gpa}`);
  }
  if (s.deadline && new Date(s.deadline) <= new Date()) {
    throw new Error(`Deadline must be in the future: ${s.deadline}`);
  }
  if (s.currency !== 'USD') {
    throw new Error(`Currency must be USD, got: ${s.currency}`);
  }
}

// ═══════════════════════════════════════════════════════════════
// SECTION 4: DATABASE INSERTION
// ═══════════════════════════════════════════════════════════════

// pg direct client (cho local Docker)
const pgClient = new Client({
  host: process.env.PG_HOST || 'localhost',
  port: parseInt(process.env.PG_PORT || '5432'),
  database: process.env.PG_DATABASE || 'scholarsgo',
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || 'scholarsgo_password',
});

const scholarshipColumns = [
  'title', 'provider', 'country', 'city', 'university', 'degree',
  'field_of_study', 'amount', 'currency', 'coverage', 'deadline',
  'intake', 'language', 'min_gpa', 'min_ielts', 'eligibility',
  'requirements', 'benefits', 'application_url', 'image_url',
  'is_featured', 'is_active', 'source',
];

const toRow = (s) =>
  scholarshipColumns.map((col) => {
    const v = s[col];
    if (v === null || v === undefined) return null;
    if (typeof v === 'boolean') return v;
    if (typeof v === 'number') return v;
    return String(v);
  });

const colPlaceholders = scholarshipColumns.map((_, i) => `$${i + 1}`).join(', ');
const allCols = scholarshipColumns.join(', ');

// ── Insert via Supabase ───────────────────────────────────────────
async function insertViaSupabase(scholarships) {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not available');
  }

  const insertedRows = [];
  const errors = [];

  // Batch insert — Supabase max 1000 rows per request
  const BATCH = 100;
  for (let i = 0; i < scholarships.length; i += BATCH) {
    const batch = scholarships.slice(i, i + BATCH);
    try {
      const { data, error } = await supabaseAdmin
        .from('scholarships')
        .insert(batch)
        .select('id, title, country, degree');

      if (error) {
        errors.push({ batch: i / BATCH + 1, error: error.message });
      } else if (data) {
        insertedRows.push(...data);
      }
    } catch (err) {
      errors.push({ batch: i / BATCH + 1, error: err.message });
    }
  }

  return { insertedRows, errors };
}

// ── Insert via pg client ──────────────────────────────────────────
async function insertViaPg(scholarships) {
  const insertSQL = `
    INSERT INTO scholarships (${allCols})
    VALUES (${colPlaceholders})
    ON CONFLICT DO NOTHING
    RETURNING id, title, country, degree
  `;

  const insertedRows = [];
  const errors = [];

  for (const s of scholarships) {
    try {
      const res = await pgClient.query(insertSQL, toRow(s));
      if (res.rows.length > 0) {
        insertedRows.push(res.rows[0]);
      }
    } catch (err) {
      errors.push({ title: s.title, error: err.message });
    }
  }

  return { insertedRows, errors };
}

// ═══════════════════════════════════════════════════════════════
// SECTION 5: MAIN SEED FUNCTION
// ═══════════════════════════════════════════════════════════════

async function seed() {
  console.log('\n🚀 Starting ScholarsGo Scholarship Seed...\n');
  console.log(`📌 Mode: ${MODE_MOCK ? 'MOCK DATA ONLY' : MODE_SCRAPE_ONLY ? 'SCRAPE ONLY (no DB insert)' : 'SCRAPE + SEED'}\n`);

  // 1. Determine scholarship source
  let scholarshipsToInsert = [];

  if (MODE_MOCK) {
    console.log('📦 Using mock data (--mock flag)');
    scholarshipsToInsert = mockScholarships;
  } else {
    // Scrape from scholars4dev
    const scraped = await scrapeScholarships4Dev();
    scholarshipsToInsert = scraped;
  }

  // Skip DB insert if scrape-only mode
  if (MODE_SCRAPE_ONLY) {
    console.log(`\n✅ Scrape complete! ${scholarshipsToInsert.length} scholarships scraped.`);
    console.log('   (--scrape-only flag: skipping DB insert)');
    process.exit(0);
  }

  // 2. Validate env
  const hasSupabase = !!(
    process.env.SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    process.env.SUPABASE_URL.startsWith('http')
  );
  const hasPg = !!(process.env.PG_HOST || process.env.PG_PORT || process.env.PG_DATABASE);

  if (!hasSupabase && !hasPg) {
    console.error('❌ ERROR: No database connection configured.');
    console.error('   Set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (for Supabase cloud/local)');
    console.error('   OR set PG_HOST/PORT/DATABASE (for direct PostgreSQL)');
    process.exit(1);
  }

  // 3. Connect to PostgreSQL via pg
  console.log('📡 Connecting to PostgreSQL...');
  try {
    await pgClient.connect();
    console.log('✅ PostgreSQL connection OK\n');
  } catch (err) {
    console.error('❌ Cannot connect to PostgreSQL:', err.message);
    process.exit(1);
  }

  // 4. Check if scholarships table exists
  console.log('🔍 Checking scholarships table...');
  try {
    const res = await pgClient.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'scholarships'
      );`
    );
    if (!res.rows[0].exists) {
      console.error('❌ Table "scholarships" does not exist. Run your schema migration first.');
      await pgClient.end();
      process.exit(1);
    }
    console.log('✅ Table scholarships exists\n');
  } catch (err) {
    console.error('❌ Error checking table:', err.message);
    await pgClient.end();
    process.exit(1);
  }

  // 5. Validate all scholarships before insert
  console.log('🔍 Validating scholarship data...');
  scholarshipsToInsert.forEach((s, i) => {
    try {
      validateScholarship(s);
    } catch (e) {
      console.error(`❌ Validation failed for record #${i + 1} (${s.title}): ${e.message}`);
      pgClient.end();
      process.exit(1);
    }
  });
  console.log(`✅ All ${scholarshipsToInsert.length} records validated\n`);

  // 6. Clear old active scholarships (same source) to avoid duplicates
  const sourceLabel = MODE_MOCK ? 'own' : 'scholars4dev';
  console.log(`🗑️  Clearing old active scholarships (source: ${sourceLabel})...`);
  try {
    await pgClient.query(
      `DELETE FROM scholarships
       WHERE source = $1
       AND is_active = true
       AND deadline >= $2`,
      [sourceLabel, new Date().toISOString()]
    );
    console.log('✅ Old scholarships cleared\n');
  } catch (err) {
    console.warn('⚠️  Warning: Could not clear old scholarships:', err.message);
  }

  // 7. Insert
  console.log(`📦 Inserting ${scholarshipsToInsert.length} scholarships...`);

  let insertedRows = [];
  let errors = [];

  if (hasSupabase && supabaseAdmin) {
    console.log('🔌 Using Supabase SDK for insertion...');
    const result = await insertViaSupabase(scholarshipsToInsert);
    insertedRows = result.insertedRows;
    errors = result.errors;
  } else {
    console.log('🔌 Using pg client for insertion...');
    const result = await insertViaPg(scholarshipsToInsert);
    insertedRows = result.insertedRows;
    errors = result.errors;
  }

  if (errors.length > 0) {
    console.error(`❌ ${errors.length} insert failed:`);
    errors.slice(0, 5).forEach((e) => {
      if (e.title) {
        console.error(`   [${e.title}] ${e.error}`);
      } else {
        console.error(`   Batch ${e.batch}: ${e.error}`);
      }
    });
  }

  // 8. Summary
  console.log('\n✅ Seed completed!');
  console.log(`   📊 Inserted: ${insertedRows.length} / ${scholarshipsToInsert.length} scholarships\n`);
  if (insertedRows.length > 0) {
    console.log('   📋 Sample inserted records:');
    insertedRows.slice(0, 5).forEach((s) => {
      console.log(`     - [${s.country}] ${s.degree} — ${s.title}`);
    });
  }

  // 9. Verify total count
  try {
    const countRes = await pgClient.query(
      `SELECT COUNT(*) as cnt FROM scholarships
       WHERE is_active = true AND deadline >= $1`,
      [new Date().toISOString()]
    );
    console.log(`\n   📈 Total active scholarships in DB: ${countRes.rows[0].cnt}\n`);
  } catch (err) {
    console.warn('⚠️  Could not get total count:', err.message);
  }

  await pgClient.end();
  console.log('Done. 🎉');
  process.exit(errors.length > 0 ? 1 : 0);
}

seed().catch((err) => {
  console.error('❌ Unexpected error:', err.message);
  pgClient.end().catch(() => {});
  process.exit(1);
});
