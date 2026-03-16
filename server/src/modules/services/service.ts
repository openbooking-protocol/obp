import { eq, and, ilike, gt, sql } from 'drizzle-orm';
import { getDb, schema } from '../../db/index.js';
import { generateId } from '../../lib/id.js';
import { Errors } from '../../lib/errors.js';
import type { CreateServiceInput, UpdateServiceInput, ListServicesQuery } from './schema.js';

export async function listServices(query: ListServicesQuery) {
  const db = getDb();
  const { limit, cursor, providerId, category, status, search } = query;

  const conditions = [];
  if (providerId) conditions.push(eq(schema.services.providerId, providerId));
  if (category) conditions.push(eq(schema.services.category, category));
  if (status) conditions.push(eq(schema.services.status, status));
  if (search) conditions.push(ilike(schema.services.name, `%${search}%`));
  if (cursor) conditions.push(gt(schema.services.id, cursor));

  const rows = await db
    .select()
    .from(schema.services)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(schema.services.sortOrder, schema.services.id)
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;

  return {
    items,
    pagination: {
      limit,
      hasMore,
      nextCursor: hasMore ? items[items.length - 1]?.id : undefined,
    },
  };
}

export async function getService(id: string) {
  const db = getDb();
  const [service] = await db
    .select()
    .from(schema.services)
    .where(eq(schema.services.id, id))
    .limit(1);

  if (!service) throw Errors.notFound('Service', id);
  return service;
}

export async function createService(input: CreateServiceInput) {
  const db = getDb();
  const id = generateId();
  const now = new Date();

  const [service] = await db
    .insert(schema.services)
    .values({
      id,
      providerId: input.providerId,
      name: input.name,
      description: input.description,
      category: input.category,
      durationMinutes: input.durationMinutes,
      bufferBeforeMinutes: input.bufferBeforeMinutes ?? 0,
      bufferAfterMinutes: input.bufferAfterMinutes ?? 0,
      price: input.price,
      currency: input.currency,
      maxCapacity: input.maxCapacity ?? 1,
      requiresConfirmation: input.requiresConfirmation ?? false,
      imageUrl: input.imageUrl,
      tags: input.tags ?? [],
      metadata: input.metadata,
      sortOrder: input.sortOrder ?? 0,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return service!;
}

export async function updateService(id: string, input: UpdateServiceInput) {
  const db = getDb();
  await getService(id);

  const [updated] = await db
    .update(schema.services)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(schema.services.id, id))
    .returning();

  return updated!;
}

export async function deleteService(id: string) {
  const db = getDb();
  await getService(id);

  await db
    .update(schema.services)
    .set({ status: 'inactive', isActive: false, updatedAt: new Date() })
    .where(eq(schema.services.id, id));
}
