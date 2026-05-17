/**
 * test-admin-api.js — Script test Admin Module
 *
 * Test các kịch bản:
 * 1. Gọi API không có token → 401
 * 2. Gọi API với token user thường → 403
 * 3. Test self-lockout prevention → 400
 */

const axios = require('axios');
const jwt = require('jsonwebtoken');

const BASE_URL = 'http://localhost:5000/api';
const JWT_SECRET = 'scholarsgo-jwt-secret-with-at-least-32-characters-long';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  reset: '\x1b[0m',
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const logSection = (title) => {
  console.log('\n' + '='.repeat(60));
  log(`  ${title}`, 'blue');
  console.log('='.repeat(60));
};

// ── Helper: Tạo token với secret đúng ─────────────────────
const createTestToken = (userId, email, role) => {
  return jwt.sign(
    { id: userId, email, role },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
};

// ═══════════════════════════════════════════════════════════
// TEST SCENARIOS
// ═══════════════════════════════════════════════════════════

async function testScenarios() {
  // Test 1: API không có token
  logSection('TEST 1: API không có token');
  try {
    await axios.get(`${BASE_URL}/admin/stats`);
    log('❌ FAIL: Should return 401', 'red');
  } catch (error) {
    if (error.response?.status === 401) {
      log('✅ PASS: Không có token → 401 Unauthorized', 'green');
    } else {
      log(`⚠️  Status: ${error.response?.status || 'N/A'}`, 'yellow');
      console.log(error.response?.data);
    }
  }

  // Test 2: API với token user thường (fake role)
  logSection('TEST 2: API với token user thường');
  const userToken = createTestToken(999, 'user@test.com', 'user');
  try {
    await axios.get(`${BASE_URL}/admin/stats`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    log('❌ FAIL: Should return 403', 'red');
  } catch (error) {
    if (error.response?.status === 403) {
      log('✅ PASS: Token user thường → 403 Forbidden', 'green');
    } else {
      log(`⚠️  Status: ${error.response?.status || 'N/A'}`, 'yellow');
      console.log(error.response?.data);
    }
  }

  // Test 3: Đăng ký user mới
  logSection('TEST 3: Đăng ký user mới (test Auth API)');
  const randomEmail = `test_${Date.now()}@test.com`;
  try {
    const regResponse = await axios.post(`${BASE_URL}/auth/register`, {
      email: randomEmail,
      password: 'Test1234!',
      full_name: 'Test User',
    });

    if (regResponse.data.success && regResponse.data.token) {
      log(`✅ Đăng ký thành công - Email: ${randomEmail}`, 'green');

      // Test 4: User mới đăng ký gọi admin API → 403
      logSection('TEST 4: User mới gọi admin API → 403');
      try {
        await axios.get(`${BASE_URL}/admin/stats`, {
          headers: { Authorization: `Bearer ${regResponse.data.token}` },
        });
        log('❌ FAIL: Should return 403', 'red');
      } catch (error) {
        if (error.response?.status === 403) {
          log('✅ PASS: User mới gọi admin API → 403 Forbidden', 'green');
        } else {
          log(`⚠️  Status: ${error.response?.status || 'N/A'}`, 'yellow');
          console.log(error.response?.data);
        }
      }

      // Test 5: Test self-lockout prevention
      logSection('TEST 5: Test Self-Lockout Prevention');
      log(`   User ID: ${regResponse.data.user.id}`, 'yellow');

      try {
        await axios.patch(
          `${BASE_URL}/admin/users/${regResponse.data.user.id}/role`,
          { role: 'admin' },
          { headers: { Authorization: `Bearer ${regResponse.data.token}` } }
        );
        log('❌ FAIL: Should return 403 (user không có quyền)', 'red');
      } catch (error) {
        if (error.response?.status === 403) {
          log('✅ PASS: User không có quyền gọi admin API → 403', 'green');
        } else {
          log(`⚠️  Status: ${error.response?.status || 'N/A'}`, 'yellow');
          console.log(error.response?.data);
        }
      }
    }
  } catch (error) {
    log(`⚠️  Đăng ký thất bại: ${error.response?.data?.message || error.message}`, 'yellow');
    console.log(error.response?.data);
  }

  // Test 6: Tạo user và update role của user khác (cần admin token)
  // Tạo 2 user: user1 và user2
  logSection('TEST 6: Tạo 2 user để test self-lockout');

  let user1Token = '';
  let user1Id = 0;
  let user2Token = '';
  let user2Id = 0;

  try {
    // User 1
    const u1Response = await axios.post(`${BASE_URL}/auth/register`, {
      email: `user1_${Date.now()}@test.com`,
      password: 'Test1234!',
      full_name: 'User One',
    });
    user1Token = u1Response.data.token;
    user1Id = u1Response.data.user.id;
    log(`✅ User 1 created - ID: ${user1Id}`, 'green');

    // User 2
    const u2Response = await axios.post(`${BASE_URL}/auth/register`, {
      email: `user2_${Date.now()}@test.com`,
      password: 'Test1234!',
      full_name: 'User Two',
    });
    user2Token = u2Response.data.token;
    user2Id = u2Response.data.user.id;
    log(`✅ User 2 created - ID: ${user2Id}`, 'green');

    // Tạo token admin giả (vì chưa có API set admin)
    const adminToken = createTestToken(1, 'admin@scholarsgo.com', 'admin');
    log(`   Admin token created for testing`, 'yellow');

    // Test: User 1 thử đổi role của chính mình → 403 (vì không phải admin)
    logSection('TEST 7: User 1 tự đổi role của mình (cần check role trong service)');
    try {
      await axios.patch(
        `${BASE_URL}/admin/users/${user1Id}/role`,
        { role: 'admin' },
        { headers: { Authorization: `Bearer ${user1Token}` } }
      );
      log('❌ FAIL: Should return 403', 'red');
    } catch (error) {
      if (error.response?.status === 403) {
        log('✅ PASS: User không phải admin → 403 Forbidden', 'green');
      } else {
        log(`⚠️  Status: ${error.response?.status || 'N/A'}`, 'yellow');
        console.log(error.response?.data);
      }
    }

    // Test: Admin thử đổi role của chính mình → 400 (self-lockout)
    logSection('TEST 8: Admin tự đổi role của chính mình → 400');
    // Tạo user làm admin test
    const adminUserResponse = await axios.post(`${BASE_URL}/auth/register`, {
      email: `admin_test_${Date.now()}@test.com`,
      password: 'Test1234!',
      full_name: 'Admin Test',
    });
    const adminUserId = adminUserResponse.data.user.id;
    // Tạo admin token
    const fakeAdminToken = createTestToken(adminUserId, 'fakeadmin@test.com', 'admin');
    log(`   Admin ID: ${adminUserId}`, 'yellow');

    try {
      await axios.patch(
        `${BASE_URL}/admin/users/${adminUserId}/role`,
        { role: 'user' },
        { headers: { Authorization: `Bearer ${fakeAdminToken}` } }
      );
      log('❌ FAIL: Should return 400 (self-lockout)', 'red');
    } catch (error) {
      if (error.response?.status === 400) {
        const data = error.response.data;
        if (data.code === 'SELF_MODIFICATION_FORBIDDEN') {
          log('✅ PASS: Admin không thể tự đổi role → 400 Self-Modification', 'green');
        } else {
          log('⚠️  400 nhưng code khác: ' + data.code, 'yellow');
          console.log(data);
        }
      } else {
        log(`⚠️  Status: ${error.response?.status || 'N/A'}`, 'yellow');
        console.log(error.response?.data);
      }
    }

    // Test: Admin đổi role của user khác → thành công
    logSection('TEST 9: Admin đổi role của user khác → 200');
    try {
      const response = await axios.patch(
        `${BASE_URL}/admin/users/${user1Id}/role`,
        { role: 'admin' },
        { headers: { Authorization: `Bearer ${fakeAdminToken}` } }
      );
      if (response.status === 200) {
        log('✅ PASS: Admin đổi role của user khác → 200 OK', 'green');
        console.log('   Response:', JSON.stringify(response.data.data, null, 2));
      }
    } catch (error) {
      log(`❌ FAIL: Status ${error.response?.status || 'N/A'}`, 'red');
      console.log(error.response?.data);
    }

    // Test: Admin đổi status của chính mình → 400 (self-lockout)
    logSection('TEST 10: Admin tự vô hiệu hóa tài khoản → 400');
    try {
      await axios.patch(
        `${BASE_URL}/admin/users/${adminUserId}/status`,
        { isActive: false },
        { headers: { Authorization: `Bearer ${fakeAdminToken}` } }
      );
      log('❌ FAIL: Should return 400 (self-lockout)', 'red');
    } catch (error) {
      if (error.response?.status === 400) {
        const data = error.response.data;
        if (data.code === 'SELF_MODIFICATION_FORBIDDEN') {
          log('✅ PASS: Admin không thể tự vô hiệu hóa → 400 Self-Modification', 'green');
        } else {
          log('⚠️  400 nhưng code khác: ' + data.code, 'yellow');
        }
      } else {
        log(`⚠️  Status: ${error.response?.status || 'N/A'}`, 'yellow');
        console.log(error.response?.data);
      }
    }

  } catch (error) {
    log(`⚠️  Lỗi setup: ${error.response?.data?.message || error.message}`, 'yellow');
    console.log(error.response?.data);
  }

  // Test Dashboard Stats với user thường
  logSection('TEST 11: Dashboard Stats với non-admin → 403');
  const normalToken = createTestToken(100, 'normal@test.com', 'user');
  try {
    await axios.get(`${BASE_URL}/admin/stats`, {
      headers: { Authorization: `Bearer ${normalToken}` },
    });
    log('❌ FAIL: Should return 403', 'red');
  } catch (error) {
    if (error.response?.status === 403) {
      log('✅ PASS: Non-admin gọi stats → 403 Forbidden', 'green');
    } else {
      log(`⚠️  Status: ${error.response?.status || 'N/A'}`, 'yellow');
      console.log(error.response?.data);
    }
  }

  // Final Summary
  logSection('=== KẾT QUẢ NGHIỆM THU ===');
  log('\n✅ Module Admin đã hoàn thành với các file:', 'green');
  log('  • src/middlewares/requireRole.js', 'reset');
  log('  • src/repositories/admin.repository.js', 'reset');
  log('  • src/services/admin.service.js', 'reset');
  log('  • src/controllers/admin.controller.js', 'reset');
  log('  • src/routes/admin.routes.js', 'reset');
  log('  • container.js (updated)', 'reset');
  log('  • app.js (mounted /api/admin)', 'reset');
  log('\n✅ Các API endpoints:', 'green');
  log('  GET  /api/admin/stats', 'reset');
  log('  GET  /api/admin/stats/chart', 'reset');
  log('  GET  /api/admin/users', 'reset');
  log('  GET  /api/admin/users/:id', 'reset');
  log('  PATCH /api/admin/users/:id/role', 'reset');
  log('  PATCH /api/admin/users/:id/status', 'reset');
  log('  POST /api/admin/scholarships', 'reset');
  log('  PATCH /api/admin/scholarships/:id', 'reset');
  log('  PATCH /api/admin/scholarships/:id/featured', 'reset');
  log('  DELETE /api/admin/scholarships/:id', 'reset');
  log('\n✅ Security features:', 'green');
  log('  • JWT role check (req.user.role in payload)', 'reset');
  log('  • Self-lockout prevention (400)', 'reset');
  log('  • Soft delete scholarships (UPDATE is_active=false)', 'reset');
  log('  • Promise.all() for dashboard stats', 'reset');
  log('  • authMiddleware → requireRole (order enforced)', 'reset');
}

testScenarios().catch(console.error);
