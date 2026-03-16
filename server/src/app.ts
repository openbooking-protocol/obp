import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { getRedis } from './redis.js';
import { logger } from './logger.js';
import { config } from './config.js';
import { AppError } from './lib/errors.js';
import type { ProblemDetail } from './lib/errors.js';

// Route imports
import { healthRoutes } from './routes/health.js';
import { providerRoutes } from './routes/providers.js';
import { serviceRoutes } from './routes/services.js';
import { resourceRoutes } from './routes/resources.js';
import { slotRoutes } from './routes/slots.js';
import { bookingRoutes } from './routes/bookings.js';
import { scheduleRoutes } from './routes/schedule.js';
import { webhookRoutes } from './routes/webhooks.js';
import { authRoutes } from './routes/auth.js';
import { federationRoutes } from './routes/federation.js';
import { wellKnownRoutes } from './routes/well-known.js';
import { icalRoutes } from './routes/ical.js';
import { analyticsRoutes } from './routes/analytics.js';
import { adminRoutes } from './routes/admin.js';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    loggerInstance: logger,
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'requestId',
    genReqId: () => crypto.randomUUID(),
    trustProxy: true,
  });

  // ── CORS ────────────────────────────────────────────────────────────────────
  await app.register(cors, {
    origin:
      config.NODE_ENV === 'production'
        ? [config.SERVER_URL]
        : true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Api-Key', 'X-Request-Id'],
    exposedHeaders: [
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset',
      'Retry-After',
      'X-Request-Id',
    ],
    credentials: true,
    maxAge: 86400,
  });

  // ── Rate limiting ────────────────────────────────────────────────────────────
  await app.register(rateLimit, {
    global: true,
    max: 100,
    timeWindow: '1 minute',
    redis: getRedis(),
    keyGenerator: (req) => {
      // Use API key or IP as rate limit key
      const apiKey = req.headers['x-api-key'];
      if (apiKey && typeof apiKey === 'string') {
        return `apikey:${apiKey.slice(0, 16)}`;
      }
      return req.ip;
    },
    addHeaders: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
      'retry-after': true,
    },
    errorResponseBuilder: (_req, context) => ({
      type: 'https://openbooking.example/errors/too-many-requests',
      title: 'Too Many Requests',
      status: 429,
      detail: `Rate limit exceeded. Try again in ${context.after}`,
    }),
  });

  // ── Error handler ────────────────────────────────────────────────────────────
  app.setErrorHandler((error, req, reply) => {
    if (error instanceof AppError) {
      const problem: ProblemDetail = error.toProblem(req.url);
      return reply
        .status(error.status)
        .header('Content-Type', 'application/problem+json')
        .send(problem);
    }

    // Fastify validation errors
    if (error.validation) {
      const problem: ProblemDetail = {
        type: 'https://openbooking.example/errors/validation-error',
        title: 'Validation Error',
        status: 422,
        detail: error.message,
        instance: req.url,
        errors: error.validation,
      };
      return reply
        .status(422)
        .header('Content-Type', 'application/problem+json')
        .send(problem);
    }

    // Rate limit errors (handled by plugin, but fallback)
    if (error.statusCode === 429) {
      return reply
        .status(429)
        .header('Content-Type', 'application/problem+json')
        .send({
          type: 'https://openbooking.example/errors/too-many-requests',
          title: 'Too Many Requests',
          status: 429,
          instance: req.url,
        });
    }

    // Unexpected errors
    req.log.error({ err: error }, 'Unhandled error');
    const problem: ProblemDetail = {
      type: 'https://openbooking.example/errors/internal-error',
      title: 'Internal Server Error',
      status: 500,
      instance: req.url,
      ...(config.NODE_ENV !== 'production' && { detail: error.message }),
    };
    return reply
      .status(500)
      .header('Content-Type', 'application/problem+json')
      .send(problem);
  });

  // 404 handler
  app.setNotFoundHandler((req, reply) => {
    return reply
      .status(404)
      .header('Content-Type', 'application/problem+json')
      .send({
        type: 'https://openbooking.example/errors/not-found',
        title: 'Not Found',
        status: 404,
        instance: req.url,
      });
  });

  // ── Routes ───────────────────────────────────────────────────────────────────
  await app.register(wellKnownRoutes);
  await app.register(healthRoutes);
  await app.register(authRoutes, { prefix: '/obp/v1/auth' });
  await app.register(providerRoutes, { prefix: '/obp/v1' });
  await app.register(serviceRoutes, { prefix: '/obp/v1' });
  await app.register(resourceRoutes, { prefix: '/obp/v1' });
  await app.register(slotRoutes, { prefix: '/obp/v1' });
  await app.register(bookingRoutes, { prefix: '/obp/v1' });
  await app.register(scheduleRoutes, { prefix: '/obp/v1' });
  await app.register(webhookRoutes, { prefix: '/obp/v1' });
  await app.register(federationRoutes, { prefix: '/federation' });
  await app.register(icalRoutes, { prefix: '/obp/v1' });
  await app.register(analyticsRoutes, { prefix: '/obp/v1' });
  await app.register(adminRoutes, { prefix: '/obp/v1/admin' });

  return app;
}
