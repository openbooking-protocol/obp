import { eq, and } from 'drizzle-orm';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { getDb, schema } from '../../db/index.js';
import { generateId } from '../../lib/id.js';
import { Errors } from '../../lib/errors.js';
import type { CreateScheduleInput, UpdateScheduleInput } from './schema.js';
import type { WeeklyRule, ScheduleException } from '../../db/schema.js';

const DAY_MAP: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

export async function getSchedule(id: string) {
  const db = getDb();
  const [schedule] = await db
    .select()
    .from(schema.schedules)
    .where(eq(schema.schedules.id, id))
    .limit(1);

  if (!schedule) throw Errors.notFound('Schedule', id);
  return schedule;
}

export async function listSchedules(providerId: string) {
  const db = getDb();
  return db
    .select()
    .from(schema.schedules)
    .where(eq(schema.schedules.providerId, providerId));
}

export async function upsertSchedule(providerId: string, input: CreateScheduleInput) {
  const db = getDb();

  // Find existing schedule for this provider/service/resource
  const conditions = [eq(schema.schedules.providerId, providerId)];
  if (input.serviceId) conditions.push(eq(schema.schedules.serviceId, input.serviceId));
  if (input.resourceId) conditions.push(eq(schema.schedules.resourceId, input.resourceId));

  const [existing] = await db
    .select()
    .from(schema.schedules)
    .where(and(...conditions))
    .limit(1);

  const data = {
    providerId,
    serviceId: input.serviceId,
    resourceId: input.resourceId,
    name: input.name ?? 'Default',
    timezone: input.timezone ?? 'UTC',
    weeklyRules: input.weeklyRules as WeeklyRule[],
    exceptions: input.exceptions as ScheduleException[],
    effectiveFrom: input.effectiveFrom ? new Date(input.effectiveFrom) : null,
    effectiveTo: input.effectiveTo ? new Date(input.effectiveTo) : null,
    updatedAt: new Date(),
  };

  if (existing) {
    const [updated] = await db
      .update(schema.schedules)
      .set(data)
      .where(eq(schema.schedules.id, existing.id))
      .returning();
    return updated!;
  }

  const [created] = await db
    .insert(schema.schedules)
    .values({ id: generateId(), ...data, createdAt: new Date() })
    .returning();

  return created!;
}

/**
 * Generate slots for a service from its schedule
 * Returns time windows for the given date range
 */
export function generateTimeWindows(
  schedule: typeof schema.schedules.$inferSelect,
  from: Date,
  to: Date,
  durationMinutes: number,
  bufferAfterMinutes: number = 0,
): Array<{ start: Date; end: Date }> {
  const windows: Array<{ start: Date; end: Date }> = [];
  const weeklyRules = schedule.weeklyRules as WeeklyRule[];
  const exceptions = schedule.exceptions as ScheduleException[];
  const tz = schedule.timezone;

  // Work in the schedule's timezone
  const currentZoned = toZonedTime(from, tz);
  currentZoned.setHours(0, 0, 0, 0);
  const current = fromZonedTime(currentZoned, tz);

  while (current <= to) {
    const currentInTz = toZonedTime(current, tz);
    const dateStr = formatDate(currentInTz);
    const dayOfWeek = currentInTz.getDay();

    // Check exceptions first
    const exception = exceptions.find((e) => e.date === dateStr);
    const isOpen = exception ? exception.open : getDayRule(weeklyRules, dayOfWeek)?.open ?? false;

    if (isOpen) {
      const daySlots = exception?.slots ?? getDayRule(weeklyRules, dayOfWeek)?.slots ?? [];

      for (const slot of daySlots) {
        const [startH, startM] = slot.start.split(':').map(Number);
        const [endH, endM] = slot.end.split(':').map(Number);

        // Build start/end in the schedule's timezone, then convert to UTC
        const slotStartZoned = toZonedTime(current, tz);
        slotStartZoned.setHours(startH!, startM!, 0, 0);
        const slotStart = fromZonedTime(slotStartZoned, tz);

        const slotEndZoned = toZonedTime(current, tz);
        slotEndZoned.setHours(endH!, endM!, 0, 0);
        const slotEnd = fromZonedTime(slotEndZoned, tz);

        // Generate individual appointment windows
        const slotDuration = durationMinutes + bufferAfterMinutes;
        let windowStart = new Date(slotStart);

        while (windowStart.getTime() + durationMinutes * 60000 <= slotEnd.getTime()) {
          const windowEnd = new Date(windowStart.getTime() + durationMinutes * 60000);

          if (windowStart >= from && windowEnd <= to) {
            windows.push({ start: new Date(windowStart), end: new Date(windowEnd) });
          }

          windowStart = new Date(windowStart.getTime() + slotDuration * 60000);
        }
      }
    }

    // Advance by one day in the schedule's timezone (handles DST)
    const nextZoned = toZonedTime(current, tz);
    nextZoned.setDate(nextZoned.getDate() + 1);
    nextZoned.setHours(0, 0, 0, 0);
    current.setTime(fromZonedTime(nextZoned, tz).getTime());
  }

  return windows;
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getDayRule(rules: WeeklyRule[], dayIndex: number): WeeklyRule | undefined {
  const dayName = Object.entries(DAY_MAP).find(([, v]) => v === dayIndex)?.[0];
  return rules.find((r) => r.day === dayName);
}
