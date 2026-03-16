import type { FastifyPluginAsync } from 'fastify';
import { listSlots, getSlot, holdSlot, createSlot } from '../modules/slots/service.js';
import { listSlotsQuerySchema, holdSlotBodySchema, generateSlotsBodySchema } from '../modules/slots/schema.js';
import { AppError, Errors } from '../lib/errors.js';
import { nanoid } from 'nanoid';
import { requireAuth } from '../middleware/auth.js';
import { listSchedules, generateTimeWindows } from '../modules/schedules/service.js';
import { getService } from '../modules/services/service.js';
import { schema } from '../db/index.js';

export const slotRoutes: FastifyPluginAsync = async (app) => {
  app.get('/slots', async (req, reply) => {
    const query = listSlotsQuerySchema.safeParse(req.query);
    if (!query.success) throw Errors.validationError('Invalid query', query.error.flatten());
    return reply.send(await listSlots(query.data));
  });

  app.post('/slots/generate', {
    preHandler: requireAuth(['write', 'provider', 'admin']),
  }, async (req, reply) => {
    const body = generateSlotsBodySchema.safeParse(req.body);
    if (!body.success) throw Errors.validationError('Invalid body', body.error.flatten());

    const { providerId, serviceId, from, to } = body.data;

    // Fetch service for duration/buffer info
    const service = await getService(serviceId);

    // Fetch schedules for this provider/service and pick the first matching one
    const schedules = await listSchedules(providerId);
    const schedule = schedules.find((s) => s.serviceId === serviceId) ?? schedules[0];

    if (!schedule) {
      throw Errors.notFound('Schedule', `provider=${providerId}`);
    }

    const windows = generateTimeWindows(
      schedule,
      new Date(from),
      new Date(to),
      service.durationMinutes,
      service.bufferAfterMinutes ?? 0,
    );

    const created: Array<typeof schema.slots.$inferSelect> = [];

    for (const window of windows) {
      try {
        const slot = await createSlot({
          providerId,
          serviceId,
          scheduleId: schedule.id,
          startTime: window.start,
          endTime: window.end,
          capacity: service.maxCapacity ?? 1,
        });
        created.push(slot);
      } catch (err: unknown) {
        // Skip conflicting slots and continue generating the rest
        if (err instanceof AppError && err.status === 409) {
          continue;
        }
        throw err;
      }
    }

    return reply.status(201).send({ generated: created.length, slots: created });
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
