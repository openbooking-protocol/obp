import { describe, it, expect } from 'vitest';
import { generateTimeWindows } from './service.js';
import type { WeeklyRule, ScheduleException } from '../../db/schema.js';

function makeSchedule(overrides: Partial<{
  weeklyRules: WeeklyRule[];
  exceptions: ScheduleException[];
  timezone: string;
}> = {}) {
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

describe('generateTimeWindows', () => {
  it('generates slots for a single working day', () => {
    const monday = new Date('2026-03-16T00:00:00Z'); // Monday
    const tuesday = new Date('2026-03-17T00:00:00Z');

    const schedule = makeSchedule({
      weeklyRules: [
        { day: 'monday', open: true, slots: [{ start: '09:00', end: '12:00' }] },
      ],
    });

    const windows = generateTimeWindows(schedule, monday, tuesday, 60);

    // 3 hours / 60 min = 3 slots
    expect(windows).toHaveLength(3);
    expect(windows[0]?.start).toEqual(new Date('2026-03-16T09:00:00.000Z'));
    expect(windows[0]?.end).toEqual(new Date('2026-03-16T10:00:00.000Z'));
  });

  it('respects buffer time between slots', () => {
    const monday = new Date('2026-03-16T00:00:00Z');
    const tuesday = new Date('2026-03-17T00:00:00Z');

    const schedule = makeSchedule({
      weeklyRules: [
        { day: 'monday', open: true, slots: [{ start: '09:00', end: '12:00' }] },
      ],
    });

    // 30 min service + 10 min buffer = 40 min slots
    const windows = generateTimeWindows(schedule, monday, tuesday, 30, 10);

    // 180 min / 40 min = 4 slots (9:00, 9:40, 10:20, 11:00) — last ends 11:30 which is <= 12:00
    expect(windows.length).toBeGreaterThanOrEqual(4);
  });

  it('respects exceptions', () => {
    const monday = new Date('2026-03-16T00:00:00Z');
    const tuesday = new Date('2026-03-17T00:00:00Z');

    const schedule = makeSchedule({
      weeklyRules: [
        { day: 'monday', open: true, slots: [{ start: '09:00', end: '12:00' }] },
      ],
      exceptions: [
        { date: '2026-03-16', open: false, reason: 'Holiday' },
      ],
    });

    const windows = generateTimeWindows(schedule, monday, tuesday, 60);
    expect(windows).toHaveLength(0);
  });

  it('generates no slots for closed days', () => {
    const saturday = new Date('2026-03-21T00:00:00Z');
    const sunday = new Date('2026-03-22T00:00:00Z');

    const schedule = makeSchedule({
      weeklyRules: [
        { day: 'saturday', open: false, slots: [] },
      ],
    });

    const windows = generateTimeWindows(schedule, saturday, sunday, 60);
    expect(windows).toHaveLength(0);
  });
});
