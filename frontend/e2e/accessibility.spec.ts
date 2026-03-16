import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// NOTE: @axe-core/playwright must be installed:
//   npm install --save-dev @axe-core/playwright
// Run: cd frontend && npm install --save-dev @axe-core/playwright

const MOCK_PROVIDER = {
  id: 'provider-1',
  name: 'Test Provider',
  description: 'A test service provider',
  category: 'health',
  status: 'active',
  location: { city: 'Belgrade', country: 'RS' },
  logo_url: null,
  website: null,
  phone: null,
  email: 'test@example.com',
  timezone: 'Europe/Belgrade',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const MOCK_SERVICE = {
  id: 'service-1',
  provider_id: 'provider-1',
  name: 'Test Consultation',
  description: 'A test consultation service',
  duration_minutes: 60,
  buffer_before_minutes: 0,
  buffer_after_minutes: 0,
  price: { amount: 5000, currency: 'EUR' },
  max_participants: 1,
  requires_confirmation: false,
  tags: [],
  active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const MOCK_SLOT = {
  id: 'slot-1',
  provider_id: 'provider-1',
  service_id: 'service-1',
  start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  end_time: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
  status: 'available',
  capacity: 1,
  booked: 0,
};

test.describe('Accessibility', () => {
  test('home page has no critical accessibility violations', async ({ page }) => {
    await page.route('**/obp/v1/providers*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [MOCK_PROVIDER], total: 1, page: 1, limit: 6 }),
      })
    );

    await page.goto('/');

    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page }).analyze();

    const criticalViolations = results.violations.filter((v) => v.impact === 'critical');
    expect(criticalViolations).toHaveLength(0);
  });

  test('search page has no critical accessibility violations', async ({ page }) => {
    await page.route('**/obp/v1/providers*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [MOCK_PROVIDER], total: 1, page: 1, limit: 20 }),
      })
    );

    await page.route('**/obp/v1/services*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [MOCK_SERVICE], total: 1, page: 1, limit: 20 }),
      })
    );

    await page.goto('/search');

    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page }).analyze();

    const criticalViolations = results.violations.filter((v) => v.impact === 'critical');
    expect(criticalViolations).toHaveLength(0);
  });

  test('booking flow has no critical accessibility violations', async ({ page }) => {
    await page.route('**/obp/v1/providers*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [MOCK_PROVIDER], total: 1, page: 1, limit: 6 }),
      })
    );

    await page.route('**/obp/v1/services*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [MOCK_SERVICE], total: 1, page: 1, limit: 20 }),
      })
    );

    await page.route('**/obp/v1/slots*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [MOCK_SLOT], total: 1, page: 1, limit: 50 }),
      })
    );

    await page.goto('/providers/provider-1/services/service-1');

    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page }).analyze();

    const criticalViolations = results.violations.filter((v) => v.impact === 'critical');
    expect(criticalViolations).toHaveLength(0);
  });
});
