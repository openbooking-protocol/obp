import { eq, and, gte, lte, gt, sql } from 'drizzle-orm';
import { getDb, schema } from '../../db/index.js';
import { getRedis, redisKeys } from '../../redis.js';
import { generateId } from '../../lib/id.js';
import { Errors } from '../../lib/errors.js';
import { bookSlot } from '../slots/service.js';
import { emitWebhookEvent } from '../webhooks/service.js';
import { sendEmail } from '../../lib/email.js';
import {
  bookingConfirmationTemplate,
  bookingCancelledTemplate,
} from '../../lib/email-templates.js';
import { config } from '../../config.js';
import type { CreateBookingInput, CancelBookingInput, ListBookingsQuery } from './schema.js';

// Valid state transitions
const TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['completed', 'cancelled', 'no_show'],
  cancelled: [],
  completed: [],
  no_show: [],
};

function assertTransition(from: string, to: string) {
  const allowed = TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    throw Errors.conflict(`Cannot transition booking from '${from}' to '${to}'`);
  }
}

export async function listBookings(query: ListBookingsQuery) {
  const db = getDb();
  const { providerId, serviceId, status, customerEmail, from, to, limit, cursor } = query;

  const conditions = [];
  if (providerId) conditions.push(eq(schema.bookings.providerId, providerId));
  if (serviceId) conditions.push(eq(schema.bookings.serviceId, serviceId));
  if (status) conditions.push(eq(schema.bookings.status, status));
  if (customerEmail) conditions.push(eq(schema.bookings.customerEmail, customerEmail));
  if (from) conditions.push(gte(schema.bookings.createdAt, new Date(from)));
  if (to) conditions.push(lte(schema.bookings.createdAt, new Date(to)));
  if (cursor) conditions.push(gt(schema.bookings.id, cursor));

  const rows = await db
    .select()
    .from(schema.bookings)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(schema.bookings.createdAt, schema.bookings.id)
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;

  return {
    items,
    pagination: { limit, hasMore, nextCursor: hasMore ? items[items.length - 1]?.id : undefined },
  };
}

export async function getBooking(id: string) {
  const db = getDb();
  const [booking] = await db
    .select()
    .from(schema.bookings)
    .where(eq(schema.bookings.id, id))
    .limit(1);

  if (!booking) throw Errors.notFound('Booking', id);
  return booking;
}

