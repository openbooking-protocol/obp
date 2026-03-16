import { eq, and } from 'drizzle-orm';
import { SignJWT } from 'jose';
import { TextEncoder } from 'util';
import { getDb, schema } from '../../db/index.js';
import { generateId, generateApiKey } from '../../lib/id.js';
import { hashApiKey, sha256, safeCompare } from '../../lib/hash.js';
import { Errors } from '../../lib/errors.js';
import { config } from '../../config.js';
import { nanoid } from 'nanoid';

// ── API Keys ──────────────────────────────────────────────────────────────────

export async function createApiKey(input: {
  providerId?: string;
  name: string;
  scopes: string[];
  expiresAt?: Date;
}) {
  const db = getDb();
  const { key, prefix } = generateApiKey();
  const keyHash = hashApiKey(key);
  const id = generateId();

  await db.insert(schema.apiKeys).values({
    id,
    providerId: input.providerId ?? null,
    name: input.name,
    keyHash,
    keyPrefix: prefix,
    scopes: input.scopes,
    expiresAt: input.expiresAt,
    createdAt: new Date(),
  });

  // Return plaintext key only once
  return { id, key, prefix, scopes: input.scopes };
}

export async function listApiKeys(providerId: string) {
  const db = getDb();
  return db
    .select({
      id: schema.apiKeys.id,
      name: schema.apiKeys.name,
      keyPrefix: schema.apiKeys.keyPrefix,
      scopes: schema.apiKeys.scopes,
      isActive: schema.apiKeys.isActive,
      lastUsedAt: schema.apiKeys.lastUsedAt,
      expiresAt: schema.apiKeys.expiresAt,
      createdAt: schema.apiKeys.createdAt,
    })
    .from(schema.apiKeys)
    .where(eq(schema.apiKeys.providerId, providerId));
}

export async function revokeApiKey(id: string) {
  const db = getDb();
  await db
    .update(schema.apiKeys)
    .set({ isActive: false })
    .where(eq(schema.apiKeys.id, id));
}

export async function rotateApiKey(id: string) {
  const db = getDb();
  const { key, prefix } = generateApiKey();
  const keyHash = hashApiKey(key);

  await db
    .update(schema.apiKeys)
    .set({ keyHash, keyPrefix: prefix })
    .where(eq(schema.apiKeys.id, id));

  return { id, key, prefix };
}

// ── OAuth2 ─────────────────────────────────────────────────────────────────────

export async function authorize(input: {
  clientId: string;
  redirectUri: string;
  scopes: string[];
  codeChallenge?: string;
  codeChallengeMethod?: string;
  providerId?: string;
}) {
  const db = getDb();

  const [client] = await db
    .select()
    .from(schema.oauth2Clients)
    .where(eq(schema.oauth2Clients.clientId, input.clientId))
    .limit(1);

  if (!client) throw Errors.unauthorized('Unknown client_id');

  const redirectUris = client.redirectUris as string[];
  if (!redirectUris.includes(input.redirectUri)) {
    throw Errors.badRequest('redirect_uri not registered for this client');
  }

  const code = nanoid(48);
  const id = generateId();

  await db.insert(schema.oauth2AuthCodes).values({
    id,
    clientId: client.id,
    providerId: input.providerId ?? null,
    code,
    codeChallenge: input.codeChallenge,
    codeChallengeMethod: input.codeChallengeMethod,
    redirectUri: input.redirectUri,
    scopes: input.scopes,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min
    createdAt: new Date(),
  });

  return { code, redirectUri: input.redirectUri };
}

export async function exchangeCode(input: {
  code: string;
  clientId: string;
  redirectUri: string;
  codeVerifier?: string;
}) {
  const db = getDb();

  const [client] = await db
    .select()
    .from(schema.oauth2Clients)
    .where(eq(schema.oauth2Clients.clientId, input.clientId))
    .limit(1);

  if (!client) throw Errors.unauthorized('Unknown client_id');

  const [authCode] = await db
    .select()
    .from(schema.oauth2AuthCodes)
    .where(
      and(
        eq(schema.oauth2AuthCodes.code, input.code),
        eq(schema.oauth2AuthCodes.clientId, client.id),
      ),
    )
    .limit(1);

  if (!authCode) throw Errors.unauthorized('Invalid authorization code');
  if (authCode.used) throw Errors.gone('Authorization code already used');
  if (authCode.expiresAt < new Date()) throw Errors.gone('Authorization code expired');

  // PKCE verification
  if (authCode.codeChallenge) {
    if (!input.codeVerifier) throw Errors.badRequest('code_verifier required');
    const digest = sha256(input.codeVerifier);
    const challenge = Buffer.from(digest, 'hex').toString('base64url');
    if (!safeCompare(challenge, authCode.codeChallenge)) {
      throw Errors.unauthorized('code_verifier mismatch');
    }
  }

  // Mark code as used
  await db
    .update(schema.oauth2AuthCodes)
    .set({ used: true })
    .where(eq(schema.oauth2AuthCodes.id, authCode.id));

  // Issue tokens
  return issueTokens(client.id, authCode.providerId, authCode.scopes as string[]);
}

export async function refreshToken(input: { refreshToken: string; clientId: string }) {
  const db = getDb();

  const [client] = await db
    .select()
    .from(schema.oauth2Clients)
    .where(eq(schema.oauth2Clients.clientId, input.clientId))
    .limit(1);

  if (!client) throw Errors.unauthorized('Unknown client_id');

  const [token] = await db
    .select()
    .from(schema.oauth2Tokens)
    .where(
      and(
        eq(schema.oauth2Tokens.refreshToken, input.refreshToken),
        eq(schema.oauth2Tokens.clientId, client.id),
        eq(schema.oauth2Tokens.revoked, false),
      ),
    )
    .limit(1);

  if (!token) throw Errors.unauthorized('Invalid refresh token');
  if (token.refreshTokenExpiresAt && token.refreshTokenExpiresAt < new Date()) {
    throw Errors.gone('Refresh token expired');
  }

  // Revoke old token
  await db
    .update(schema.oauth2Tokens)
    .set({ revoked: true })
    .where(eq(schema.oauth2Tokens.id, token.id));

  return issueTokens(client.id, token.providerId, token.scopes as string[]);
}

async function issueTokens(clientId: string, providerId: string | null, scopes: string[]) {
  const db = getDb();
  const secret = new TextEncoder().encode(config.JWT_SECRET);

  const accessTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h
  const refreshTokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30d

  const accessToken = await new SignJWT({ sub: providerId ?? undefined, scopes })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(secret);

  const refreshTokenValue = nanoid(64);
  const id = generateId();

  await db.insert(schema.oauth2Tokens).values({
    id,
    clientId,
    providerId,
    accessToken,
    refreshToken: refreshTokenValue,
    scopes,
    accessTokenExpiresAt,
    refreshTokenExpiresAt,
    createdAt: new Date(),
  });

  return {
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: 3600,
    refresh_token: refreshTokenValue,
    scope: scopes.join(' '),
  };
}

export async function revokeToken(token: string) {
  const db = getDb();
  await db
    .update(schema.oauth2Tokens)
    .set({ revoked: true })
    .where(eq(schema.oauth2Tokens.accessToken, token));
}
