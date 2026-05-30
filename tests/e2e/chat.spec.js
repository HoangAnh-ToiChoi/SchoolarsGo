const { test, expect } = require('@playwright/test');
const { registerOrLogin } = require('./helpers/auth');

test.describe('Chat experience', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/chat/history', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            messages: [{ role: 'assistant', content: 'Lịch sử học bổng gần đây của bạn đã sẵn sàng.' }],
          },
        }),
      });
    });

    await registerOrLogin(page);
  });

  test('renders chat history and assistant reply', async ({ page }) => {
    await page.route('**/api/chat', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { reply: 'Mình gợi ý bạn xem các học bổng AI tại Australia.' },
        }),
      });
    });

    await page.goto('/chat');
    await expect(page.getByText(/lịch sử học bổng gần đây của bạn/i)).toBeVisible({ timeout: 10000 });

    const input = page.getByPlaceholder('Hỏi về học bổng, hồ sơ, deadline...');
    await input.fill('Tìm học bổng AI tại Australia');
    await page.locator('button[type="submit"]').click();

    await expect(page.getByText(/mình gợi ý bạn xem các học bổng ai tại australia/i)).toBeVisible({ timeout: 10000 });
  });

  test('shows graceful fallback when chat api is unavailable', async ({ page }) => {
    await page.route('**/api/chat', async route => {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'Service unavailable' }),
      });
    });

    await page.goto('/chat');
    const input = page.getByPlaceholder('Hỏi về học bổng, hồ sơ, deadline...');
    await input.fill('Xin chào');
    await page.locator('button[type="submit"]').click();

    await expect(
      page.getByText(/dịch vụ ai đang bảo trì|mình gặp sự cố kết nối/i)
    ).toBeVisible({ timeout: 10000 });
  });
});
