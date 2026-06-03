const { test, expect } = require('@playwright/test');

const mockNews = [
  {
    id: 'visa-1',
    title: 'Visa du học Úc có cập nhật mới',
    description: 'Những thay đổi đáng chú ý cho sinh viên quốc tế.',
    link: 'https://example.com/visa',
    pubDate: '2026-05-30T00:00:00.000Z',
    imageUrl: null,
    source: 'Test Source',
    category: 'Visa',
  },
  {
    id: 'education-1',
    title: 'Xu hướng giáo dục quốc tế 2026',
    description: 'Các trường tăng hỗ trợ cho sinh viên quốc tế.',
    link: 'https://example.com/education',
    pubDate: '2026-05-29T00:00:00.000Z',
    imageUrl: null,
    source: 'Test Source',
    category: 'Giáo dục',
  },
];

test.describe('News experience', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/news**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: mockNews }),
      });
    });
  });

  test('homepage shows latest curated news', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /tin tức giáo dục/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Visa du học Úc có cập nhật mới')).toBeVisible();
  });

  test('news page filters visa category', async ({ page }) => {
    await page.goto('/news', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Visa' }).click();
    await expect(page.getByText('Visa du học Úc có cập nhật mới')).toBeVisible();
    await expect(page.getByText('Xu hướng giáo dục quốc tế 2026')).toHaveCount(0);
  });

  test('homepage shows friendly fallback when news api fails', async ({ page }) => {
    await page.unroute('**/api/news**');
    await page.route('**/api/news**', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'Service unavailable' }),
      });
    });

    await page.goto('/');
    await expect(page.getByText(/chưa thể tải tin tức mới nhất/i)).toBeVisible({ timeout: 10000 });
  });
});
