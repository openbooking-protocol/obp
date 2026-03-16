import { eq, and, gte, lte, gt } from 'drizzle-orm';
import { getDb, schema } from '../../db/index.js';
import { getRedis, redisKeys, SLOT_HOLD_TTL_SECONDS } from '../../redis.js';
import { generateId } from '../../lib/id.js';
import { Errors } from '../../lib/errors.js';
import type { ListSlotsQuery } from './schema.js';

export async function listSlots(query: ListSlotsQuery) {
  const db = getDb();
  const { serviceId, providerId, from, to, status, limit, cursor } = query;

  const conditions = [
    gte(schema.slots.startTime, new Date(from)),
    lte(schema.slots.startTime, new Date(to)),
  ];

  if (serviceId) conditions.push(eq(schema.slots.serviceId, serviceId));
  if (providerId) conditions.push(eq(schema.slots.providerId, providerId));
  if (status) conditions.push(eq(schema.slots.status, status));
  if (cursor) conditions.push(gt(schema.slots.id, cursor));

  const rows = await db
    .select()
    .from(schema.slots)
    .where(and(...conditions))
    .orderBy(schema.slots.startTime, schema.slots.id)
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;

  // Release expired holds
  await releaseExpiredHolds();

  return {
    items,
    pagination: {
      limit,
      hasMore,
      nextCursor: hasMore ? items[items.length - 1]?.id : undefined,
    },
  };
}

export async function getSlot(id: string) {
  const db = getDb();
  const [slot] = await db
    .select()
    .from(schema.slots)
    .where(eq(schema.slots.id, id))
    .limit(1);

  if (!slot) throw Errors.notFound('Slot', id);
  return slot;
}

/**
 * Hold a slot using Redis SETNX for atomic lock + DB update
 */
export async function holdSlot(slotId: string, holdToken: string): Promise<typeof schema.slots.$inferSelect> {
  const redis = getRedis();
  const db = getDb();

  // Check slot exists and is available
  const slot = await getSlot(slotId);

  if (slot.status === 'booked') {
    throw Errors.conflict('Slot is already booked');
  }
  if (slot.status === 'blocked') {
    throw Errors.conflict('Slot is blocked');
  }

  // Try atomic Redis lock (SETNX)
  const lockKey = redisKeys.slotHold(slotId);
  const acquired = await redis.set(lockKey, holdToken, 'EX', SLOT_HOLD_TTL_SECONDS, 'NX');

  if (!acquired) {
    // Check if this token already holds it
    const existingToken = await redis.get(lockKey);
    if (existingToken !== holdToken) {
      throw Errors.conflict('Slot is already held by another session');
    }
    // Refresh TTL for same token
    await redis.expire(lockKey, SLOT_HOLD_TTL_SECONDS);
  }

  const heldUntil = new Date(Date.now() + SLOT_HOLD_TTL_SECONDS * 1000);

  const [updated] = await db
    .update(schema.slots)
    .set({ status: 'held', heldUntil, heldBy: holdToken, updatedAt: new Date() })
    .where(eq(schema.slots.id, slotId))
    .returning();

  return updated!;
}

export async function releaseHold(slotId: string, holdToken: string): Promise<void> {
  const redis = getRedis();
  const db = getDb();

  const lockKey = redisKeys.slotHold(slotId);
  const existing = await redis.get(lockKey);

  if (existing && existing !== holdToken) {
    throw Errors.forbidden('Cannot release hold owned by another session');
  }

  await redis.del(lockKey);
  await db
    .update(schema.slots)
    .set({ status: 'available', heldUntil: null, heldBy: null, updatedAt: new Date() })
    .where(and(eq(schema.slots.id, slotId), eq(schema.slots.heldBy, holdToken)));
}

export async function bookSlot(slotId: string, bookingId: string): Promise<void> {
  const db = getDb();
  await db
    .update(schema.slots)
    .set({ status: 'booked', bookingId, updatedAt: new Date() })
    .where(eq(schema.slots.id, slotId));
}

export async function createSlot(data: {
  providerId: string;
  serviceId: string;
  resourceId?: string;
  scheduleId?: string;
  startTime: Date;
  endTime: Date;
  capacity?: number;
}) {
  const db = getDb();
  const id = generateId();
  const now = new Date();

  // Check for conflicts
  const conflicts = await db
    .select({ id: schema.slots.id })
    .from(schema.slots)
    .where(
      and(
        eq(schema.slots.serviceId, data.serviceId),
        eq(schema.slots.status, 'available'),
        lte(schema.slots.startTime, data.endTime),
        gte(schema.slots.endTime, data.startTime),
      ),
    )
    .limit(1);

  if (conflicts.length > 0) {
    throw Errors.conflict('Slot conflicts with an existing slot');
  }

  const [slot] = await db
    .insert(schema.slots)
    .values({
      id,
      providerId: data.providerId,
      serviceId: data.serviceId,
      resourceId: data.resourceId,
      scheduleId: data.scheduleId,
      startTime: data.startTime,
      endTime: data.endTime,
      capacity: data.capacity ?? 1,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return slot!;
}

async function releaseExpiredHolds() {
  const db = getDb();
  await db
    .update(schema.slots)
    .set({ status: 'available', heldUntil: null, heldBy: null, updatedAt: new Date() })
    .where(and(eq(schema.slots.status, 'held'), lte(schema.slots.heldUntil, new Date())));
}
