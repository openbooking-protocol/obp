import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateTimeWindows } from './service.js';
import type { WeeklyRule, ScheduleException } from '../../db/schema.js';

// ── generateTimeWindows extended integration tests ─────────────────────────────
// (DB is not needed for generateTimeWindows — it's pure logic)

function makeSchedule(overrides: {
  weeklyRules?: WeeklyRule[];
  exceptions?: ScheduleException[];
  timezone?: string;
} = {}) {
  return {
    id: 'sched_1',
    providerId: 'prov_1',
    serviceId: null,
    resourceId: null,
    name: 'Test',
    timezone: overrides.timezone ?? 'UTC',
    weeklyRules: overrides.weeklyRules ?? [],
    exceptions: overrides.exceptions ?? [],
    effectiveFrom: null,
    effectiveTo: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe('generateTimeWindows — integration', () => {
  it('generates correct number of slots over a full week', () => {
    const monday = new Date('2026-03-16T00:00:00Z');
    const nextMonday = new Date('2026-03-23T00:00:00Z');

    const schedule = makeSchedule({
      weeklyRules: [
        { day: 'monday', open: true, slots: [{ start: '09:00', end: '17:00' }] },
        { day: 'tuesday', open: true, slots: [{ start: '09:00', end: '17:00' }] },
        { day: 'wednesday', open: true, slots: [{ start: '09:00', end: '17:00' }] },
        { day: 'thursday', open: true, slots: [{ start: '09:00', end: '17:00' }] },
        { day: 'friday', open: true, slots: [{ start: '09:00', end: '17:00' }] },
      ],
    });

    // 8h/day × 5 days = 40 slots of 60min
    const windows = generateTimeWindows(schedule, monday, nextMonday, 60);
    expect(windows).toHaveLength(40);
  });

  it('handles multiple time slots per day', () => {
    const monday = new Date('2026-03-16T00:00:00Z');
    const tuesday = new Date('2026-03-17T00:00:00Z');

    const schedule = makeSchedule({
      weeklyRules: [
        {
          day: 'monday', open: true,
          slots: [
            { start: '09:00', end: '12:00' },  // 3h morning
            { start: '14:00', end: '17:00' },  // 3h afternoon
          ],
        },
      ],
    });

    const windows = generateTimeWindows(schedule, monday, tuesday, 60);
    // 3 morning + 3 afternoon = 6 slots
    expect(windows).toHaveLength(6);
  });

  it('generates 30-min slots correctly', () => {
    const monday = new Date('2026-03-16T00:00:00Z');
    const tuesday = new Date('2026-03-17T00:00:00Z');

    const schedule = makeSchedule({
      weeklyRules: [
        { day: 'monday', open: true, slots: [{ start: '09:00', end: '11:00' }] },
      ],
    });

    const windows = generateTimeWindows(schedule, monday, tuesday, 30);
    // 2h / 30min = 4 slots
    expect(windows).toHaveLength(4);
  });

  it('handles exception override with custom hours', () => {
    const monday = new Date('2026-03-16T00:00:00Z');
    const tuesday = new Date('2026-03-17T00:00:00Z');

    const schedule = makeSchedule({
      weeklyRules: [
        { day: 'monday', open: true, slots: [{ start: '09:00', end: '17:00' }] },
      ],
      exceptions: [
        {
          date: '2026-03-16',
          open: true,
          slots: [{ start: '10:00', end: '12:00' }],
          reason: 'Short day',
        } as ScheduleException,
      ],
    });

    // Exception overrides: only 10:00-12:00 = 2 × 60min slots
    const windows = generateTimeWindows(schedule, monday, tuesday, 60);
    expect(windows).toHaveLength(2);
  });

  it('generates nothing for a date range with no matching days', () => {
    // Saturday + Sunday only, no weekend rules
    const saturday = new Date('2026-03-21T00:00:00Z');
    const monday = new Date('2026-03-23T00:00:00Z');

    const schedule = makeSchedule({
      weeklyRules: [
        { day: 'monday', open: true, slots: [{ start: '09:00', end: '17:00' }] },
      ],
    });

    const windows = generateTimeWindows(schedule, saturday, monday, 60);
    expect(windows).toHaveLength(0);
  });

  it('consecutive slots have correct adjacency', () => {
    const monday = new Date('2026-03-16T00:00:00Z');
    const tuesday = new Date('2026-03-17T00:00:00Z');

    const schedule = makeSchedule({
      weeklyRules: [
        { day: 'monday', open: true, slots: [{ start: '09:00', end: '11:00' }] },
      ],
    });

    const windows = generateTimeWindows(schedule, monday, tuesday, 60);
    expect(windows).toHaveLength(2);
    // Second slot starts where first ends
    expect(windows[1]?.start.getTime()).toBe(windows[0]?.end.getTime());
  });
});

// ── upsertSchedule mocked DB tests ────────────────────────────────────────────

const mockUpsertReturning = vi.fn();

function makeMockDb(rows: unknown[] = []) {
  const resolved = Promise.resolve(rows);
  const chain: Record<string, unknown> = Object.assign(resolved, {
    select: () => chain,
    from: () => chain,
    where: () => chain,
    orderBy: () => chain,
    limit: () => Promise.resolve(rows),
    insert: () => ({ values: () => ({ returning: mockUpsertReturning }) }),
    update: () => ({ set: () => ({ where: () => ({ returning: mockUpsertReturning }) }) }),
  });
  return chain;
}

vi.mock('../../db/index.js', () => ({
  getDb: vi.fn(),
  schema: {
    schedules: {
      id: 'id', providerId: 'providerId', serviceId: 'serviceId',
      resourceId: 'resourceId', name: 'name',
    },
  },
}));

import { getDb } from '../../db/index.js';
import { getSchedule, listSchedules, upsertSchedule } from './service.js';

const mockGetDb = vi.mocked(getDb);

beforeEach(() => vi.clearAllMocks());

describe('listSchedules', () => {
  it('returns all schedules for provider', async () => {
    const rows = [
      { id: 'sched_1', providerId: 'prov_1', name: 'Main' },
      { id: 'sched_2', providerId: 'prov_1', name: 'Weekend' },
    ];
    mockGetDb.mockReturnValue(makeMockDb(rows) as ReturnType<typeof getDb>);

    const result = await listSchedules('prov_1');
    expect(result).toHaveLength(2);
  });
});

describe('getSchedule', () => {
  it('throws 404 when not found', async () => {
    mockGetDb.mockReturnValue(makeMockDb([]) as ReturnType<typeof getDb>);
    await expect(getSchedule('sched_missing')).rejects.toThrow();
  });
});

describe('upsertSchedule', () => {
  it('creates new schedule when none exists', async () => {
    const created = { id: 'sched_new', providerId: 'prov_1', name: 'Main Schedule' };
    mockUpsertReturning.mockResolvedValueOnce([created]);
    mockGetDb.mockReturnValue(makeMockDb([]) as ReturnType<typeof getDb>);

    const result = await upsertSchedule('prov_1', {
      name: 'Main Schedule',
      timezone: 'UTC',
      weeklyRules: [],
      exceptions: [],
    });
    expect(result.id).toBe('sched_new');
  });
});
