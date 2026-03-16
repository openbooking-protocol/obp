import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock drizzle-orm operators before importing service
vi.mock('drizzle-orm', () => ({
  eq: vi.fn(),
  and: vi.fn(),
  gte: vi.fn(),
  lte: vi.fn(),
  count: vi.fn(() => 0),
  sql: Object.assign(vi.fn((s: string) => s), { raw: vi.fn() }),
}));

// Each call to db.select() returns a thenable chain.
// The service makes 4 awaited queries in getProviderAnalytics:
//   1. booking status counts   → .from().where().groupBy()
//   2. slot status counts      → .from().where().groupBy()
//   3. top services            → .from().leftJoin().where().groupBy().orderBy().limit()
//   4. revenue rows            → .from().leftJoin().where().groupBy()
// We use mockSelectSequence to return a different resolved value per call.

function makeChain(resolved: unknown) {
  const terminal = Promise.resolve(resolved);
  const chain: Record<string, unknown> = {};
  for (const m of ['from', 'where', 'groupBy', 'orderBy', 'leftJoin', 'limit']) {
    chain[m] = vi.fn(() => chain);
  }
  // Make the chain itself thenable so `await chain` works
  (chain as { then: unknown }).then = terminal.then.bind(terminal);
  (chain as { catch: unknown }).catch = terminal.catch.bind(terminal);
  return chain;
}

let selectCall = 0;
let selectResults: unknown[] = [];

vi.mock('../../db/index.js', () => ({
  getDb: vi.fn(() => ({
    select: vi.fn(() => {
      const result = selectResults[selectCall] ?? [];
      selectCall++;
      return makeChain(result);
    }),
  })),
  schema: {
    bookings: { providerId: '', status: '', createdAt: '', serviceId: '' },
    slots: { providerId: '', status: '', startTime: '' },
    services: { id: '', name: '', price: '' },
    providers: {},
    federationPeers: {},
    apiKeys: {},
    webhooks: {},
  },
}));

import { getProviderAnalytics, getServerStats } from './service.js';

describe('getProviderAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectCall = 0;
    selectResults = [];
  });

  it('returns zero analytics when no data exists', async () => {
    // 4 queries all return []
    selectResults = [[], [], [], []];

    const result = await getProviderAnalytics('provider-1');

    expect(result.bookings.total).toBe(0);
    expect(result.bookings.confirmed).toBe(0);
    expect(result.bookings.conversionRate).toBe(0);
    expect(result.slots.total).toBe(0);
    expect(result.slots.utilization).toBe(0);
    expect(result.topServices).toHaveLength(0);
    expect(result.revenueEstimate).toBe(0);
  });

  it('calculates booking counts correctly', async () => {
    selectResults = [
      // booking status counts
      [
        { status: 'confirmed', count: 10 },
        { status: 'completed', count: 5 },
        { status: 'cancelled', count: 2 },
        { status: 'pending', count: 1 },
        { status: 'no_show', count: 1 },
      ],
      // slot counts
      [],
      // top services
      [],
      // revenue
      [],
    ];

    const result = await getProviderAnalytics('provider-1');

    expect(result.bookings.total).toBe(19);
    expect(result.bookings.confirmed).toBe(10);
    expect(result.bookings.completed).toBe(5);
    expect(result.bookings.cancelled).toBe(2);
    expect(result.bookings.pending).toBe(1);
    expect(result.bookings.noShow).toBe(1);
    // conversionRate = (10+5)/19 ≈ 0.79
    expect(result.bookings.conversionRate).toBeCloseTo(0.79, 1);
  });

  it('calculates slot utilization correctly', async () => {
    selectResults = [
      // booking counts
      [],
      // slot counts: 3 booked out of 10 total
      [
        { status: 'available', count: 7 },
        { status: 'booked', count: 3 },
      ],
      // top services
      [],
      // revenue
      [],
    ];

    const result = await getProviderAnalytics('provider-1');

    expect(result.slots.total).toBe(10);
    expect(result.slots.booked).toBe(3);
    expect(result.slots.available).toBe(7);
    expect(result.slots.utilization).toBeCloseTo(0.3, 1);
  });

  it('calculates revenue estimate correctly', async () => {
    selectResults = [
      // booking counts
      [],
      // slot counts
      [],
      // top services
      [],
      // revenue rows: 5 bookings × 1500 RSD + 3 bookings × 2500 RSD
      [
        { price: '1500.00', bookingCount: 5 },
        { price: '2500.00', bookingCount: 3 },
      ],
    ];

    const result = await getProviderAnalytics('provider-1');

    expect(result.revenueEstimate).toBe(5 * 1500 + 3 * 2500); // 15000
  });

  it('returns top services', async () => {
    selectResults = [
      // booking counts
      [],
      // slot counts
      [],
      // top services
      [
        { serviceId: 'svc-1', serviceName: 'Muško šišanje', bookingCount: 10 },
        { serviceId: 'svc-2', serviceName: 'Žensko šišanje', bookingCount: 5 },
      ],
      // revenue
      [],
    ];

    const result = await getProviderAnalytics('provider-1');

    expect(result.topServices).toHaveLength(2);
    expect(result.topServices[0]?.serviceId).toBe('svc-1');
    expect(result.topServices[0]?.bookingCount).toBe(10);
  });
});

describe('getServerStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectCall = 0;
    selectResults = [];
  });

  it('returns all required fields', async () => {
    // 5 parallel selects + 1 sequential (activeBookings)
    selectResults = [
      [{ count: 5 }],   // providers
      [{ count: 10 }],  // services
      [{ count: 100 }], // bookings
      [{ count: 50 }],  // slots
      [{ count: 3 }],   // federationPeers
      [{ count: 8 }],   // activeBookings
    ];

    const result = await getServerStats();

    expect(result).toHaveProperty('providers');
    expect(result).toHaveProperty('services');
    expect(result).toHaveProperty('bookings');
    expect(result).toHaveProperty('slots');
    expect(result).toHaveProperty('federationPeers');
    expect(result).toHaveProperty('uptime');
    expect(result).toHaveProperty('memoryMb');
    expect(result.providers).toBe(5);
    expect(result.federationPeers).toBe(3);
  });

  it('falls back to zero when queries return empty', async () => {
    selectResults = [[], [], [], [], [], []];

    const result = await getServerStats();

    expect(result.providers).toBe(0);
    expect(result.services).toBe(0);
    expect(result.slots).toBe(0);
    expect(result.federationPeers).toBe(0);
  });
});
