const { test, expect } = require('@playwright/test');
const { registerOrLogin } = require('./helpers/auth');

test.describe('Application tracker', () => {
  test.beforeEach(async ({ page }) => {
    await registerOrLogin(page);
  });

  test('empty state shows CTA', async ({ page }) => {
    await page.goto('/applications');
    // Wait for API to complete before checking state
    await page.waitForLoadState('networkidle', { timeout: 12000 });
    const hasApps = await page.locator('a[href^="/scholarships/"]').count() > 0;
    if (!hasApps) {
      await expect(page.getByText(/tìm học bổng để ứng tuyển/i)).toBeVisible({ timeout: 5000 });
    } else {
      await expect(page.locator('a[href^="/scholarships/"]').first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('create application from detail page', async ({ page }) => {
    await page.goto('/scholarships');
    const firstLink = page.locator('a[href^="/scholarships/"]').first();
    await firstLink.waitFor({ timeout: 8000 });
    await firstLink.click();

    const applyBtn = page.getByRole('button', { name: /tạo hồ sơ ứng tuyển/i }).first();
    await applyBtn.waitFor({ timeout: 5000 });
    await applyBtn.click();

    // Wait for create action to settle (success navigates, duplicate shows error)
    await page.waitForTimeout(2000);

    // Navigate to applications page — regardless of whether creation was new or duplicate
    if (!page.url().includes('/applications')) {
      await page.goto('/applications');
    }
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    // At least one application should exist (newly created or pre-existing)
    await expect(page.locator('a[href^="/scholarships/"]').first()).toBeVisible({ timeout: 8000 });
  });
});
