import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateApiKey } from '../lib/id.js';
import { hashApiKey } from '../lib/hash.js';

// Mock DB before importing auth middleware
const mockSelect = vi.fn();
const mockFrom = vi.fn();
const mockWhere = vi.fn();
const mockLimit = vi.fn();
const mockUpdate = vi.fn();
const mockSet = vi.fn();

const mockDbChain = {
  select: mockSelect,
  from: mockFrom,
  where: mockWhere,
  limit: mockLimit,
  update: mockUpdate,
  set: mockSet,
};

vi.mock('../db/index.js', () => ({
  getDb: () => ({
    select: () => ({ from: () => ({ where: () => ({ limit: mockLimit }) }) }),
    update: () => ({ set: () => ({ where: vi.fn() }) }),
  }),
  schema: {
    apiKeys: { keyHash: 'keyHash', isActive: 'isActive', id: 'id', expiresAt: 'expiresAt' },
  },
}));

import { resolveAuth, requireAuth } from '../middleware/auth.js';
import type { FastifyRequest, FastifyReply } from 'fastify';

function makeRequest(overrides: Partial<FastifyRequest> = {}): FastifyRequest {
  return {
    headers: {},
    auth: undefined,
    ...overrides,
  } as unknown as FastifyRequest;
}

function makeReply(): FastifyReply & { _status?: number; _body?: unknown } {
  const reply = {
    _status: 0,
    _body: undefined,
    status(code: number) { this._status = code; return this; },
    send(body: unknown) { this._body = body; return this; },
    header() { return this; },
  };
  return reply as unknown as FastifyReply & { _status?: number; _body?: unknown };
}

describe('resolveAuth', () => {
  it('returns null when no credentials provided', async () => {
    const req = makeRequest({ headers: {} });
    // DB returns empty result
    mockLimit.mockResolvedValueOnce([]);
    const result = await resolveAuth(req);
    expect(result).toBeNull();
  });

  it('returns null for malformed API key', async () => {
    const req = makeRequest({ headers: { 'x-api-key': 'invalid-key' } });
    mockLimit.mockResolvedValueOnce([]);
    const result = await resolveAuth(req);
    expect(result).toBeNull();
  });
});

describe('scope check logic', () => {
  // The scope check from requireAuth:
  // scopes.some(s => auth.scopes.includes(s) || auth.scopes.includes('admin'))

  function hasRequiredScope(authScopes: string[], requiredScopes: string[]): boolean {
    return requiredScopes.some((s) => authScopes.includes(s) || authScopes.includes('admin'));
  }

  it('grants access when auth has exact required scope', () => {
    expect(hasRequiredScope(['provider:read'], ['provider:read'])).toBe(true);
  });

  it('grants access when auth has admin (supersedes everything)', () => {
    expect(hasRequiredScope(['admin'], ['provider:write'])).toBe(true);
    expect(hasRequiredScope(['admin'], ['admin', 'provider:read'])).toBe(true);
  });

  it('denies access when scope is missing', () => {
    expect(hasRequiredScope(['provider:read'], ['admin'])).toBe(false);
    expect(hasRequiredScope(['provider:read'], ['provider:write'])).toBe(false);
  });

  it('grants when any of multiple required scopes match', () => {
    expect(hasRequiredScope(['provider:read'], ['provider:read', 'admin'])).toBe(true);
  });

  it('denies when no scopes provided', () => {
    expect(hasRequiredScope([], ['provider:read'])).toBe(false);
  });
});

describe('API key generation and hashing', () => {
  it('generated key has correct format', () => {
    const { key, prefix } = generateApiKey();
    expect(key).toMatch(/^obp_[A-Za-z0-9_-]+_[A-Za-z0-9_-]+$/);
    expect(prefix).toMatch(/^obp_[A-Za-z0-9_-]{8}$/);
  });

  it('hash is deterministic', () => {
    const { key } = generateApiKey();
    expect(hashApiKey(key)).toBe(hashApiKey(key));
  });

  it('different keys produce different hashes', () => {
    const key1 = generateApiKey().key;
    const key2 = generateApiKey().key;
    expect(hashApiKey(key1)).not.toBe(hashApiKey(key2));
  });
});
