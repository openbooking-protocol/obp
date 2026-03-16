import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockInsertReturning = vi.fn();
const mockUpdateReturning = vi.fn();

function makeMockDb(rows: unknown[] = []) {
  const chain: Record<string, unknown> = {};
  chain.select = () => chain;
  chain.from = () => chain;
  chain.where = () => chain;
  chain.orderBy = () => chain;
  chain.limit = () => Promise.resolve(rows);
  chain.insert = () => ({ values: () => ({ returning: mockInsertReturning }) });
  chain.update = () => ({ set: () => ({ where: () => ({ returning: mockUpdateReturning }) }) });
  return chain;
}

const mockRedisGet = vi.fn();
const mockRedisSet = vi.fn();
const mockRedisDel = vi.fn();
const mockRedisExpire = vi.fn();

vi.mock('../../db/index.js', () => ({
  getDb: vi.fn(),
  schema: {
    slots: {
      id: 'id', status: 'status', serviceId: 'serviceId', providerId: 'providerId',
      startTime: 'startTime', endTime: 'endTime', heldUntil: 'heldUntil', heldBy: 'heldBy',
      bookingId: 'bookingId', capacity: 'capacity',
    },
  },
}));

vi.mock('../../redis.js', () => ({
  getRedis: () => ({
    get: mockRedisGet,
    set: mockRedisSet,
    del: mockRedisDel,
    expire: mockRedisExpire,
  }),
  redisKeys: {
    slotHold: (id: string) => `slot:hold:${id}`,
  },
  SLOT_HOLD_TTL_SECONDS: 600,
}));

import { getDb } from '../../db/index.js';
import { listSlots, getSlot, holdSlot, createSlot } from './service.js';

const mockGetDb = vi.mocked(getDb);

beforeEach(() => vi.clearAllMocks());

describe('listSlots', () => {
  it('returns items with pagination', async () => {
    const fakeSlots = [
      { id: 'slot_1', status: 'available', startTime: new Date(), endTime: new Date() },
    ];
    mockGetDb.mockReturnValue(makeMockDb(fakeSlots) as ReturnType<typeof getDb>);

    const result = await listSlots({
      from: '2026-03-16T09:00:00Z',
      to: '2026-03-16T17:00:00Z',
      limit: 100,
    });
    expect(result.items).toHaveLength(1);
    expect(result.pagination.hasMore).toBe(false);
  });
});

describe('getSlot', () => {
  it('throws 404 when slot not found', async () => {
    mockGetDb.mockReturnValue(makeMockDb([]) as ReturnType<typeof getDb>);
    await expect(getSlot('slot_missing')).rejects.toThrow();
  });

  it('returns slot when found', async () => {
    const slot = { id: 'slot_1', status: 'available' };
    mockGetDb.mockReturnValue(makeMockDb([slot]) as ReturnType<typeof getDb>);
    const result = await getSlot('slot_1');
    expect(result.id).toBe('slot_1');
  });
});

describe('holdSlot', () => {
  it('throws conflict when slot is already booked', async () => {
    const slot = { id: 'slot_1', status: 'booked' };
    mockGetDb.mockReturnValue(makeMockDb([slot]) as ReturnType<typeof getDb>);

    await expect(holdSlot('slot_1', 'tok_abc')).rejects.toMatchObject({ status: 409 });
  });

  it('throws conflict when slot is blocked', async () => {
    const slot = { id: 'slot_1', status: 'blocked' };
    mockGetDb.mockReturnValue(makeMockDb([slot]) as ReturnType<typeof getDb>);

    await expect(holdSlot('slot_1', 'tok_abc')).rejects.toMatchObject({ status: 409 });
  });

  it('acquires Redis lock and updates DB for available slot', async () => {
    const slot = { id: 'slot_1', status: 'available' };
    const updatedSlot = { id: 'slot_1', status: 'held', heldBy: 'tok_abc' };

    mockGetDb.mockReturnValue(makeMockDb([slot]) as ReturnType<typeof getDb>);
    mockRedisSet.mockResolvedValueOnce('OK'); // lock acquired
    mockUpdateReturning.mockResolvedValueOnce([updatedSlot]);

    const result = await holdSlot('slot_1', 'tok_abc');
    expect(result.status).toBe('held');
    expect(mockRedisSet).toHaveBeenCalledOnce();
  });

  it('refreshes TTL when same token re-holds', async () => {
    const slot = { id: 'slot_1', status: 'available' };
    const updatedSlot = { id: 'slot_1', status: 'held', heldBy: 'tok_abc' };

    mockGetDb.mockReturnValue(makeMockDb([slot]) as ReturnType<typeof getDb>);
    mockRedisSet.mockResolvedValueOnce(null);   // lock NOT acquired (already held)
    mockRedisGet.mockResolvedValueOnce('tok_abc'); // same token
    mockRedisExpire.mockResolvedValueOnce(1);
    mockUpdateReturning.mockResolvedValueOnce([updatedSlot]);

    await holdSlot('slot_1', 'tok_abc');
    expect(mockRedisExpire).toHaveBeenCalledOnce();
  });

  it('throws conflict when different token holds the slot', async () => {
    const slot = { id: 'slot_1', status: 'available' };
    mockGetDb.mockReturnValue(makeMockDb([slot]) as ReturnType<typeof getDb>);
    mockRedisSet.mockResolvedValueOnce(null);      // lock not acquired
    mockRedisGet.mockResolvedValueOnce('tok_other'); // different token holds it

    await expect(holdSlot('slot_1', 'tok_abc')).rejects.toMatchObject({ status: 409 });
  });
});

describe('createSlot', () => {
  it('throws conflict when overlapping slot exists', async () => {
    // First getSlot-like query returns conflict
    const conflict = { id: 'slot_existing' };
    mockGetDb.mockReturnValue(makeMockDb([conflict]) as ReturnType<typeof getDb>);

    await expect(createSlot({
      providerId: 'prov_1',
      serviceId: 'svc_1',
      startTime: new Date('2026-03-16T09:00:00Z'),
      endTime: new Date('2026-03-16T10:00:00Z'),
    })).rejects.toThrow(/conflict/i);
  });

  it('creates slot when no conflicts', async () => {
    const newSlot = {
      id: 'slot_new', providerId: 'prov_1', serviceId: 'svc_1',
      startTime: new Date(), endTime: new Date(), status: 'available',
    };
    mockInsertReturning.mockResolvedValueOnce([newSlot]);
    mockGetDb.mockReturnValue(makeMockDb([]) as ReturnType<typeof getDb>);

    const result = await createSlot({
      providerId: 'prov_1',
      serviceId: 'svc_1',
      startTime: new Date('2026-03-16T09:00:00Z'),
      endTime: new Date('2026-03-16T10:00:00Z'),
    });
    expect(result.id).toBe('slot_new');
    expect(mockInsertReturning).toHaveBeenCalledOnce();
  });
});
