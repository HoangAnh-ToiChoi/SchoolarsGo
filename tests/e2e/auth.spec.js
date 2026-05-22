const { test, expect } = require('@playwright/test');
const { TEST_USER, registerOrLogin } = require('./helpers/auth');

test.describe('Auth flow', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await registerOrLogin(page);
    await page.close();
  });

  test('register new user', async ({ page }) => {
    const unique = Date.now();
    await page.goto('/register');
    await page.waitForSelector('input[type="text"]', { timeout: 10000 });

    await page.locator('input[type="text"]').fill('Playwright User');
    await page.locator('input[type="email"]').fill(`pw-${unique}@test.com`);
    await page.locator('input[type="password"]').fill('Test123456');
    await page.getByRole('button', { name: /tạo tài khoản/i }).click();

    await expect(page).toHaveURL('/', { timeout: 8000 });
  });

  test('login with valid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });

    await page.locator('input[type="email"]').fill(TEST_USER.email);
    await page.locator('input[type="password"]').fill(TEST_USER.password);
    await page.getByRole('button', { name: /đăng nhập/i }).click();

    await expect(page).toHaveURL('/', { timeout: 8000 });
  });

  test('login with wrong password stays on login page', async ({ page }) => {
    await page.goto('/login');
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });

    await page.locator('input[type="email"]').fill(TEST_USER.email);
    await page.locator('input[type="password"]').fill('wrongpassword_xyz');
    await page.getByRole('button', { name: /đăng nhập/i }).click();

    // Should remain on /login after failed attempt
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/login');
  });

  test('forgot password page loads', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.getByRole('heading', { name: /quên mật khẩu/i })).toBeVisible({ timeout: 8000 });
  });

  test('forgot password form submits', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.locator('input[type="email"]').fill('any@test.com');
    await page.getByRole('button', { name: /gửi link/i }).click();
    await expect(page.getByText(/đã gửi email/i)).toBeVisible({ timeout: 5000 });
  });

  test('protected route redirects unauthenticated user', async ({ page }) => {
    await page.goto('/profile');
    await expect(page).toHaveURL(/login/, { timeout: 5000 });
  });
});
