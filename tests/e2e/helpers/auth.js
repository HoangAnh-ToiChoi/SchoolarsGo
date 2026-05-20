const TEST_USER = {
  email: 'test-e2e@scholarsgo.com',
  password: 'Test123456',
  full_name: 'E2E Test User',
};

async function registerOrLogin(page) {
  // Attempt 1: try login
  await page.goto('/login');
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  await page.locator('input[type="email"]').fill(TEST_USER.email);
  await page.locator('input[type="password"]').fill(TEST_USER.password);
  await page.getByRole('button', { name: /đăng nhập/i }).click();

  try {
    await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 5000 });
    return; // login succeeded
  } catch {
    // login failed → try register
  }

  await page.goto('/register');
  await page.waitForSelector('input[type="text"]', { timeout: 10000 });
  await page.locator('input[type="text"]').fill(TEST_USER.full_name);
  await page.locator('input[type="email"]').fill(TEST_USER.email);
  await page.locator('input[type="password"]').fill(TEST_USER.password);
  await page.getByRole('button', { name: /tạo tài khoản/i }).click();

  try {
    await page.waitForURL((url) => !url.pathname.startsWith('/register'), { timeout: 10000 });
    return; // register succeeded
  } catch {
    // register failed (email already exists race condition) → retry login
  }

  // Attempt 2: login again (email may have been registered by a parallel test)
  await page.goto('/login');
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  await page.locator('input[type="email"]').fill(TEST_USER.email);
  await page.locator('input[type="password"]').fill(TEST_USER.password);
  await page.getByRole('button', { name: /đăng nhập/i }).click();
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 8000 });
}

module.exports = { TEST_USER, registerOrLogin };
