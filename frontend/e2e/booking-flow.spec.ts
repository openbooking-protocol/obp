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

const MOCK_SLOT_1 = {
  id: 'slot-1',
  provider_id: 'provider-1',
  service_id: 'service-1',
  start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  end_time: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
  status: 'available',
  capacity: 1,
  booked: 0,
};

const MOCK_SLOT_2 = {
  id: 'slot-2',
  provider_id: 'provider-1',
  service_id: 'service-1',
  start_time: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString(),
  end_time: new Date(Date.now() + 27 * 60 * 60 * 1000).toISOString(),
  status: 'available',
  capacity: 1,
  booked: 0,
};

const MOCK_BOOKING = {
  id: 'booking-1',
  provider_id: 'provider-1',
  service_id: 'service-1',
  slot_id: 'slot-1',
  status: 'confirmed',
  customer: {
    name: 'Jane Doe',
    email: 'jane@example.com',
    phone: null,
  },
  notes: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  cancelled_at: null,
  cancellation_reason: null,
};

function setupCommonRoutes(page: ReturnType<typeof test['info']> extends never ? never : Parameters<Parameters<typeof test>[1]>[0]['page']) {
  return Promise.all([
    page.route('**/obp/v1/providers*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [MOCK_PROVIDER], total: 1, page: 1, limit: 20 }),
      })
    ),
    page.route('**/obp/v1/services*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [MOCK_SERVICE], total: 1, page: 1, limit: 20 }),
      })
    ),
    page.route('**/obp/v1/slots*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [MOCK_SLOT_1, MOCK_SLOT_2], total: 2, page: 1, limit: 50 }),
      })
    ),
    page.route('**/obp/v1/slots/*/hold', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          slot_id: 'slot-1',
          hold_token: 'hold-token-abc',
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        }),
      })
    ),
    page.route('**/obp/v1/bookings', (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_BOOKING),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [MOCK_BOOKING], total: 1, page: 1, limit: 20 }),
      });
    }),
    page.route('**/obp/v1/bookings/*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_BOOKING),
      })
    ),
  ]);
}

test.describe('Booking flow', () => {
  test('home page loads', async ({ page }) => {
    await setupCommonRoutes(page);
    await page.goto('/');

    // Search input should be visible
    const searchInput = page.getByRole('searchbox', { name: /search/i });
    await expect(searchInput).toBeVisible();

    // Category section should be present
    const categoriesHeading = page.getByText('Browse by category');
    await expect(categoriesHeading).toBeVisible();

    // At least one category link should exist
    const categoryLinks = page.getByRole('link', { name: /health/i });
    await expect(categoryLinks.first()).toBeVisible();
  });

  test('search for provider', async ({ page }) => {
    await setupCommonRoutes(page);
    await page.goto('/search');

    // Type into search input
    const searchInput = page.getByRole('searchbox').or(page.locator('input[name="q"]'));
    if (await searchInput.count() > 0) {
      await searchInput.first().fill('consultation');
    }

    // Results should appear (mocked provider)
    const providerName = page.getByText('Test Provider');
    await expect(providerName).toBeVisible({ timeout: 10_000 });
  });

  test('complete booking flow', async ({ page }) => {
    await setupCommonRoutes(page);

    // Navigate directly to a service booking page
    await page.goto(`/providers/provider-1/services/service-1`);

    // Select a date — click the first available date button
    const dateButtons = page.locator('button').filter({ hasText: /mon|tue|wed|thu|fri|sat|sun/i });
    if (await dateButtons.count() > 0) {
      await dateButtons.first().click();
    } else {
      // Fallback: click first button in the date picker area
      const firstDate = page.locator('[class*="rounded-lg"][class*="border"]').first();
      await firstDate.click();
    }

    // Select a time slot after slots load
    const slotButton = page.locator('button').filter({ hasText: /^\d{1,2}:\d{2}/ });
    await expect(slotButton.first()).toBeVisible({ timeout: 8_000 });
    await slotButton.first().click();

    // Fill in the customer form
    await page.getByLabel(/full name/i).fill('Jane Doe');
    await page.getByLabel(/email/i).fill('jane@example.com');

    // Submit the booking
    const confirmButton = page.getByRole('button', { name: /confirm booking/i });
    await expect(confirmButton).toBeVisible();
    await confirmButton.click();

    // Success state should appear
    await expect(page.getByText(/booking confirmed/i)).toBeVisible({ timeout: 10_000 });
  });

  test('booking cancellation', async ({ page }) => {
    // Mock booking fetch to return a cancellable booking
    await page.route('**/obp/v1/bookings/booking-1', (route) => {
      if (route.request().method() === 'DELETE' || route.request().url().includes('cancel')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ...MOCK_BOOKING, status: 'cancelled', cancelled_at: new Date().toISOString() }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...MOCK_BOOKING, status: 'confirmed' }),
      });
    });

    await page.route('**/obp/v1/bookings/booking-1/cancel', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...MOCK_BOOKING, status: 'cancelled', cancelled_at: new Date().toISOString() }),
      })
    );

    await page.goto('/bookings/booking-1');

    // Booking status page should load
    await expect(page.getByText(/booking status/i)).toBeVisible({ timeout: 10_000 });

    // Cancel button should be present for a confirmed booking
    const cancelButton = page.getByRole('button', { name: /cancel/i });
    await expect(cancelButton).toBeVisible();
    await cancelButton.click();

    // Confirm cancellation in any dialog that appears
    const confirmCancel = page.getByRole('button', { name: /yes|confirm|cancel booking/i });
    if (await confirmCancel.count() > 0) {
      await confirmCancel.first().click();
    }
  });

  test('provider not found shows 404', async ({ page }) => {
    await page.route('**/obp/v1/providers/invalid-id*', (route) =>
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ status: 404, title: 'Not Found', detail: 'Provider not found' }),
      })
    );

    await page.goto('/providers/invalid-id');

    // Should show a not-found / error message
    const errorText = page
      .getByText(/not found/i)
      .or(page.getByText(/404/))
      .or(page.getByText(/does not exist/i))
      .or(page.getByText(/could not be found/i));

    await expect(errorText.first()).toBeVisible({ timeout: 10_000 });
  });
});
