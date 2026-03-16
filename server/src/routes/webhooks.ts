import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import {
  listWebhooks,
  getWebhook,
  createWebhook,
  updateWebhook,
  deleteWebhook,
  rotateWebhookSecret,
  listDeliveries,
} from '../modules/webhooks/service.js';
import { requireProviderAuth } from '../middleware/auth.js';
import { Errors } from '../lib/errors.js';

const createWebhookSchema = z.object({
  url: z.string().url(),
  events: z.array(z.string()).min(1),
  description: z.string().optional(),
});

const updateWebhookSchema = z.object({
  url: z.string().url().optional(),
  events: z.array(z.string()).optional(),
  status: z.enum(['active', 'inactive']).optional(),
  description: z.string().optional(),
});

export const webhookRoutes: FastifyPluginAsync = async (app) => {
  app.get('/webhooks', { preHandler: requireProviderAuth() }, async (req, reply) => {
    return reply.send(await listWebhooks(req.auth!.providerId!));
  });

  app.get<{ Params: { id: string } }>('/webhooks/:id', { preHandler: requireProviderAuth() }, async (req, reply) => {
    return reply.send(await getWebhook(req.params.id));
  });

  app.post('/webhooks', { preHandler: requireProviderAuth() }, async (req, reply) => {
    const body = createWebhookSchema.safeParse(req.body);
    if (!body.success) throw Errors.validationError('Invalid body', body.error.flatten());

    const wh = await createWebhook({
      providerId: req.auth!.providerId!,
      url: body.data.url,
      events: body.data.events,
      description: body.data.description,
    });

    return reply.status(201).send(wh);
  });

  app.put<{ Params: { id: string } }>('/webhooks/:id', { preHandler: requireProviderAuth() }, async (req, reply) => {
    const body = updateWebhookSchema.safeParse(req.body);
    if (!body.success) throw Errors.validationError('Invalid body', body.error.flatten());
    return reply.send(await updateWebhook(req.params.id, body.data));
  });

  app.delete<{ Params: { id: string } }>('/webhooks/:id', { preHandler: requireProviderAuth() }, async (req, reply) => {
    await deleteWebhook(req.params.id);
    return reply.status(204).send();
  });

  app.post<{ Params: { id: string } }>('/webhooks/:id/rotate-secret', { preHandler: requireProviderAuth() }, async (req, reply) => {
    return reply.send(await rotateWebhookSecret(req.params.id));
  });

  app.get<{ Params: { id: string } }>('/webhooks/:id/deliveries', { preHandler: requireProviderAuth() }, async (req, reply) => {
    return reply.send(await listDeliveries(req.params.id));
  });
};
