/**
 * Test utilities — build a minimal Fastify app without Redis rate limiting.
 * Used for route-level integration tests.
 */
import Fastify, { type FastifyInstance } from 'fastify';
import { AppError } from '../lib/errors.js';
import type { ProblemDetail } from '../lib/errors.js';

export async function buildTestApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });

  app.setErrorHandler((error, req, reply) => {
    if (error instanceof AppError) {
      const problem: ProblemDetail = error.toProblem(req.url);
      return reply.status(error.status).header('Content-Type', 'application/problem+json').send(problem);
    }
    if (error.validation) {
      return reply.status(422).send({ status: 422, title: 'Validation Error', detail: error.message });
    }
    return reply.status(500).send({ status: 500, title: 'Internal Server Error' });
  });

  return app;
}
