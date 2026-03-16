import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockInsertReturning = vi.fn();
const mockUpdateReturning = vi.fn();

function makeMockDb(rows: unknown[] = []) {
  const chain: Record<string, unknown> = {};
  const terminal = () => Promise.resolve(rows);
  chain.select = () => chain;
  chain.from = () => chain;
  chain.where = () => chain;
  chain.orderBy = () => chain;
  chain.limit = terminal;
  chain.insert = () => ({ values: () => ({ returning: mockInsertReturning }) });
  chain.update = () => ({ set: () => ({ where: () => ({ returning: mockUpdateReturning }) }) });
  chain.delete = () => ({ where: vi.fn() });
  return chain;
}

vi.mock('../../db/index.js', () => ({
  getDb: vi.fn(),
  schema: {
    services: {
      id: 'id', name: 'name', providerId: 'providerId', category: 'category',
      status: 'status', sortOrder: 'sortOrder',
    },
    resourceServices: { serviceId: 'serviceId', resourceId: 'resourceId' },
  },
}));

import { getDb } from '../../db/index.js';
import { listServices, getService, createService, updateService, deleteService } from './service.js';

const mockGetDb = vi.mocked(getDb);

beforeEach(() => vi.clearAllMocks());

describe('listServices', () => {
  it('returns items with pagination', async () => {
    const fakeServices = [
      { id: 'svc_1', name: 'Haircut', providerId: 'prov_1', category: 'hair', status: 'active', sortOrder: 0 },
    ];
    mockGetDb.mockReturnValue(makeMockDb(fakeServices) as ReturnType<typeof getDb>);

    const result = await listServices({ limit: 20 });
    expect(result.items).toHaveLength(1);
    expect(result.pagination.hasMore).toBe(false);
  });

  it('applies hasMore when limit exceeded', async () => {
    const rows = Array.from({ length: 21 }, (_, i) => ({
      id: `svc_${i}`, name: `S${i}`, providerId: 'prov_1', category: 'hair', status: 'active', sortOrder: i,
    }));
    mockGetDb.mockReturnValue(makeMockDb(rows) as ReturnType<typeof getDb>);

    const result = await listServices({ limit: 20 });
    expect(result.pagination.hasMore).toBe(true);
    expect(result.items).toHaveLength(20);
    expect(result.pagination.nextCursor).toBe('svc_19');
  });
});

describe('getService', () => {
  it('throws 404 when not found', async () => {
    mockGetDb.mockReturnValue(makeMockDb([]) as ReturnType<typeof getDb>);
    await expect(getService('svc_missing')).rejects.toThrow();
  });

  it('returns service when found', async () => {
    const svc = { id: 'svc_1', name: 'Haircut', providerId: 'prov_1', category: 'hair' };
    mockGetDb.mockReturnValue(makeMockDb([svc]) as ReturnType<typeof getDb>);
    const result = await getService('svc_1');
    expect(result.id).toBe('svc_1');
  });
});

describe('createService', () => {
  it('inserts and returns new service', async () => {
    const newSvc = { id: 'svc_new', name: 'Beard Trim', providerId: 'prov_1', durationMinutes: 20, category: 'hair' };
    mockInsertReturning.mockResolvedValueOnce([newSvc]);
    mockGetDb.mockReturnValue(makeMockDb([]) as ReturnType<typeof getDb>);

    const result = await createService({
      providerId: 'prov_1',
      name: 'Beard Trim',
      category: 'hair',
      durationMinutes: 20,
    });
    expect(result.name).toBe('Beard Trim');
    expect(mockInsertReturning).toHaveBeenCalledOnce();
  });
});

describe('updateService', () => {
  it('throws 404 when service not found', async () => {
    mockGetDb.mockReturnValue(makeMockDb([]) as ReturnType<typeof getDb>);
    await expect(updateService('svc_missing', { name: 'X' })).rejects.toThrow();
  });

  it('updates and returns modified service', async () => {
    const existing = { id: 'svc_1', name: 'Old', providerId: 'prov_1' };
    const updated = { ...existing, name: 'New' };
    mockUpdateReturning.mockResolvedValueOnce([updated]);
    mockGetDb.mockReturnValue(makeMockDb([existing]) as ReturnType<typeof getDb>);

    const result = await updateService('svc_1', { name: 'New' });
    expect(result.name).toBe('New');
  });
});

describe('deleteService', () => {
  it('throws 404 when service not found', async () => {
    mockGetDb.mockReturnValue(makeMockDb([]) as ReturnType<typeof getDb>);
    await expect(deleteService('svc_missing')).rejects.toThrow();
  });
});
