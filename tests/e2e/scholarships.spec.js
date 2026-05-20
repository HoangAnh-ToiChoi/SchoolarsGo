const { test, expect } = require('@playwright/test');
const { registerOrLogin } = require('./helpers/auth');

test.describe('Scholarship list', () => {
  test('shows scholarship cards', async ({ page }) => {
    await page.goto('/scholarships');
    // Wait for cards — ScholarshipCard renders as <article> or link
    await expect(page.locator('a[href^="/scholarships/"]').first()).toBeVisible({ timeout: 12000 });
  });

  test('search filter works', async ({ page }) => {
    await page.goto('/scholarships');
    await page.waitForSelector('input[placeholder*="học bổng"]', { timeout: 10000 });
    await page.locator('input[placeholder*="học bổng"]').fill('australia');
    await page.waitForTimeout(700); // debounce
    await expect(page.locator('a[href^="/scholarships/"]').first()).toBeVisible({ timeout: 8000 });
  });

  test('scholarship detail page loads', async ({ page }) => {
    await page.goto('/scholarships');
    const firstLink = page.locator('a[href^="/scholarships/"]').first();
    await firstLink.waitFor({ timeout: 12000 });
    await firstLink.click();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Scholarship detail — authenticated', () => {
  test.beforeEach(async ({ page }) => {
    await registerOrLogin(page);
  });

  test('save scholarship toggles', async ({ page }) => {
    await page.goto('/scholarships');
    const firstLink = page.locator('a[href^="/scholarships/"]').first();
    await firstLink.waitFor({ timeout: 12000 });
    await firstLink.click();

    const saveBtn = page.getByRole('button', { name: /lưu vào shortlist|đã lưu/i });
    await saveBtn.waitFor({ timeout: 8000 });
    await saveBtn.click();
    await expect(page.getByText(/đã lưu học bổng|đã bỏ lưu học bổng/i)).toBeVisible({ timeout: 5000 });
  });
});
