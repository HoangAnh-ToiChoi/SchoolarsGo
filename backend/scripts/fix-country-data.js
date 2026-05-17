'use strict';
/**
 * fix-country-data.js
 * Audit và fix corrupt country values trong bảng scholarships.
 *
 * Corrupt = country field chứa tên học bổng hoặc chuỗi dài bất thường
 * thay vì tên quốc gia hợp lệ.
 *
 * Chạy:
 *   node scripts/fix-country-data.js           -- preview changes, không write
 *   node scripts/fix-country-data.js --apply   -- apply changes thật sự
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

const sb = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const APPLY = process.argv.includes('--apply');

// ── Known country name map (canonical form) ───────────────────────────────────
const COUNTRY_ALIASES = {
  'united states': 'USA',
  'u.s.a': 'USA',
  'u.s.': 'USA',
  'usa': 'USA',
  ' us ': 'USA',
  ' us,': 'USA',
  'united kingdom': 'UK',
  'u.k': 'UK',
  'great britain': 'UK',
  'england': 'UK',
  ' uk ': 'UK',
  ' uk,': 'UK',
  'study in: uk': 'UK',
  'study in: usa': 'USA',
  'study in: australia': 'Australia',
  'study in: canada': 'Canada',
  'study in: germany': 'Germany',
  'study in: france': 'France',
  'study in: japan': 'Japan',
  'study in: netherlands': 'Netherlands',
  'study in: sweden': 'Sweden',
  'study in: norway': 'Norway',
  'study in: switzerland': 'Switzerland',
  'study in: new zealand': 'New Zealand',
  'study in: singapore': 'Singapore',
  'study in: austria': 'Austria',
  'study in: belgium': 'Belgium',
  'study in: ireland': 'Ireland',
  'study in: denmark': 'Denmark',
  'study in: finland': 'Finland',
  'study in: spain': 'Spain',
  'study in: italy': 'Italy',
  'study in: china': 'China',
  'study in: turkey': 'Turkey',
  'study in: malaysia': 'Malaysia',
  'study in: taiwan': 'Taiwan',
  'study in: south korea': 'South Korea',
  'study in: milan': 'Italy',
  'south korea': 'South Korea',
  'korea': 'South Korea',
  'new zealand': 'New Zealand',
  'netherlands': 'Netherlands',
  'the netherlands': 'Netherlands',
  'switzerland': 'Switzerland',
  'singapore': 'Singapore',
  'australia': 'Australia',
  'canada': 'Canada',
  'germany': 'Germany',
  'france': 'France',
  'japan': 'Japan',
  'sweden': 'Sweden',
  'norway': 'Norway',
  'austria': 'Austria',
  'belgium': 'Belgium',
  'ireland': 'Ireland',
  'denmark': 'Denmark',
  'finland': 'Finland',
  'spain': 'Spain',
  'italy': 'Italy',
  'china': 'China',
  'turkey': 'Turkey',
  'malaysia': 'Malaysia',
  'taiwan': 'Taiwan',
  'hungary': 'Hungary',
  'czech': 'Czech Republic',
  'czech republic': 'Czech Republic',
  'global': 'International',
  'worldwide': 'International',
  'international': 'International',
  'various': 'International',
  'multiple': 'International',
};

// Valid canonical countries (exact match OK)
const VALID_COUNTRIES = new Set([
  'USA', 'UK', 'Australia', 'Canada', 'Germany', 'France', 'Japan',
  'South Korea', 'Netherlands', 'Sweden', 'Norway', 'Switzerland',
  'New Zealand', 'Singapore', 'Austria', 'Belgium', 'Ireland', 'Denmark',
  'Finland', 'Spain', 'Italy', 'China', 'Turkey', 'Malaysia', 'Taiwan',
  'Hungary', 'Czech Republic', 'International', 'United States', 'United Kingdom',
  'Portugal', 'Poland', 'Greece', 'Romania', 'India', 'Brazil', 'Mexico',
  'Argentina', 'South Africa', 'Nigeria', 'Ghana', 'Kenya', 'Thailand',
  'Indonesia', 'Vietnam', 'Philippines', 'Pakistan', 'Bangladesh', 'Egypt',
  'Morocco', 'Ethiopia', 'Tanzania', 'Uganda', 'Rwanda', 'Zambia',
  'Zimbabwe', 'Cameroon', 'Senegal', 'Côte d\'Ivoire', 'UAE',
]);

/**
 * Heuristic: a country value is suspect if it's very long or contains
 * words that appear in scholarship titles but not country names.
 */
function isSuspect(country) {
  if (!country) return true;
  const v = country.trim();
  if (v.length > 60) return true;

  // Contains digits → likely a title or description
  if (/\d/.test(v)) return true;

  // Multiple words + not a known multi-word country → likely corrupt
  const wordCount = v.split(/\s+/).length;
  const multiWordOK = new Set([
    'south korea', 'new zealand', 'united states', 'united kingdom',
    'czech republic', 'saudi arabia', 'south africa', 'ivory coast',
    "côte d'ivoire", 'united arab emirates', 'the netherlands',
  ]);
  if (wordCount > 3 && !multiWordOK.has(v.toLowerCase())) return true;

  return false;
}

/**
 * Try to extract a valid country name from a corrupt value or from the title.
 * Returns canonical country string or 'International' as fallback.
 */
function resolveCountry(corrupt, title) {
  const sources = [corrupt, title].filter(Boolean).map(s => s.toLowerCase());

  for (const [alias, canonical] of Object.entries(COUNTRY_ALIASES)) {
    for (const src of sources) {
      if (src.includes(alias)) return canonical;
    }
  }

  // Also try direct VALID_COUNTRIES match (case-insensitive) against corrupt value
  if (corrupt) {
    const lower = corrupt.trim().toLowerCase();
    for (const valid of VALID_COUNTRIES) {
      if (valid.toLowerCase() === lower) return valid;
    }
  }

  return 'International';
}

// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n════════════════════════════════════════');
  console.log('  ScholarsGo — Country Data Fix Script');
  console.log(`  Mode: ${APPLY ? '✍️  APPLY (write to DB)' : '👁️  DRY RUN (preview only)'}`);
  console.log('════════════════════════════════════════\n');

  // Fetch all scholarships (id, title, country)
  let page = 0;
  const PAGE_SIZE = 1000;
  let all = [];
  while (true) {
    const { data, error } = await sb
      .from('scholarships')
      .select('id, title, country')
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    if (error) { console.error('Fetch error:', error.message); process.exit(1); }
    if (!data || data.length === 0) break;
    all = all.concat(data);
    if (data.length < PAGE_SIZE) break;
    page++;
  }

  console.log(`📦 Tổng học bổng trong DB: ${all.length}\n`);

  // Classify
  const suspects = all.filter(s => isSuspect(s.country));
  const clean    = all.filter(s => !isSuspect(s.country));

  console.log(`✅ Country hợp lệ:  ${clean.length}`);
  console.log(`⚠️  Country suspect: ${suspects.length}\n`);

  if (suspects.length === 0) {
    console.log('✨ Không có dữ liệu cần fix.');
    return;
  }

  // Build fix plan
  const fixes = suspects.map(s => ({
    id: s.id,
    oldCountry: s.country,
    newCountry: resolveCountry(s.country, s.title),
    title: s.title.substring(0, 60) + (s.title.length > 60 ? '…' : ''),
  }));

  // Group by new country for stats
  const stats = {};
  for (const f of fixes) {
    stats[f.newCountry] = (stats[f.newCountry] || 0) + 1;
  }

  console.log('📋 Preview changes (first 20):');
  fixes.slice(0, 20).forEach(f => {
    console.log(`  [${f.id.substring(0, 8)}] "${f.oldCountry}" → "${f.newCountry}"`);
    console.log(`         Title: ${f.title}`);
  });
  if (fixes.length > 20) console.log(`  … and ${fixes.length - 20} more\n`);

  console.log('\n📊 New country distribution:');
  for (const [country, count] of Object.entries(stats).sort((a, b) => b[1] - a[1])) {
    console.log(`   ${country.padEnd(25)} ${count}`);
  }

  if (!APPLY) {
    console.log('\n💡 Thêm --apply để ghi thay đổi vào DB.\n');
    return;
  }

  // Apply fixes in batches of 100
  console.log('\n✍️  Applying fixes...');
  let updated = 0;
  const BATCH = 100;
  for (let i = 0; i < fixes.length; i += BATCH) {
    const batch = fixes.slice(i, i + BATCH);
    await Promise.all(batch.map(async f => {
      const { error } = await sb
        .from('scholarships')
        .update({ country: f.newCountry, updated_at: new Date().toISOString() })
        .eq('id', f.id);
      if (error) {
        console.warn(`  ❌ Failed [${f.id}]: ${error.message}`);
      } else {
        updated++;
      }
    }));
    console.log(`  Progress: ${Math.min(i + BATCH, fixes.length)}/${fixes.length}`);
  }

  console.log(`\n✅ Done! Updated ${updated}/${fixes.length} scholarships.\n`);
}

main().catch(err => { console.error(err); process.exit(1); });
