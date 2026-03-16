import { eq, and, ilike, inArray, gt, desc, sql } from 'drizzle-orm';
import { getDb, schema } from '../../db/index.js';
import { generateId } from '../../lib/id.js';
import { Errors } from '../../lib/errors.js';
import type { CreateProviderInput, UpdateProviderInput, ListProvidersQuery } from './schema.js';

export async function listProviders(query: ListProvidersQuery) {
  const db = getDb();
  const { limit, cursor, category, status, search } = query;

  const conditions = [];

  if (status) {
    conditions.push(eq(schema.providers.status, status));
  }
  if (search) {
    conditions.push(ilike(schema.providers.name, `%${search}%`));
  }
  if (cursor) {
    conditions.push(gt(schema.providers.id, cursor));
  }

  const rows = await db
    .select()
    .from(schema.providers)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(schema.providers.id)
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? items[items.length - 1]?.id : undefined;

  // Filter by category in JS (JSONB array contains)
  const filtered = category
    ? items.filter((p) => (p.categories as string[]).includes(category))
    : items;

  return {
    items: filtered,
    pagination: {
      limit,
      hasMore,
      nextCursor,
    },
  };
}

export async function getProvider(id: string) {
  const db = getDb();
  const [provider] = await db
    .select()
    .from(schema.providers)
    .where(eq(schema.providers.id, id))
    .limit(1);

  if (!provider) throw Errors.notFound('Provider', id);
  return provider;
}

export async function getProviderBySlug(slug: string) {
  const db = getDb();
  const [provider] = await db
    .select()
    .from(schema.providers)
    .where(eq(schema.providers.slug, slug))
    .limit(1);

  if (!provider) throw Errors.notFound('Provider', slug);
  return provider;
}

export async function createProvider(input: CreateProviderInput) {
  const db = getDb();

  // Check slug uniqueness
  const [existing] = await db
    .select({ id: schema.providers.id })
    .from(schema.providers)
    .where(eq(schema.providers.slug, input.slug))
    .limit(1);

  if (existing) {
    throw Errors.conflict(`Provider with slug '${input.slug}' already exists`);
  }

  const id = generateId();
  const now = new Date();

  const [provider] = await db
    .insert(schema.providers)
    .values({
      id,
      name: input.name,
      slug: input.slug,
      description: input.description,
      email: input.email,
      phone: input.phone,
      website: input.website,
      logoUrl: input.logoUrl,
      timezone: input.timezone ?? 'UTC',
      locale: input.locale ?? 'en',
      currency: input.currency ?? 'EUR',
      address: input.address,
      categories: input.categories ?? [],
      metadata: input.metadata,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return provider!;
}

export async function updateProvider(id: string, input: UpdateProviderInput) {
  const db = getDb();

  // Check exists
  await getProvider(id);

  // Check slug uniqueness if changing
  if (input.slug) {
    const [existing] = await db
      .select({ id: schema.providers.id })
      .from(schema.providers)
      .where(and(eq(schema.providers.slug, input.slug), sql`id != ${id}`))
      .limit(1);

    if (existing) {
      throw Errors.conflict(`Provider with slug '${input.slug}' already exists`);
    }
  }

  const [updated] = await db
    .update(schema.providers)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(schema.providers.id, id))
    .returning();

  return updated!;
}

export async function listCategories() {
  const db = getDb();
  // Get all unique categories from providers
  const rows = await db
    .select({ categories: schema.providers.categories })
    .from(schema.providers)
    .where(eq(schema.providers.status, 'active'));

  const categorySet = new Set<string>();
  for (const row of rows) {
    for (const cat of row.categories as string[]) {
      categorySet.add(cat);
    }
  }

  return Array.from(categorySet).sort();
}
