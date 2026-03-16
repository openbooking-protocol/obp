import type { FastifyPluginAsync } from 'fastify';
import { getDb } from '../db/index.js';
import { getRedis } from '../redis.js';
import { config } from '../config.js';
import { sql } from 'drizzle-orm';

export const healthRoutes: FastifyPluginAsync = async (app) => {
  // Basic liveness check
  app.get('/health', { logLevel: 'warn' }, async (_req, reply) => {
    return reply.status(200).send({ status: 'ok' });
  });

  // Full readiness check
  app.get('/health/ready', { logLevel: 'warn' }, async (_req, reply) => {
    const checks: Record<string, { status: string; latencyMs?: number; error?: string }> = {};
    let overallOk = true;

    // DB check
    const dbStart = Date.now();
    try {
      const db = getDb();
      await db.execute(sql`SELECT 1`);
      checks.database = { status: 'ok', latencyMs: Date.now() - dbStart };
    } catch (err) {
      checks.database = {
        status: 'error',
        latencyMs: Date.now() - dbStart,
        error: String(err),
      };
      overallOk = false;
    }

    // Redis check
    const redisStart = Date.now();
    try {
      const redis = getRedis();
      await redis.ping();
      checks.redis = { status: 'ok', latencyMs: Date.now() - redisStart };
    } catch (err) {
      checks.redis = {
        status: 'error',
        latencyMs: Date.now() - redisStart,
        error: String(err),
      };
      overallOk = false;
    }

    const status = overallOk ? 'ok' : 'degraded';
    return reply.status(overallOk ? 200 : 503).send({
      status,
      version: '0.1.0',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      checks,
    });
  });
};
