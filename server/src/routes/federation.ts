import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import {
  listPeers,
  getPeer,
  registerPeer,
  approvePeer,
  federatedSearch,
  syncCatalog,
  getPublicKeyDocument,
} from '../modules/federation/service.js';
import {
  receiveInboxActivity,
  listInbox,
  listOutbox,
} from '../modules/federation/inbox-outbox.js';
import { requireAuth } from '../middleware/auth.js';
import { Errors } from '../lib/errors.js';
import { listSlots } from '../modules/slots/service.js';
import { createBooking } from '../modules/bookings/service.js';
import { cancelBooking } from '../modules/bookings/service.js';
import { config } from '../config.js';

export const federationRoutes: FastifyPluginAsync = async (app) => {
  // ── Discovery ────────────────────────────────────────────────────────────────

  app.get('/keys/main', async (_req, reply) => {
    return reply.send(getPublicKeyDocument());
  });

  // ── Peer management ───────────────────────────────────────────────────────────

  app.get('/peers', { preHandler: requireAuth(['admin']) }, async (_req, reply) => {
    return reply.send(await listPeers());
  });

  app.post('/peers', async (req, reply) => {
    const body = z.object({
      serverUrl: z.string().url(),
      serverName: z.string().optional(),
      publicKey: z.string(),
      publicKeyId: z.string(),
    }).safeParse(req.body);

    if (!body.success) throw Errors.validationError('Invalid body', body.error.flatten());

    const peer = await registerPeer(body.data);
    return reply.status(201).send(peer);
  });

  app.post<{ Params: { id: string } }>('/peers/:id/approve', {
    preHandler: requireAuth(['admin']),
  }, async (req, reply) => {
    return reply.send(await approvePeer(req.params.id));
  });

  // ── Federated search ───────────────────────────────────────────────────────────

  app.get('/search', async (req, reply) => {
    const query = z.object({
      q: z.string().min(1),
      category: z.string().optional(),
      from: z.string().datetime().optional(),
      to: z.string().datetime().optional(),
    }).safeParse(req.query);

    if (!query.success) throw Errors.validationError('Invalid query', query.error.flatten());

    const results = await federatedSearch(query.data);
    return reply.send({ results, server: config.SERVER_URL });
  });

  // ── Federated slots ────────────────────────────────────────────────────────────

  app.get('/slots', async (req, reply) => {
    const query = z.object({
      serviceId: z.string().optional(),
      from: z.string().datetime(),
      to: z.string().datetime(),
    }).safeParse(req.query);

    if (!query.success) throw Errors.validationError('Invalid query', query.error.flatten());

    const result = await listSlots({
      serviceId: query.data.serviceId,
      from: query.data.from,
      to: query.data.to,
      status: 'available',
      limit: 100,
    });

    return reply.send(result);
  });

  // ── Federated booking ──────────────────────────────────────────────────────────

  app.post('/book', async (req, reply) => {
    const body = z.object({
      serviceId: z.string(),
      slotId: z.string(),
      customerName: z.string(),
      customerEmail: z.string().email(),
      customerPhone: z.string().optional(),
      notes: z.string().optional(),
      originServer: z.string().url(),
    }).safeParse(req.body);

    if (!body.success) throw Errors.validationError('Invalid body', body.error.flatten());

    const booking = await createBooking({
      serviceId: body.data.serviceId,
      slotId: body.data.slotId,
      customerName: body.data.customerName,
      customerEmail: body.data.customerEmail,
      customerPhone: body.data.customerPhone,
      notes: body.data.notes,
    });

    return reply.status(201).send(booking);
  });

  app.post('/cancel', async (req, reply) => {
    const body = z.object({
      bookingId: z.string(),
      reason: z.string().optional(),
      originServer: z.string().url(),
    }).safeParse(req.body);

    if (!body.success) throw Errors.validationError('Invalid body', body.error.flatten());

    const booking = await cancelBooking(body.data.bookingId, { reason: body.data.reason });
    return reply.send(booking);
  });

  // ── Catalog sync ───────────────────────────────────────────────────────────────

  app.get('/sync', async (req, reply) => {
    // Returns what changed since given timestamp
    const query = z.object({
      since: z.string().datetime().optional(),
    }).safeParse(req.query);

    if (!query.success) throw Errors.validationError('Invalid query', query.error.flatten());

    // Return current catalog snapshot (simplified diff)
    const { getDb, schema } = await import('../db/index.js');
    const { gte } = await import('drizzle-orm');
    const db = getDb();

    const sinceDate = query.data.since ? new Date(query.data.since) : undefined;

    const [providers, services] = await Promise.all([
      sinceDate
        ? db.select().from(schema.providers).where(gte(schema.providers.updatedAt, sinceDate))
        : db.select().from(schema.providers),
      sinceDate
        ? db.select().from(schema.services).where(gte(schema.services.updatedAt, sinceDate))
        : db.select().from(schema.services),
    ]);

    return reply.send({
      since: query.data.since,
      asOf: new Date().toISOString(),
      providers,
      services,
    });
  });

  // ── Inbox / Outbox ─────────────────────────────────────────────────────────────

  /**
   * POST /federation/inbox
   * Receive an incoming JSON-LD activity from another OBP server.
   * The sender must include a valid HTTP Signature.
   */
  app.post('/inbox', async (req, reply) => {
    const body = z.object({
      '@context': z.union([z.string(), z.array(z.string())]),
      type: z.enum(['Book', 'Cancel', 'Update', 'Announce', 'Follow', 'Accept', 'Reject']),
      id: z.string(),
      actor: z.string().url(),
      object: z.record(z.unknown()),
      published: z.string().optional(),
    }).safeParse(req.body);

    if (!body.success) throw Errors.validationError('Invalid activity', body.error.flatten());

    // Optionally look up peer by actor URL
    let peerId: string | undefined;
    try {
      const { getDb, schema: s } = await import('../db/index.js');
      const { eq: eqOp } = await import('drizzle-orm');
      const db = getDb();
      const actorOrigin = new URL(body.data.actor).origin;
      const [peer] = await db
        .select({ id: s.federationPeers.id })
        .from(s.federationPeers)
        .where(eqOp(s.federationPeers.serverUrl, actorOrigin))
        .limit(1);
      peerId = peer?.id;
    } catch {
      // Unknown peer — still accept (trust is checked separately)
    }

    const activity = await receiveInboxActivity(body.data as Parameters<typeof receiveInboxActivity>[0], peerId);
    return reply.status(202).send({ id: activity.id, status: 'accepted' });
  });

  /**
   * GET /federation/inbox
   * List received activities (admin only).
   */
  app.get('/inbox', { preHandler: requireAuth(['admin']) }, async (req, reply) => {
    const query = z.object({
      limit: z.coerce.number().int().min(1).max(200).default(50),
    }).safeParse(req.query);

    if (!query.success) throw Errors.validationError('Invalid query', query.error.flatten());

    const items = await listInbox(query.data.limit);
    return reply.send({ items });
  });

  /**
   * GET /federation/outbox
   * List sent activities (admin only).
   */
  app.get('/outbox', { preHandler: requireAuth(['admin']) }, async (req, reply) => {
    const query = z.object({
      limit: z.coerce.number().int().min(1).max(200).default(50),
    }).safeParse(req.query);

    if (!query.success) throw Errors.validationError('Invalid query', query.error.flatten());

    const items = await listOutbox(query.data.limit);
    return reply.send({ items });
  });
};
