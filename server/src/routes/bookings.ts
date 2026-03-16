import type { FastifyPluginAsync } from 'fastify';
import {
  listBookings,
  getBooking,
  createBooking,
  confirmBooking,
  cancelBooking,
  completeBooking,
  noShowBooking,
} from '../modules/bookings/service.js';
import {
  createBookingSchema,
  cancelBookingSchema,
  listBookingsQuerySchema,
} from '../modules/bookings/schema.js';
import { requireAuth } from '../middleware/auth.js';
import { Errors } from '../lib/errors.js';

export const bookingRoutes: FastifyPluginAsync = async (app) => {
  app.get('/bookings', { preHandler: requireAuth(['read', 'provider', 'admin']) }, async (req, reply) => {
    const query = listBookingsQuerySchema.safeParse(req.query);
    if (!query.success) throw Errors.validationError('Invalid query', query.error.flatten());
    return reply.send(await listBookings(query.data));
  });

  app.get<{ Params: { id: string } }>('/bookings/:id', async (req, reply) => {
    return reply.send(await getBooking(req.params.id));
  });

  app.post('/bookings', async (req, reply) => {
    const body = createBookingSchema.safeParse(req.body);
    if (!body.success) throw Errors.validationError('Invalid body', body.error.flatten());
    return reply.status(201).send(await createBooking(body.data));
  });

  app.post<{ Params: { id: string } }>('/bookings/:id/confirm', {
    preHandler: requireAuth(['write', 'provider', 'admin']),
  }, async (req, reply) => {
    return reply.send(await confirmBooking(req.params.id));
  });

  app.post<{ Params: { id: string } }>('/bookings/:id/cancel', async (req, reply) => {
    const body = cancelBookingSchema.safeParse(req.body ?? {});
    if (!body.success) throw Errors.validationError('Invalid body', body.error.flatten());
    return reply.send(await cancelBooking(req.params.id, body.data));
  });

  app.post<{ Params: { id: string } }>('/bookings/:id/complete', {
    preHandler: requireAuth(['write', 'provider', 'admin']),
  }, async (req, reply) => {
    return reply.send(await completeBooking(req.params.id));
  });

  app.post<{ Params: { id: string } }>('/bookings/:id/no-show', {
    preHandler: requireAuth(['write', 'provider', 'admin']),
  }, async (req, reply) => {
    return reply.send(await noShowBooking(req.params.id));
  });
};
