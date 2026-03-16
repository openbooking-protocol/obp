import { eq, desc } from 'drizzle-orm';
import { getDb, schema } from '../../db/index.js';
import { generateId } from '../../lib/id.js';
import { logger } from '../../logger.js';
import { createBooking } from '../bookings/service.js';
import { cancelBooking } from '../bookings/service.js';

export type ActivityType = 'Book' | 'Cancel' | 'Update' | 'Announce' | 'Follow' | 'Accept' | 'Reject';

export interface JsonLdActivity {
  '@context': string | string[];
  type: ActivityType;
  id: string;
  actor: string;
  object: Record<string, unknown>;
  published?: string;
}

// ── Outbox: record outgoing activities ────────────────────────────────────────

export async function recordOutboxActivity(input: {
  activityType: ActivityType;
  peerId?: string;
  objectId?: string;
  payload: JsonLdActivity;
}): Promise<typeof schema.federationActivities.$inferSelect> {
  const db = getDb();
  const id = generateId();

  const [activity] = await db
    .insert(schema.federationActivities)
    .values({
      id,
      direction: 'outbox',
      activityType: input.activityType,
      peerId: input.peerId ?? null,
      actorUrl: input.payload.actor,
      objectId: input.objectId ?? null,
      payload: input.payload as unknown as Record<string, unknown>,
      status: 'processed',
      processedAt: new Date(),
      createdAt: new Date(),
    })
    .returning();

  return activity!;
}

// ── Inbox: receive and process incoming activities ────────────────────────────

export async function receiveInboxActivity(
  activity: JsonLdActivity,
  peerId?: string,
): Promise<typeof schema.federationActivities.$inferSelect> {
  const db = getDb();
  const id = generateId();

  // Record activity first
  const [record] = await db
    .insert(schema.federationActivities)
    .values({
      id,
      direction: 'inbox',
      activityType: activity.type,
      peerId: peerId ?? null,
      actorUrl: activity.actor,
      objectId: typeof activity.object === 'string' ? activity.object : (activity.object['id'] as string | undefined) ?? null,
      payload: activity as unknown as Record<string, unknown>,
      status: 'pending',
      createdAt: new Date(),
    })
    .returning();

  // Process asynchronously
  void processActivity(record!);

  return record!;
}

async function processActivity(
  record: typeof schema.federationActivities.$inferSelect,
): Promise<void> {
  const db = getDb();

  try {
    const activity = record.payload as unknown as JsonLdActivity;

    switch (record.activityType) {
      case 'Book': {
        const obj = activity.object as Record<string, unknown>;
        await createBooking({
          serviceId: obj['serviceId'] as string,
          slotId: obj['slotId'] as string,
          customerName: obj['customerName'] as string,
          customerEmail: obj['customerEmail'] as string,
          customerPhone: obj['customerPhone'] as string | undefined,
          notes: obj['notes'] as string | undefined,
        });
        break;
      }

      case 'Cancel': {
        const obj = activity.object as Record<string, unknown>;
        const bookingId = (obj['id'] as string | undefined) ?? record.objectId;
        if (bookingId) {
          await cancelBooking(bookingId, { reason: obj['reason'] as string | undefined });
        }
        break;
      }

      default:
        logger.debug({ activityType: record.activityType }, 'Unhandled activity type, recording only');
    }

    await db
      .update(schema.federationActivities)
      .set({ status: 'processed', processedAt: new Date() })
      .where(eq(schema.federationActivities.id, record.id));
  } catch (err) {
    logger.error({ err, activityId: record.id }, 'Failed to process inbox activity');
    await db
      .update(schema.federationActivities)
      .set({
        status: 'failed',
        error: err instanceof Error ? err.message : 'Unknown error',
        processedAt: new Date(),
      })
      .where(eq(schema.federationActivities.id, record.id));
  }
}

// ── Query helpers ─────────────────────────────────────────────────────────────

export async function listOutbox(limit = 50) {
  const db = getDb();
  return db
    .select()
    .from(schema.federationActivities)
    .where(eq(schema.federationActivities.direction, 'outbox'))
    .orderBy(desc(schema.federationActivities.createdAt))
    .limit(limit);
}

export async function listInbox(limit = 50) {
  const db = getDb();
  return db
    .select()
    .from(schema.federationActivities)
    .where(eq(schema.federationActivities.direction, 'inbox'))
    .orderBy(desc(schema.federationActivities.createdAt))
    .limit(limit);
}
