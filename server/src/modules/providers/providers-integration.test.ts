import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock DB ────────────────────────────────────────────────────────────────────

const mockInsertReturning = vi.fn();
const mockUpdateReturning = vi.fn();
const mockDeleteWhere = vi.fn();

function makeMockDb(rows: unknown[] = []) {
  const chain = {
    select: () => chain,
    from: () => chain,
    where: () => chain,
    orderBy: () => chain,
    limit: () => Promise.resolve(rows),
    insert: () => ({ values: () => ({ returning: mockInsertReturning }) }),
    update: () => ({ set: () => ({ where: () => ({ returning: mockUpdateReturning }) }) }),
    delete: () => ({ where: mockDeleteWhere }),
  };
  return chain;
}

vi.mock('../../db/index.js', () => ({
  getDb: vi.fn(),
  schema: {
    providers: {
      id: 'id', name: 'name', slug: 'slug', status: 'status',
      email: 'email', categories: 'categories', updatedAt: 'updatedAt',
    },
  },
}));

import { getDb } from '../../db/index.js';
import {
  listProviders,
  getProvider,
  createProvider,
  updateProvider,
} from './service.js';

const mockGetDb = vi.mocked(getDb);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('listProviders', () => {
  it('returns items and pagination', async () => {
    const fakeProviders = [
      { id: 'prov_1', name: 'Salon A', slug: 'salon-a', categories: [], status: 'active' },
      { id: 'prov_2', name: 'Salon B', slug: 'salon-b', categories: [], status: 'active' },
    ];
    mockGetDb.mockReturnValue(makeMockDb(fakeProviders) as ReturnType<typeof getDb>);

    const result = await listProviders({ limit: 20, page: 1 });
    expect(result.items).toHaveLength(2);
    expect(result.pagination).toBeDefined();
    expect(result.pagination.hasMore).toBe(false);
  });

  it('sets hasMore when more results than limit', async () => {
    // Return limit+1 rows to trigger hasMore
    const rows = Array.from({ length: 21 }, (_, i) => ({
      id: `prov_${i}`, name: `P${i}`, slug: `p${i}`, categories: [], status: 'active',
    }));
    mockGetDb.mockReturnValue(makeMockDb(rows) as ReturnType<typeof getDb>);

    const result = await listProviders({ limit: 20, page: 1 });
    expect(result.pagination.hasMore).toBe(true);
    expect(result.items).toHaveLength(20);
  });

  it('filters by category client-side', async () => {
    const rows = [
      { id: 'prov_1', name: 'Hair', slug: 'hair', categories: ['hair'], status: 'active' },
      { id: 'prov_2', name: 'Spa', slug: 'spa', categories: ['spa'], status: 'active' },
    ];
    mockGetDb.mockReturnValue(makeMockDb(rows) as ReturnType<typeof getDb>);

    const result = await listProviders({ limit: 20, page: 1, category: 'hair' });
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.id).toBe('prov_1');
  });
});

describe('getProvider', () => {
  it('throws 404 when not found', async () => {
    mockGetDb.mockReturnValue(makeMockDb([]) as ReturnType<typeof getDb>);
    await expect(getProvider('nonexistent')).rejects.toThrow();
  });

  it('returns provider when found', async () => {
    const provider = { id: 'prov_1', name: 'Salon', slug: 'salon', categories: [] };
    mockGetDb.mockReturnValue(makeMockDb([provider]) as ReturnType<typeof getDb>);
    const result = await getProvider('prov_1');
    expect(result.id).toBe('prov_1');
  });
});

describe('createProvider', () => {
  it('creates and returns new provider', async () => {
    const newProvider = {
      id: 'prov_new',
      name: 'New Salon',
      slug: 'new-salon',
      email: 'new@salon.com',
      timezone: 'UTC',
      locale: 'en',
      currency: 'EUR',
      categories: [],
      status: 'active',
    };
    mockInsertReturning.mockResolvedValueOnce([newProvider]);
    mockGetDb.mockReturnValue(makeMockDb([]) as ReturnType<typeof getDb>);

    const result = await createProvider({
      name: 'New Salon',
      slug: 'new-salon',
      email: 'new@salon.com',
    });
    expect(result.name).toBe('New Salon');
    expect(mockInsertReturning).toHaveBeenCalledOnce();
  });
});

describe('updateProvider', () => {
  it('throws 404 when provider does not exist', async () => {
    mockGetDb.mockReturnValue(makeMockDb([]) as ReturnType<typeof getDb>);
    await expect(updateProvider('nonexistent', { name: 'X' })).rejects.toThrow();
  });

  it('returns updated provider', async () => {
    const existing = { id: 'prov_1', name: 'Old Name', slug: 'old', categories: [] };
    const updated = { ...existing, name: 'New Name' };
    mockUpdateReturning.mockResolvedValueOnce([updated]);
    mockGetDb.mockReturnValue(makeMockDb([existing]) as ReturnType<typeof getDb>);

    const result = await updateProvider('prov_1', { name: 'New Name' });
    expect(result.name).toBe('New Name');
  });
});
