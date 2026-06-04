const { test, expect } = require('@playwright/test');

test.describe('OAuth completion', () => {
  test('shows friendly error message when provider returns an error', async ({ page }) => {
    await page.goto('/oauth/complete?provider=facebook&error=Đăng%20nhập%20thất%20bại');
    await expect(page.getByRole('heading', { name: /đăng nhập thất bại/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Đăng nhập thất bại')).toHaveCount(2);
  });

  test('loads current user and completes social login successfully', async ({ page }) => {
    await page.route('**/api/auth/me', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'oauth-user',
            email: 'oauth@example.com',
            full_name: 'OAuth User',
            role: 'user',
          },
        }),
      });
    });

    await page.goto('/oauth/complete?provider=facebook&success=1');
    await expect(page.getByRole('heading', { name: /thành công/i })).toBeVisible({ timeout: 10000 });
  });
});