export async function createBooking(input: CreateBookingInput) {
  const db = getDb();
  const redis = getRedis();

  // Load slot
  const [slot] = await db
    .select()
    .from(schema.slots)
    .where(eq(schema.slots.id, input.slotId))
    .limit(1);

  if (!slot) throw Errors.notFound('Slot', input.slotId);

  // Validate slot is available or held by this token
  if (slot.status === 'booked') {
    throw Errors.conflict('Slot is already booked');
  }
  if (slot.status === 'blocked') {
    throw Errors.conflict('Slot is not available');
  }
  if (slot.status === 'held') {
    // Must provide matching hold token
    if (!input.holdToken) {
      throw Errors.conflict('Slot is held. Provide holdToken to confirm booking.');
    }
    const lockKey = redisKeys.slotHold(input.slotId);
    const existingToken = await redis.get(lockKey);
    if (existingToken !== input.holdToken) {
      throw Errors.conflict('Invalid or expired hold token');
    }
  }

  // Load service to get providerId
  const [service] = await db
    .select()
    .from(schema.services)
    .where(eq(schema.services.id, input.serviceId))
    .limit(1);

  if (!service) throw Errors.notFound('Service', input.serviceId);

  const id = generateId();
  const now = new Date();

  // Determine initial status
  const initialStatus = service.requiresConfirmation ? 'pending' : 'confirmed';

  const [booking] = await db
    .insert(schema.bookings)
    .values({
      id,
      providerId: service.providerId,
      serviceId: input.serviceId,
      slotId: input.slotId,
      resourceId: slot.resourceId,
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      customerPhone: input.customerPhone,
      notes: input.notes,
      metadata: input.metadata,
      status: initialStatus,
      confirmedAt: initialStatus === 'confirmed' ? now : undefined,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  // Mark slot as booked
  await bookSlot(input.slotId, id);

  // Release Redis hold if it existed
  if (input.holdToken) {
    const lockKey = redisKeys.slotHold(input.slotId);
    await redis.del(lockKey);
  }

  // Emit webhook
  void emitWebhookEvent(service.providerId, 'booking.created', booking);

  // Send email notification (fire-and-forget)
  void (async () => {
    const [provider] = await db
      .select({ name: schema.providers.name, email: schema.providers.email })
      .from(schema.providers)
      .where(eq(schema.providers.id, service.providerId))
      .limit(1);

    if (slot.startTime && slot.endTime) {
      await sendEmail({
        to: booking!.customerEmail,
        template: bookingConfirmationTemplate({
          customerName: booking!.customerName,
          serviceName: service.name,
          providerName: provider?.name ?? 'Provider',
          startTime: slot.startTime,
          endTime: slot.endTime,
          bookingId: booking!.id,
          serverUrl: config.SERVER_URL,
        }),
      });
    }
  })();

  return booking!;
}

export async function confirmBooking(id: string) {
  const db = getDb();
  const booking = await getBooking(id);

  assertTransition(booking.status, 'confirmed');

  const [updated] = await db
    .update(schema.bookings)
    .set({
      status: 'confirmed',
      confirmedAt: new Date(),
      version: sql`${schema.bookings.version} + 1`,
      updatedAt: new Date(),
    })
    .where(and(eq(schema.bookings.id, id), eq(schema.bookings.version, booking.version)))
    .returning();

  if (!updated) throw Errors.conflict('Booking was modified concurrently. Retry.');

  void emitWebhookEvent(updated.providerId, 'booking.confirmed', updated);
  return updated;
}

export async function cancelBooking(id: string, input: CancelBookingInput) {
  const db = getDb();
  const booking = await getBooking(id);

  assertTransition(booking.status, 'cancelled');

  const now = new Date();
  const [updated] = await db
    .update(schema.bookings)
    .set({
      status: 'cancelled',
      cancelledAt: now,
      cancellationReason: input.reason,
      version: sql`${schema.bookings.version} + 1`,
      updatedAt: now,
    })
    .where(and(eq(schema.bookings.id, id), eq(schema.bookings.version, booking.version)))
    .returning();

  if (!updated) throw Errors.conflict('Booking was modified concurrently. Retry.');

  // Free the slot
  await db
    .update(schema.slots)
    .set({ status: 'available', bookingId: null, updatedAt: now })
    .where(eq(schema.slots.id, booking.slotId));

  void emitWebhookEvent(updated.providerId, 'booking.cancelled', updated);

  // Send cancellation email (fire-and-forget)
  void (async () => {
    const [service] = await db
      .select({ name: schema.services.name })
      .from(schema.services)
      .where(eq(schema.services.id, updated.serviceId))
      .limit(1);
    const [provider] = await db
      .select({ name: schema.providers.name })
      .from(schema.providers)
      .where(eq(schema.providers.id, updated.providerId))
      .limit(1);
    const [slot] = await db
      .select({ startTime: schema.slots.startTime })
      .from(schema.slots)
      .where(eq(schema.slots.id, updated.slotId))
      .limit(1);

    if (slot?.startTime) {
      await sendEmail({
        to: updated.customerEmail,
        template: bookingCancelledTemplate({
          customerName: updated.customerName,
          serviceName: service?.name ?? 'Service',
          providerName: provider?.name ?? 'Provider',
          startTime: slot.startTime,
          bookingId: updated.id,
          ...(updated.cancellationReason ? { reason: updated.cancellationReason } : {}),
        }),
      });
    }
  })();

  return updated;
}

export async function completeBooking(id: string) {
  const db = getDb();
  const booking = await getBooking(id);

  assertTransition(booking.status, 'completed');

  const [updated] = await db
    .update(schema.bookings)
    .set({
      status: 'completed',
      completedAt: new Date(),
      version: sql`${schema.bookings.version} + 1`,
      updatedAt: new Date(),
    })
    .where(and(eq(schema.bookings.id, id), eq(schema.bookings.version, booking.version)))
    .returning();

  if (!updated) throw Errors.conflict('Booking was modified concurrently. Retry.');

  void emitWebhookEvent(updated.providerId, 'booking.completed', updated);
  return updated;
}

export async function noShowBooking(id: string) {
  const db = getDb();
  const booking = await getBooking(id);

  assertTransition(booking.status, 'no_show');

  const [updated] = await db
    .update(schema.bookings)
    .set({
      status: 'no_show',
      version: sql`${schema.bookings.version} + 1`,
      updatedAt: new Date(),
    })
    .where(and(eq(schema.bookings.id, id), eq(schema.bookings.version, booking.version)))
    .returning();

  if (!updated) throw Errors.conflict('Booking was modified concurrently. Retry.');

  void emitWebhookEvent(updated.providerId, 'booking.no_show', updated);
  return updated;
}
