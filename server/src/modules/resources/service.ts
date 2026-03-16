import { eq, and, inArray } from 'drizzle-orm';
import { getDb, schema } from '../../db/index.js';
import { generateId } from '../../lib/id.js';
import { Errors } from '../../lib/errors.js';
import type { CreateResourceInput, UpdateResourceInput } from './schema.js';

export async function listResources(providerId: string) {
  const db = getDb();
  return db
    .select()
    .from(schema.resources)
    .where(and(eq(schema.resources.providerId, providerId), eq(schema.resources.isActive, true)));
}

export async function getResource(id: string) {
  const db = getDb();
  const [resource] = await db
    .select()
    .from(schema.resources)
    .where(eq(schema.resources.id, id))
    .limit(1);

  if (!resource) throw Errors.notFound('Resource', id);
  return resource;
}

export async function createResource(input: CreateResourceInput) {
  const db = getDb();
  const id = generateId();
  const now = new Date();

  const [resource] = await db
    .insert(schema.resources)
    .values({
      id,
      providerId: input.providerId,
      name: input.name,
      description: input.description,
      type: input.type,
      capacity: input.capacity ?? 1,
      metadata: input.metadata,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  // Link to services
  if (input.serviceIds && input.serviceIds.length > 0) {
    await db.insert(schema.resourceServices).values(
      input.serviceIds.map((serviceId) => ({ resourceId: id, serviceId })),
    );
  }

  return resource!;
}

export async function updateResource(id: string, input: UpdateResourceInput) {
  const db = getDb();
  await getResource(id);

  const { serviceIds, ...rest } = input;

  const [updated] = await db
    .update(schema.resources)
    .set({ ...rest, updatedAt: new Date() })
    .where(eq(schema.resources.id, id))
    .returning();

  // Update service links if provided
  if (serviceIds !== undefined) {
    await db.delete(schema.resourceServices).where(eq(schema.resourceServices.resourceId, id));
    if (serviceIds.length > 0) {
      await db.insert(schema.resourceServices).values(
        serviceIds.map((serviceId) => ({ resourceId: id, serviceId })),
      );
    }
  }

  return updated!;
}
