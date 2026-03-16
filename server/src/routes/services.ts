import type { FastifyPluginAsync } from 'fastify';
import {
  listServices,
  getService,
  createService,
  updateService,
  deleteService,
} from '../modules/services/service.js';
import {
  createServiceSchema,
  updateServiceSchema,
  listServicesQuerySchema,
} from '../modules/services/schema.js';
import { requireAuth } from '../middleware/auth.js';
import { Errors } from '../lib/errors.js';

export const serviceRoutes: FastifyPluginAsync = async (app) => {
  app.get('/services', async (req, reply) => {
    const query = listServicesQuerySchema.safeParse(req.query);
    if (!query.success) throw Errors.validationError('Invalid query', query.error.flatten());
    return reply.send(await listServices(query.data));
  });

  app.get<{ Params: { id: string } }>('/services/:id', async (req, reply) => {
    return reply.send(await getService(req.params.id));
  });

  app.post('/services', { preHandler: requireAuth(['write', 'provider', 'admin']) }, async (req, reply) => {
    const body = createServiceSchema.safeParse(req.body);
    if (!body.success) throw Errors.validationError('Invalid body', body.error.flatten());
    return reply.status(201).send(await createService(body.data));
  });

  app.put<{ Params: { id: string } }>('/services/:id', { preHandler: requireAuth(['write', 'provider', 'admin']) }, async (req, reply) => {
    const body = updateServiceSchema.safeParse(req.body);
    if (!body.success) throw Errors.validationError('Invalid body', body.error.flatten());
    return reply.send(await updateService(req.params.id, body.data));
  });

  app.delete<{ Params: { id: string } }>('/services/:id', { preHandler: requireAuth(['write', 'provider', 'admin']) }, async (req, reply) => {
    await deleteService(req.params.id);
    return reply.status(204).send();
  });
};
