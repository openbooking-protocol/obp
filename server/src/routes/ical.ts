import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { getDb, schema } from '../db/index.js';
import { eq, and, gte, lte } from 'drizzle-orm';
import { generateICalFeed, parseICalFeed, type ICalEvent } from '../lib/ical.js';
import { createSlot } from '../modules/slots/service.js';
import { Errors } from '../lib/errors.js';
import { config } from '../config.js';

export const icalRoutes: FastifyPluginAsync = async (app) => {
  // ── Provider calendar feed ─────────────────────────────────────────────────

  /**
   * GET /obp/v1/providers/:id/calendar.ics
   * Export all confirmed/completed bookings for a provider as iCal.
   */
  app.get<{ Params: { id: string }; Querystring: { from?: string; to?: string } }>(
    '/providers/:id/calendar.ics',
    async (req, reply) => {
      const db = getDb();

      const queryParams = z.object({
        from: z.string().datetime().optional(),
        to: z.string().datetime().optional(),
      }).safeParse(req.query);

      if (!queryParams.success) {
        throw Errors.validationError('Invalid query', queryParams.error.flatten());
      }

      const conditions = [eq(schema.bookings.providerId, req.params.id)];

      if (queryParams.data.from) {
        conditions.push(gte(schema.bookings.createdAt, new Date(queryParams.data.from)));
      }
      if (queryParams.data.to) {
        conditions.push(lte(schema.bookings.createdAt, new Date(queryParams.data.to)));
      }

      const bookings = await db
        .select({
          id: schema.bookings.id,
          customerName: schema.bookings.customerName,
          customerEmail: schema.bookings.customerEmail,
          notes: schema.bookings.notes,
          status: schema.bookings.status,
          createdAt: schema.bookings.createdAt,
          slotId: schema.bookings.slotId,
          serviceId: schema.bookings.serviceId,
          serviceName: schema.services.name,
          slotStart: schema.slots.startTime,
          slotEnd: schema.slots.endTime,
          providerName: schema.providers.name,
        })
        .from(schema.bookings)
        .leftJoin(schema.slots, eq(schema.bookings.slotId, schema.slots.id))
        .leftJoin(schema.services, eq(schema.bookings.serviceId, schema.services.id))
        .leftJoin(schema.providers, eq(schema.bookings.providerId, schema.providers.id))
        .where(and(...conditions));

      const events: ICalEvent[] = bookings
        .filter((b) => b.slotStart && b.slotEnd)
        .map((b) => ({
          uid: `booking-${b.id}@${new URL(config.SERVER_URL).hostname}`,
          summary: `${b.serviceName ?? 'Booking'} — ${b.customerName}`,
          description: [
            `Service: ${b.serviceName ?? b.serviceId}`,
            `Customer: ${b.customerName} <${b.customerEmail}>`,
            b.notes ? `Notes: ${b.notes}` : null,
            `Status: ${b.status}`,
            `Booking ID: ${b.id}`,
          ].filter(Boolean).join('\n'),
          dtstart: b.slotStart!,
          dtend: b.slotEnd!,
          dtstamp: b.createdAt,
          status: b.status === 'cancelled' ? 'CANCELLED' : 'CONFIRMED',
          url: `${config.SERVER_URL}/obp/v1/bookings/${b.id}`,
          organizer: { name: b.providerName ?? 'Provider', email: 'noreply@example.com' },
          attendee: { name: b.customerName, email: b.customerEmail },
        }));

      const icalData = generateICalFeed(events, `${bookings[0]?.providerName ?? 'Provider'} Calendar`);

      return reply
        .header('Content-Type', 'text/calendar; charset=utf-8')
        .header('Content-Disposition', `attachment; filename="provider-${req.params.id}.ics"`)
        .send(icalData);
    },
  );

  // ── Single booking iCal ────────────────────────────────────────────────────

  /**
   * GET /obp/v1/bookings/:id/calendar.ics
   * Export a single booking as iCal event.
   */
  app.get<{ Params: { id: string } }>(
    '/bookings/:id/calendar.ics',
    async (req, reply) => {
      const db = getDb();

      const [booking] = await db
        .select({
          id: schema.bookings.id,
          customerName: schema.bookings.customerName,
          customerEmail: schema.bookings.customerEmail,
          notes: schema.bookings.notes,
          status: schema.bookings.status,
          createdAt: schema.bookings.createdAt,
          serviceName: schema.services.name,
          slotStart: schema.slots.startTime,
          slotEnd: schema.slots.endTime,
          providerName: schema.providers.name,
        })
        .from(schema.bookings)
        .leftJoin(schema.slots, eq(schema.bookings.slotId, schema.slots.id))
        .leftJoin(schema.services, eq(schema.bookings.serviceId, schema.services.id))
        .leftJoin(schema.providers, eq(schema.bookings.providerId, schema.providers.id))
        .where(eq(schema.bookings.id, req.params.id))
        .limit(1);

      if (!booking) throw Errors.notFound('Booking', req.params.id);
      if (!booking.slotStart || !booking.slotEnd) {
        throw Errors.badRequest('Booking has no associated time slot');
      }

      const event: ICalEvent = {
        uid: `booking-${booking.id}@${new URL(config.SERVER_URL).hostname}`,
        summary: `${booking.serviceName ?? 'Booking'} — ${booking.customerName}`,
        description: [
          `Service: ${booking.serviceName ?? 'Unknown'}`,
          `Customer: ${booking.customerName} <${booking.customerEmail}>`,
          booking.notes ? `Notes: ${booking.notes}` : null,
          `Status: ${booking.status}`,
        ].filter(Boolean).join('\n'),
        dtstart: booking.slotStart,
        dtend: booking.slotEnd,
        dtstamp: booking.createdAt,
        status: booking.status === 'cancelled' ? 'CANCELLED' : 'CONFIRMED',
        url: `${config.SERVER_URL}/obp/v1/bookings/${booking.id}`,
        organizer: { name: booking.providerName ?? 'Provider', email: 'noreply@example.com' },
        attendee: { name: booking.customerName, email: booking.customerEmail },
      };

      const icalData = generateICalFeed([event], `Booking Confirmation`);

      return reply
        .header('Content-Type', 'text/calendar; charset=utf-8')
        .header('Content-Disposition', `attachment; filename="booking-${booking.id}.ics"`)
        .send(icalData);
    },
  );

  // ── iCal import ────────────────────────────────────────────────────────────

  /**
   * POST /obp/v1/providers/:id/calendar/import
   * Import an .ics file to create slots for a provider.
   * Body: text/calendar (raw .ics content)
   */
  app.post<{ Params: { id: string } }>(
    '/providers/:id/calendar/import',
    async (req, reply) => {
      const providerId = req.params.id;
      const db = getDb();

      // Verify provider exists
      const [provider] = await db
        .select({ id: schema.providers.id })
        .from(schema.providers)
        .where(eq(schema.providers.id, providerId))
        .limit(1);

      if (!provider) throw Errors.notFound('Provider', providerId);

      // Parse iCal body (accept text/calendar)
      let rawIcal: string;
      if (typeof req.body === 'string') {
        rawIcal = req.body;
      } else {
        throw Errors.badRequest('Body must be text/calendar content');
      }

      const parsedEvents = parseICalFeed(rawIcal);

      if (parsedEvents.length === 0) {
        return reply.status(200).send({ imported: 0, skipped: 0, errors: [] });
      }

      // Find a default service for the provider
      const [defaultService] = await db
        .select({ id: schema.services.id })
        .from(schema.services)
        .where(eq(schema.services.providerId, providerId))
        .limit(1);

      if (!defaultService) {
        throw Errors.badRequest('Provider has no services — create a service before importing');
      }

      let imported = 0;
      let skipped = 0;
      const errors: string[] = [];

      for (const event of parsedEvents) {
        if (!event.dtstart || !event.dtend) {
          skipped++;
          continue;
        }

        try {
          await createSlot({
            providerId,
            serviceId: defaultService.id,
            startTime: event.dtstart,
            endTime: event.dtend,
          });
          imported++;
        } catch (err) {
          skipped++;
          errors.push(
            `${event.uid ?? 'unknown'}: ${err instanceof Error ? err.message : 'Failed'}`,
          );
        }
      }

      return reply.status(200).send({ imported, skipped, errors });
    },
  );
};
