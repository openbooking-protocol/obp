import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildTestApp } from './test-utils.js';
import { wellKnownRoutes } from '../routes/well-known.js';
import type { FastifyInstance } from 'fastify';

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildTestApp();
  await app.register(wellKnownRoutes);
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

describe('GET /.well-known/obp', () => {
  it('returns discovery document', async () => {
    const res = await app.inject({ method: 'GET', url: '/.well-known/obp' });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.version).toBe('1.0');
    expect(body.serverUrl).toBeDefined();
    expect(body.capabilities).toContain('booking');
    expect(body.capabilities).toContain('federation');
    expect(body.endpoints).toBeDefined();
    expect(body.endpoints.providers).toContain('/obp/v1/providers');
    expect(body.endpoints.bookings).toContain('/obp/v1/bookings');
  });

  it('includes federation info', async () => {
    const res = await app.inject({ method: 'GET', url: '/.well-known/obp' });
    const body = res.json();
    expect(body.federation).toBeDefined();
    expect(body.federation.peersEndpoint).toContain('/federation/peers');
    expect(body.federation.publicKeyId).toContain('/federation/keys/main');
  });
});

describe('GET /.well-known/webfinger', () => {
  it('returns webfinger response for given resource', async () => {
    const resource = 'https://example.com/obp';
    const res = await app.inject({
      method: 'GET',
      url: `/.well-known/webfinger?resource=${encodeURIComponent(resource)}`,
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.subject).toBe(resource);
    expect(body.links).toBeInstanceOf(Array);
    expect(body.links.length).toBeGreaterThan(0);
    expect(body.links[0].rel).toContain('openbooking.example');
    expect(body.links[0].href).toContain('/.well-known/obp');
  });

  it('returns 400 when resource param is missing', async () => {
    const res = await app.inject({ method: 'GET', url: '/.well-known/webfinger' });
    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body.detail).toMatch(/resource/i);
  });
});
