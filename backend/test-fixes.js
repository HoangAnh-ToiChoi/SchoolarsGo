// Quick test script for the 2 fixed APIs
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const http = require('http');

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(
      { hostname: 'localhost', port: 5000, path, method, headers },
      res => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(d) }));
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function run() {
  console.log('=== Test 1: PUT /api/profile ===');

  // Register fresh user
  const reg = await request('POST', '/api/auth/register', {
    email: `profile_fix_${Date.now()}@test.com`,
    password: 'Test123456',
    full_name: 'Profile Fix Test',
  });
  console.log('1. Register:', reg.status, JSON.stringify(reg.body.data?.token ? '[TOKEN]' : reg.body.message));

  const token = reg.body.data?.token;
  if (!token) { console.log('No token, skip'); return; }

  // PUT profile with GPA
  const update = await request('PUT', '/api/profile', {
    gpa: 3.85,
    target_degree: 'Master',
    target_country: 'UK',
    bio: 'Test bio from fix script',
  }, token);
  console.log('2. PUT profile:', update.status, JSON.stringify(update.body));

  console.log('\n=== Test 2: POST /api/documents/upload ===');

  // Test upload without type field (should get 400 JSON, not crash)
  // Simulate the case by using a mock file buffer
  const uploadRes = await request('POST', '/api/documents/upload', {}, token);
  console.log('3. Upload without type:', uploadRes.status, JSON.stringify(uploadRes.body));

  // PUT with empty body (edge case - no fields)
  const emptyPut = await request('PUT', '/api/profile', {}, token);
  console.log('4. PUT empty body:', emptyPut.status, JSON.stringify(emptyPut.body));

  console.log('\nAll tests done.');
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });