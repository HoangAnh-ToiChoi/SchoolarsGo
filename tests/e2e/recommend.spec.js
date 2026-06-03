const { test, expect } = require('@playwright/test');
const { registerOrLogin } = require('./helpers/auth');

const mockRecommendation = {
  scholarship: {
    id: '11111111-1111-4111-8111-111111111111',
    title: 'Global AI Scholarship',
    provider: 'ScholarsGo Test Foundation',
    country: 'Australia',
    degree: 'Master',
  },
  match_score: 0.86,
  rule_score: 0.74,
  semantic_score: 0.92,
  confidence: 'high',
  profile_gaps: ['target_intake'],
  reasons: ['Ngành học liên quan đến mục tiêu học tập'],
  semantic_reason: 'Nội dung học bổng khớp tốt với định hướng ngành.',
  ai_reason: 'Học bổng này phù hợp với mục tiêu AI và bậc Master của bạn.',
  version: 'semantic_v2',
};

test.describe('AI recommendations', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/recommend', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [mockRecommendation] }),
      });
    });

    await registerOrLogin(page);
  });

  test('renders semantic v2 score signals', async ({ page }) => {
    await page.goto('/recommend');
    await expect(page.getByText('Global AI Scholarship')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Semantic: 92%/)).toBeVisible();
    await expect(page.getByText(/Rule: 74%/)).toBeVisible();
    await expect(page.getByText('high')).toBeVisible();
    await expect(page.getByText(/Học bổng này phù hợp/)).toBeVisible();
  });
});
