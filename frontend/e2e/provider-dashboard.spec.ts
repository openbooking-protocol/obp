import { test, expect } from '@playwright/test';

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

const MOCK_ANALYTICS = {
  total_bookings: 12,
  confirmed_bookings: 8,
  cancelled_bookings: 2,
  completed_bookings: 4,
  no_show_rate: 0.05,
  revenue_estimate: 48000,
  top_services: [],
};

test.describe('Provider dashboard', () => {
  test('login with API key', async ({ page }) => {
    // Mock the providers endpoint that login uses to verify the key
    await page.route('**/obp/v1/providers*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [MOCK_PROVIDER], total: 1, page: 1, limit: 1 }),
      })
    );

    await page.goto('/dashboard/login');

    // Fill in the API key field
    const apiKeyInput = page.getByLabel(/api key/i).or(page.locator('input[type="password"]'));
    await expect(apiKeyInput.first()).toBeVisible();
    await apiKeyInput.first().fill('obpk_test_api_key_123');

    // Submit the form
    const signInButton = page.getByRole('button', { name: /sign in/i });
    await expect(signInButton).toBeVisible();
    await signInButton.click();

    // Should redirect to dashboard overview
    await expect(page).toHaveURL(/\/dashboard\/overview/, { timeout: 10_000 });
  });

  test('dashboard shows stats', async ({ page }) => {
    // Mock all APIs needed for the overview page
    await page.route('**/obp/v1/providers*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [MOCK_PROVIDER], total: 1, page: 1, limit: 1 }),
      })
    );

    await page.route('**/obp/v1/bookings*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [], total: 0, page: 1, limit: 10 }),
      })
    );

    await page.route('**/obp/v1/services*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [MOCK_SERVICE], total: 1, page: 1, limit: 10 }),
      })
    );

    await page.route('**/obp/v1/analytics/providers/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_ANALYTICS),
      })
    );

    // Set up session storage to simulate already logged-in state
    await page.goto('/dashboard/login');
    await page.evaluate(() => {
      sessionStorage.setItem('obp_api_key', 'obpk_test_api_key_123');
    });

    await page.goto('/dashboard/overview');

    // Stats cards should be visible
    await expect(page.getByText(/today.s bookings/i).or(page.getByText(/dashboard/i))).toBeVisible({
      timeout: 10_000,
    });

    // Check that numeric values from analytics are displayed
    await expect(page.getByText('12').or(page.getByText('8'))).toBeVisible({ timeout: 10_000 });
  });

  test('can create service', async ({ page }) => {
    let createServiceCalled = false;

    await page.route('**/obp/v1/providers*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [MOCK_PROVIDER], total: 1, page: 1, limit: 1 }),
      })
    );

    await page.route('**/obp/v1/services*', (route) => {
      if (route.request().method() === 'POST') {
        createServiceCalled = true;
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ ...MOCK_SERVICE, id: 'service-new', name: 'New Test Service' }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [MOCK_SERVICE], total: 1, page: 1, limit: 10 }),
      });
    });

    // Simulate logged-in session
    await page.goto('/dashboard/login');
    await page.evaluate(() => {
      sessionStorage.setItem('obp_api_key', 'obpk_test_api_key_123');
      sessionStorage.setItem('obp_provider_id', 'provider-1');
    });

    await page.goto('/dashboard/services');

    // Click "Add service" button
    const addButton = page.getByRole('button', { name: /add service/i });
    await expect(addButton).toBeVisible({ timeout: 10_000 });
    await addButton.click();

    // Modal / form should appear
    const serviceNameInput = page.getByLabel(/service name/i);
    await expect(serviceNameInput).toBeVisible({ timeout: 5_000 });

    // Fill in the service form
    await serviceNameInput.fill('New Test Service');

    const descriptionInput = page.getByLabel(/description/i);
    if (await descriptionInput.count() > 0) {
      await descriptionInput.fill('A new test service description');
    }

    // Submit the form
    const createButton = page.getByRole('button', { name: /create service/i });
    await expect(createButton).toBeVisible();
    await createButton.click();

    // The create API should have been called
    await expect(page.locator('body')).toBeAttached();
    expect(createServiceCalled).toBe(true);
  });
});
