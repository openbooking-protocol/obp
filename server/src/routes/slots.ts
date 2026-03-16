import type { FastifyPluginAsync } from 'fastify';
import { listSlots, getSlot, holdSlot } from '../modules/slots/service.js';
import { listSlotsQuerySchema, holdSlotBodySchema } from '../modules/slots/schema.js';
import { Errors } from '../lib/errors.js';
import { nanoid } from 'nanoid';

export const slotRoutes: FastifyPluginAsync = async (app) => {
  app.get('/slots', async (req, reply) => {
    const query = listSlotsQuerySchema.safeParse(req.query);
    if (!query.success) throw Errors.validationError('Invalid query', query.error.flatten());
    return reply.send(await listSlots(query.data));
  });

  app.get<{ Params: { id: string } }>('/slots/:id', async (req, reply) => {
    return reply.send(await getSlot(req.params.id));
  });

  app.post<{ Params: { id: string } }>('/slots/:id/hold', async (req, reply) => {
    const body = holdSlotBodySchema.safeParse(req.body);
    if (!body.success) throw Errors.validationError('Invalid body', body.error.flatten());

    const holdToken = body.data.holdToken ?? nanoid(32);
    const slot = await holdSlot(req.params.id, holdToken);

    return reply.send({ ...slot, holdToken });
  });
};
