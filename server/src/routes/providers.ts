import type { FastifyPluginAsync } from 'fastify';
import {
  listProviders,
  getProvider,
  createProvider,
  updateProvider,
  listCategories,
} from '../modules/providers/service.js';
import {
  createProviderSchema,
  updateProviderSchema,
  listProvidersQuerySchema,
} from '../modules/providers/schema.js';
import { requireAuth } from '../middleware/auth.js';
import { Errors } from '../lib/errors.js';

export const providerRoutes: FastifyPluginAsync = async (app) => {
  // GET /providers
  app.get('/providers', async (req, reply) => {
    const query = listProvidersQuerySchema.safeParse(req.query);
    if (!query.success) throw Errors.validationError('Invalid query', query.error.flatten());
    const result = await listProviders(query.data);
    return reply.send(result);
  });

  // GET /providers/:id
  app.get<{ Params: { id: string } }>('/providers/:id', async (req, reply) => {
    const provider = await getProvider(req.params.id);
    return reply.send(provider);
  });

  // POST /providers
  app.post('/providers', {
    preHandler: requireAuth(['admin', 'write']),
  }, async (req, reply) => {
    const body = createProviderSchema.safeParse(req.body);
    if (!body.success) throw Errors.validationError('Invalid request body', body.error.flatten());
    const provider = await createProvider(body.data);
    return reply.status(201).send(provider);
  });

  // PUT /providers/:id
  app.put<{ Params: { id: string } }>('/providers/:id', {
    preHandler: requireAuth(['admin', 'write', 'provider']),
  }, async (req, reply) => {
    const body = updateProviderSchema.safeParse(req.body);
    if (!body.success) throw Errors.validationError('Invalid request body', body.error.flatten());
    const provider = await updateProvider(req.params.id, body.data);
    return reply.send(provider);
  });

  // GET /categories
  app.get('/categories', async (_req, reply) => {
    const categories = await listCategories();
    return reply.send({ categories });
  });
};
