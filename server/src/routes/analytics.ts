import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { getProviderAnalytics } from '../modules/analytics/service.js';
import { requireAuth, requireProviderAuth } from '../middleware/auth.js';
import { Errors } from '../lib/errors.js';

export const analyticsRoutes: FastifyPluginAsync = async (app) => {
  /**
   * GET /obp/v1/analytics/providers/:id
   * Provider analytics summary (last 30 days by default).
   */
  app.get<{ Params: { id: string } }>(
    '/analytics/providers/:id',
    { preHandler: [requireAuth(['provider:read', 'admin'])] },
    async (req, reply) => {
      const query = z.object({
        from: z.string().datetime().optional(),
        to: z.string().datetime().optional(),
      }).safeParse(req.query);

      if (!query.success) throw Errors.validationError('Invalid query', query.error.flatten());

      const summary = await getProviderAnalytics(
        req.params.id,
        query.data.from ? new Date(query.data.from) : undefined,
        query.data.to ? new Date(query.data.to) : undefined,
      );

      return reply.send(summary);
    },
  );
};
