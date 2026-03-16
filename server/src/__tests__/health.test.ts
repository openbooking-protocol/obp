import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { buildTestApp } from './test-utils.js';
import { healthRoutes } from '../routes/health.js';
import type { FastifyInstance } from 'fastify';

// Mock the DB so health/ready doesn't need a real database
vi.mock('../db/index.js', () => ({
  getDb: vi.fn(() => ({
    execute: vi.fn().mockResolvedValue([{ '?column?': 1 }]),
  })),
  schema: {},
}));

// Mock Redis so health/ready doesn't need a real Redis instance
vi.mock('../redis.js', () => ({
  getRedis: vi.fn(() => ({
    ping: vi.fn().mockResolvedValue('PONG'),
  })),
}));

// Mock config
vi.mock('../config.js', () => ({
  config: {
    serverUrl: 'http://localhost:3000',
    jwtSecret: 'test-secret',
    port: 3000,
  },
}));

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildTestApp();
  await app.register(healthRoutes);
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe('ok');
  });

  it('responds quickly (liveness probe)', async () => {
    const start = Date.now();
    const res = await app.inject({ method: 'GET', url: '/health' });
    const elapsed = Date.now() - start;

    expect(res.statusCode).toBe(200);
    // Liveness check should be fast — no external calls
    expect(elapsed).toBeLessThan(500);
  });
});

describe('GET /health/ready', () => {
  it('returns 200 when both DB and Redis are healthy', async () => {
    const res = await app.inject({ method: 'GET', url: '/health/ready' });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe('ok');
    expect(body.checks).toBeDefined();
    expect(body.checks.database).toBeDefined();
    expect(body.checks.redis).toBeDefined();
  });

  it('includes version and timestamp fields', async () => {
    const res = await app.inject({ method: 'GET', url: '/health/ready' });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.version).toBe('0.1.0');
    expect(body.timestamp).toBeDefined();
    expect(new Date(body.timestamp).getTime()).not.toBeNaN();
  });

  it('includes uptime as a non-negative number', async () => {
    const res = await app.inject({ method: 'GET', url: '/health/ready' });

    const body = res.json();
    expect(typeof body.uptime).toBe('number');
    expect(body.uptime).toBeGreaterThanOrEqual(0);
  });

  it('reports database check with status and latency', async () => {
    const res = await app.inject({ method: 'GET', url: '/health/ready' });

    const body = res.json();
    expect(body.checks.database.status).toBe('ok');
    expect(typeof body.checks.database.latencyMs).toBe('number');
    expect(body.checks.database.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it('reports redis check with status and latency', async () => {
    const res = await app.inject({ method: 'GET', url: '/health/ready' });

    const body = res.json();
    expect(body.checks.redis.status).toBe('ok');
    expect(typeof body.checks.redis.latencyMs).toBe('number');
    expect(body.checks.redis.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it('returns 503 when database is unavailable', async () => {
    const { getDb } = await import('../db/index.js');
    vi.mocked(getDb).mockReturnValueOnce({
      execute: vi.fn().mockRejectedValue(new Error('Connection refused')),
    } as ReturnType<typeof getDb>);

    const res = await app.inject({ method: 'GET', url: '/health/ready' });

    expect(res.statusCode).toBe(503);
    const body = res.json();
    expect(body.status).toBe('degraded');
    expect(body.checks.database.status).toBe('error');
    expect(body.checks.database.error).toContain('Connection refused');
  });

  it('returns 503 when Redis is unavailable', async () => {
    const { getRedis } = await import('../redis.js');
    vi.mocked(getRedis).mockReturnValueOnce({
      ping: vi.fn().mockRejectedValue(new Error('Redis connection error')),
    } as ReturnType<typeof getRedis>);

    const res = await app.inject({ method: 'GET', url: '/health/ready' });

    expect(res.statusCode).toBe(503);
    const body = res.json();
    expect(body.status).toBe('degraded');
    expect(body.checks.redis.status).toBe('error');
    expect(body.checks.redis.error).toContain('Redis connection error');
  });
});
