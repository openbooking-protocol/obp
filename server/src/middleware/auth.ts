import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq, and } from 'drizzle-orm';
import { getDb, schema } from '../db/index.js';
import { hashApiKey } from '../lib/hash.js';
import { Errors } from '../lib/errors.js';
import { jwtVerify, createRemoteJWKSet } from 'jose';
import { config } from '../config.js';
import { TextEncoder } from 'util';

export type AuthContext = {
  type: 'apikey' | 'bearer';
  providerId: string | null;
  scopes: string[];
  keyId?: string;
};

declare module 'fastify' {
  interface FastifyRequest {
    auth?: AuthContext;
  }
}

export async function resolveAuth(req: FastifyRequest): Promise<AuthContext | null> {
  const apiKey = req.headers['x-api-key'];
  if (apiKey && typeof apiKey === 'string') {
    return resolveApiKey(apiKey);
  }

  const authorization = req.headers['authorization'];
  if (authorization?.startsWith('Bearer ')) {
    const token = authorization.slice(7);
    return resolveJwt(token);
  }

  return null;
}

async function resolveApiKey(key: string): Promise<AuthContext | null> {
  const keyHash = hashApiKey(key);
  const db = getDb();

  const [apiKey] = await db
    .select()
    .from(schema.apiKeys)
    .where(and(eq(schema.apiKeys.keyHash, keyHash), eq(schema.apiKeys.isActive, true)))
    .limit(1);

  if (!apiKey) return null;

  // Check expiry
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return null;

  // Update last used (fire-and-forget)
  void db
    .update(schema.apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(schema.apiKeys.id, apiKey.id));

  return {
    type: 'apikey',
    providerId: apiKey.providerId,
    scopes: apiKey.scopes as string[],
    keyId: apiKey.id,
  };
}

async function resolveJwt(token: string): Promise<AuthContext | null> {
  try {
    const secret = new TextEncoder().encode(config.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'],
    });

    return {
      type: 'bearer',
      providerId: (payload.sub as string) ?? null,
      scopes: (payload.scopes as string[]) ?? [],
    };
  } catch {
    return null;
  }
}

// Fastify preHandler factories
export function requireAuth(scopes?: string[]) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const auth = await resolveAuth(req);
    if (!auth) {
      throw Errors.unauthorized('Authentication required');
    }

    if (scopes && scopes.length > 0) {
      const hasScope = scopes.some((s) => auth.scopes.includes(s) || auth.scopes.includes('admin'));
      if (!hasScope) {
        throw Errors.forbidden(`Required scope: ${scopes.join(' or ')}`);
      }
    }

    req.auth = auth;
  };
}

export function requireProviderAuth() {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const auth = await resolveAuth(req);
    if (!auth) {
      throw Errors.unauthorized('Authentication required');
    }
    if (!auth.providerId) {
      throw Errors.forbidden('Provider context required');
    }
    req.auth = auth;
  };
}
