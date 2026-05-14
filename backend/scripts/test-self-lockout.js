/**
 * test-self-lockout.js — Test Self-Lockout Prevention
 */

const axios = require('axios');
const jwt = require('jsonwebtoken');

const BASE_URL = 'http://localhost:5000/api';
const JWT_SECRET = 'scholarsgo-jwt-secret-with-at-least-32-characters-long';

const createToken = (userId, role) => {
  return jwt.sign({ id: userId, email: `${role}@test.com`, role }, JWT_SECRET, { expiresIn: '1h' });
};

async function test() {
  console.log('\n=== TEST SELF-LOCKOUT PREVENTION ===\n');

  // Step 1: Register a user
  console.log('1. Registering test user...');
  let token, userId;
  try {
    const res = await axios.post(`${BASE_URL}/auth/register`, {
      email: `selflock_${Date.now()}@test.com`,
      password: 'Test1234!',
      full_name: 'Self Lock Test',
    });
    // Response structure: { success, data: { user, token } }
    token = res.data.data.token;
    userId = res.data.data.user.id;
    console.log(`   ✅ User created: ${userId}\n`);
  } catch (err) {
    console.log('   ❌ Failed:', err.response?.data || err.message);
    return;
  }

  // Step 2: Create admin token for same user
  const adminToken = createToken(userId, 'admin');
  console.log('2. Created admin token for same user\n');

  // Step 3: Try to change own role as admin → Should return 400
  console.log('3. Testing: Admin tries to change own role → 400');
  try {
    await axios.patch(
      `${BASE_URL}/admin/users/${userId}/role`,
      { role: 'user' },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    console.log('   ❌ FAIL: Should return 400\n');
  } catch (err) {
    if (err.response?.status === 400 && err.response?.data?.code === 'SELF_MODIFICATION_FORBIDDEN') {
      console.log('   ✅ PASS: Self-lockout prevented → 400\n');
    } else {
      console.log(`   ⚠️  Status: ${err.response?.status}, Code: ${err.response?.data?.code}`);
      console.log(`   Message: ${err.response?.data?.message}\n`);
    }
  }

  // Step 4: Try to disable own account as admin → Should return 400
  console.log('4. Testing: Admin tries to disable own account → 400');
  try {
    await axios.patch(
      `${BASE_URL}/admin/users/${userId}/status`,
      { isActive: false },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    console.log('   ❌ FAIL: Should return 400\n');
  } catch (err) {
    if (err.response?.status === 400 && err.response?.data?.code === 'SELF_MODIFICATION_FORBIDDEN') {
      console.log('   ✅ PASS: Self-lockout prevented → 400\n');
    } else {
      console.log(`   ⚠️  Status: ${err.response?.status}, Code: ${err.response?.data?.code}`);
      console.log(`   Message: ${err.response?.data?.message}\n`);
    }
  }

  // Step 5: Test dashboard stats with non-admin → 403
  console.log('5. Testing: Non-admin calling stats API → 403');
  try {
    await axios.get(`${BASE_URL}/admin/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('   ❌ FAIL: Should return 403\n');
  } catch (err) {
    if (err.response?.status === 403) {
      console.log('   ✅ PASS: Non-admin blocked → 403\n');
    } else {
      console.log(`   ⚠️  Status: ${err.response?.status}\n`);
    }
  }

  // Step 6: Test without token → 401
  console.log('6. Testing: No token calling admin API → 401');
  try {
    await axios.get(`${BASE_URL}/admin/stats`);
    console.log('   ❌ FAIL: Should return 401\n');
  } catch (err) {
    if (err.response?.status === 401) {
      console.log('   ✅ PASS: No token blocked → 401\n');
    } else {
      console.log(`   ⚠️  Status: ${err.response?.status}\n`);
    }
  }

  console.log('=== TEST COMPLETE ===\n');
}

test().catch(console.error);
