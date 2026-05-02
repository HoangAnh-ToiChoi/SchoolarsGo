'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const http = require('http');

// ── Config ──────────────────────────────────────────────────────────────────
const BASE_URL = 'http://localhost:5000';
const TEST_EMAIL = 'baocao147281@example.com';
const TEST_PASSWORD = '123456';

// ── HTTP helper ──────────────────────────────────────────────────────────────
function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api' + path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// ── Main test runner ─────────────────────────────────────────────────────────
async function runTests() {
  const results = {
    summary: {
      tested_at: new Date().toISOString(),
      backend_url: BASE_URL,
      test_user: TEST_EMAIL,
      all_passed: false,
    },
    login: null,
    savedScholarships: {},
  };

  // 1. Login
  results.login = await request('POST', '/auth/login', {
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });

  if (results.login.status !== 200) {
    results.summary.login_failed = true;
    return results;
  }

  const token = results.login.body.data?.access_token || results.login.body.data?.token;
  results.summary.token_obtained = !!token;
  results.summary.token_prefix = token ? token.substring(0, 20) + '...' : null;

  // 2. GET /api/saved — empty list
  results.savedScholarships.getAll = await request('GET', '/saved', null, token);

  // 3. GET /api/scholarships — find scholarship ID
  const scholarshipsRes = await request('GET', '/scholarships', null, token);
  results.savedScholarships.scholarshipsList = scholarshipsRes;
  const scholarships = scholarshipsRes.body.data || scholarshipsRes.body || [];
  const scholarshipId = Array.isArray(scholarships) && scholarships.length > 0
    ? scholarships[0].id
    : null;
  results.summary.scholarship_id_found = scholarshipId;

  if (!scholarshipId) {
    results.summary.skip_post_delete = true;
    return results;
  }

  // 4. POST /api/saved/:scholarshipId
  results.savedScholarships.save = await request('POST', `/saved/${scholarshipId}`, {
    note: 'Ưu tiên cao - Test scholarship',
  }, token);

  // 5. GET /api/saved — verify 1 item
  results.savedScholarships.getAllAfterSave = await request('GET', '/saved', null, token);

  // 6. DELETE /api/saved/:scholarshipId
  results.savedScholarships.remove = await request('DELETE', `/saved/${scholarshipId}`, null, token);

  // 7. GET /api/saved — verify empty again
  results.savedScholarships.getAllAfterRemove = await request('GET', '/saved', null, token);

  return results;
}

runTests()
  .then((results) => {
    console.log(JSON.stringify(results, null, 2));
  })
  .catch((err) => {
    console.error('Test error:', err.message);
    process.exit(1);
  });
