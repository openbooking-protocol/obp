import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { getDb, schema } from '../db/index.js';
import { getServerStats } from '../modules/analytics/service.js';
import { requireAuth } from '../middleware/auth.js';
import { Errors } from '../lib/errors.js';

export const adminRoutes: FastifyPluginAsync = async (app) => {
  // All admin routes require admin scope
  app.addHook('preHandler', requireAuth(['admin']));

  // ── Server stats ───────────────────────────────────────────────────────────

  /**
   * GET /obp/v1/admin/stats
   * Server-wide statistics.
   */
  app.get('/stats', async (_req, reply) => {
    const stats = await getServerStats();
    return reply.send(stats);
  });

  // ── Provider moderation ────────────────────────────────────────────────────

  /**
   * GET /obp/v1/admin/providers
   * List all providers (including inactive/suspended).
   */
  app.get('/providers', async (req, reply) => {
    const query = z.object({
      status: z.enum(['active', 'inactive', 'suspended', 'pending']).optional(),
      limit: z.coerce.number().int().min(1).max(200).default(50),
      cursor: z.string().optional(),
    }).safeParse(req.query);

    if (!query.success) throw Errors.validationError('Invalid query', query.error.flatten());

    const db = getDb();
    const { eq: eqOp, gt, and } = await import('drizzle-orm');

    const conditions = [];
    if (query.data.status) conditions.push(eqOp(schema.providers.status, query.data.status));
    if (query.data.cursor) conditions.push(gt(schema.providers.id, query.data.cursor));

    const rows = await db
      .select()
      .from(schema.providers)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(query.data.limit + 1);

    const hasMore = rows.length > query.data.limit;
    const items = hasMore ? rows.slice(0, query.data.limit) : rows;

    return reply.send({
      items,
      pagination: {
        limit: query.data.limit,
        hasMore,
        nextCursor: hasMore ? items[items.length - 1]?.id : undefined,
      },
    });
  });

  /**
   * POST /obp/v1/admin/providers/:id/approve
   * Approve a pending provider.
   */
  app.post<{ Params: { id: string } }>('/providers/:id/approve', async (req, reply) => {
    const db = getDb();
    const [updated] = await db
      .update(schema.providers)
      .set({ status: 'active', updatedAt: new Date() })
      .where(eq(schema.providers.id, req.params.id))
      .returning();

    if (!updated) throw Errors.notFound('Provider', req.params.id);
    return reply.send(updated);
  });

  /**
   * POST /obp/v1/admin/providers/:id/suspend
   * Suspend an active provider.
   */
  app.post<{ Params: { id: string } }>(
    '/providers/:id/suspend',
    async (req, reply) => {
      const body = z.object({
        reason: z.string().min(1).optional(),
      }).safeParse(req.body);

      if (!body.success) throw Errors.validationError('Invalid body', body.error.flatten());

      const db = getDb();
      const [updated] = await db
        .update(schema.providers)
        .set({
          status: 'suspended',
          updatedAt: new Date(),
        })
        .where(eq(schema.providers.id, req.params.id))
        .returning();

      if (!updated) throw Errors.notFound('Provider', req.params.id);
      return reply.send(updated);
    },
  );

  /**
   * DELETE /obp/v1/admin/providers/:id
   * Hard delete a provider and all associated data.
   */
  app.delete<{ Params: { id: string } }>('/providers/:id', async (req, reply) => {
    const db = getDb();

    // Verify exists first
    const [provider] = await db
      .select({ id: schema.providers.id })
      .from(schema.providers)
      .where(eq(schema.providers.id, req.params.id))
      .limit(1);

    if (!provider) throw Errors.notFound('Provider', req.params.id);

    await db.delete(schema.providers).where(eq(schema.providers.id, req.params.id));
    return reply.status(204).send();
  });

  // ── Federation peer moderation ─────────────────────────────────────────────

  /**
   * GET /obp/v1/admin/federation/peers
   * List all federation peers with status.
   */
  app.get('/federation/peers', async (_req, reply) => {
    const db = getDb();
    const peers = await db.select().from(schema.federationPeers);
    return reply.send({ items: peers });
  });

  /**
   * DELETE /obp/v1/admin/federation/peers/:id
   * Remove a federation peer.
   */
  app.delete<{ Params: { id: string } }>('/federation/peers/:id', async (req, reply) => {
    const db = getDb();
    const [peer] = await db
      .select({ id: schema.federationPeers.id })
      .from(schema.federationPeers)
      .where(eq(schema.federationPeers.id, req.params.id))
      .limit(1);

    if (!peer) throw Errors.notFound('Federation peer', req.params.id);

    await db.delete(schema.federationPeers).where(eq(schema.federationPeers.id, req.params.id));
    return reply.status(204).send();
  });

  /**
   * POST /obp/v1/admin/federation/peers/:id/block
   * Block a federation peer.
   */
  app.post<{ Params: { id: string } }>('/federation/peers/:id/block', async (req, reply) => {
    const db = getDb();
    const [updated] = await db
      .update(schema.federationPeers)
      .set({ status: 'blocked', updatedAt: new Date() })
      .where(eq(schema.federationPeers.id, req.params.id))
      .returning();

    if (!updated) throw Errors.notFound('Federation peer', req.params.id);
    return reply.send(updated);
  });
};
