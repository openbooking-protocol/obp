import type { FastifyPluginAsync } from 'fastify';
import { listResources, getResource, createResource, updateResource } from '../modules/resources/service.js';
import { createResourceSchema, updateResourceSchema } from '../modules/resources/schema.js';
import { requireAuth } from '../middleware/auth.js';
import { Errors } from '../lib/errors.js';

export const resourceRoutes: FastifyPluginAsync = async (app) => {
  app.get<{ Querystring: { providerId?: string } }>('/resources', async (req, reply) => {
    if (!req.query.providerId) throw Errors.badRequest('providerId is required');
    return reply.send(await listResources(req.query.providerId));
  });

  app.get<{ Params: { id: string } }>('/resources/:id', async (req, reply) => {
    return reply.send(await getResource(req.params.id));
  });

  app.post('/resources', { preHandler: requireAuth(['write', 'provider', 'admin']) }, async (req, reply) => {
    const body = createResourceSchema.safeParse(req.body);
    if (!body.success) throw Errors.validationError('Invalid body', body.error.flatten());
    return reply.status(201).send(await createResource(body.data));
  });

  app.put<{ Params: { id: string } }>('/resources/:id', { preHandler: requireAuth(['write', 'provider', 'admin']) }, async (req, reply) => {
    const body = updateResourceSchema.safeParse(req.body);
    if (!body.success) throw Errors.validationError('Invalid body', body.error.flatten());
    return reply.send(await updateResource(req.params.id, body.data));
  });
};
