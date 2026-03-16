import type { FastifyPluginAsync } from 'fastify';
import { listSchedules, upsertSchedule } from '../modules/schedules/service.js';
import { createScheduleSchema } from '../modules/schedules/schema.js';
import { requireAuth } from '../middleware/auth.js';
import { Errors } from '../lib/errors.js';

export const scheduleRoutes: FastifyPluginAsync = async (app) => {
  app.get<{ Querystring: { providerId?: string } }>('/schedule', {
    preHandler: requireAuth(['read', 'provider', 'admin']),
  }, async (req, reply) => {
    if (!req.query.providerId) throw Errors.badRequest('providerId is required');
    return reply.send(await listSchedules(req.query.providerId));
  });

  app.put('/schedule', {
    preHandler: requireAuth(['write', 'provider', 'admin']),
  }, async (req, reply) => {
    const body = createScheduleSchema.safeParse(req.body);
    if (!body.success) throw Errors.validationError('Invalid body', body.error.flatten());
    const schedule = await upsertSchedule(body.data.providerId, body.data);
    return reply.send(schedule);
  });
};
