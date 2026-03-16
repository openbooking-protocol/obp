import { eq, and, desc } from 'drizzle-orm';
import { getDb, schema } from '../../db/index.js';
import { generateId, generateWebhookSecret } from '../../lib/id.js';
import { hashWebhookPayload } from '../../lib/hash.js';
import { Errors } from '../../lib/errors.js';
import { logger } from '../../logger.js';

const MAX_RETRIES = 3;
const RETRY_DELAYS_MS = [1000, 5000, 30000];

export async function listWebhooks(providerId: string) {
  const db = getDb();
  return db
    .select()
    .from(schema.webhooks)
    .where(eq(schema.webhooks.providerId, providerId));
}

export async function getWebhook(id: string) {
  const db = getDb();
  const [wh] = await db
    .select()
    .from(schema.webhooks)
    .where(eq(schema.webhooks.id, id))
    .limit(1);

  if (!wh) throw Errors.notFound('Webhook', id);
  return wh;
}

export async function createWebhook(input: {
  providerId: string;
  url: string;
  events: string[];
  description?: string;
}) {
  const db = getDb();
  const id = generateId();
  const secret = generateWebhookSecret();
  const now = new Date();

  const [wh] = await db
    .insert(schema.webhooks)
    .values({
      id,
      providerId: input.providerId,
      url: input.url,
      secret,
      events: input.events,
      description: input.description,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return { ...wh!, secret }; // Return secret only on creation
}

export async function updateWebhook(id: string, input: {
  url?: string;
  events?: string[];
  status?: 'active' | 'inactive';
  description?: string;
}) {
  const db = getDb();
  await getWebhook(id);

  const [updated] = await db
    .update(schema.webhooks)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(schema.webhooks.id, id))
    .returning();

  return updated!;
}

export async function deleteWebhook(id: string) {
  const db = getDb();
  await getWebhook(id);
  await db.delete(schema.webhooks).where(eq(schema.webhooks.id, id));
}

export async function rotateWebhookSecret(id: string) {
  const db = getDb();
  await getWebhook(id);
  const secret = generateWebhookSecret();

  await db
    .update(schema.webhooks)
    .set({ secret, updatedAt: new Date() })
    .where(eq(schema.webhooks.id, id));

  return { id, secret };
}

export async function listDeliveries(webhookId: string) {
  const db = getDb();
  return db
    .select()
    .from(schema.webhookDeliveries)
    .where(eq(schema.webhookDeliveries.webhookId, webhookId))
    .orderBy(desc(schema.webhookDeliveries.createdAt))
    .limit(100);
}

/**
 * Emit an event to all active webhooks for a provider
 * Fire-and-forget with retry logic
 */
export async function emitWebhookEvent(
  providerId: string,
  event: string,
  payload: unknown,
): Promise<void> {
  const db = getDb();

  const webhooks = await db
    .select()
    .from(schema.webhooks)
    .where(
      and(
        eq(schema.webhooks.providerId, providerId),
        eq(schema.webhooks.status, 'active'),
      ),
    );

  const matchingWebhooks = webhooks.filter((wh) => {
    const events = wh.events as string[];
    return events.includes(event) || events.includes('*');
  });

  for (const wh of matchingWebhooks) {
    void deliverWithRetry(wh, event, payload, 1);
  }
}

async function deliverWithRetry(
  wh: typeof schema.webhooks.$inferSelect,
  event: string,
  payload: unknown,
  attempt: number,
): Promise<void> {
  const db = getDb();
  const body = JSON.stringify({ event, payload, timestamp: new Date().toISOString() });
  const signature = hashWebhookPayload(body, wh.secret);
  const deliveryId = generateId();

  try {
    const response = await fetch(wh.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-OBP-Event': event,
        'X-OBP-Signature': `sha256=${signature}`,
        'X-OBP-Delivery-Id': deliveryId,
      },
      body,
      signal: AbortSignal.timeout(10000),
    });

    const success = response.ok;
    const responseBody = await response.text().catch(() => '');

    await db.insert(schema.webhookDeliveries).values({
      id: deliveryId,
      webhookId: wh.id,
      event,
      payload: payload as Record<string, unknown>,
      responseStatus: response.status,
      responseBody: responseBody.slice(0, 2000),
      attempt,
      success,
      createdAt: new Date(),
    });

    if (success) {
      await db
        .update(schema.webhooks)
        .set({ lastTriggeredAt: new Date(), failureCount: 0, updatedAt: new Date() })
        .where(eq(schema.webhooks.id, wh.id));
    } else {
      await handleDeliveryFailure(wh, event, payload, attempt, `HTTP ${response.status}`);
    }
  } catch (err) {
    await db.insert(schema.webhookDeliveries).values({
      id: deliveryId,
      webhookId: wh.id,
      event,
      payload: payload as Record<string, unknown>,
      attempt,
      success: false,
      error: String(err),
      createdAt: new Date(),
    });

    await handleDeliveryFailure(wh, event, payload, attempt, String(err));
  }
}

async function handleDeliveryFailure(
  wh: typeof schema.webhooks.$inferSelect,
  event: string,
  payload: unknown,
  attempt: number,
  error: string,
) {
  const db = getDb();

  logger.warn({ webhookId: wh.id, event, attempt, error }, 'Webhook delivery failed');

  await db
    .update(schema.webhooks)
    .set({ failureCount: (wh.failureCount ?? 0) + 1, updatedAt: new Date() })
    .where(eq(schema.webhooks.id, wh.id));

  if (attempt < MAX_RETRIES) {
    const delay = RETRY_DELAYS_MS[attempt - 1] ?? 30000;
    setTimeout(() => {
      void deliverWithRetry(wh, event, payload, attempt + 1);
    }, delay);
  } else {
    logger.error({ webhookId: wh.id, event }, 'Webhook max retries exceeded, disabling');
    if ((wh.failureCount ?? 0) >= 10) {
      await db
        .update(schema.webhooks)
        .set({ status: 'inactive', updatedAt: new Date() })
        .where(eq(schema.webhooks.id, wh.id));
    }
  }
}
