import { eq, and } from 'drizzle-orm';
import { createPrivateKey, createPublicKey, generateKeyPairSync, sign, verify } from 'crypto';
import { getDb, schema } from '../../db/index.js';
import { generateId } from '../../lib/id.js';
import { Errors } from '../../lib/errors.js';
import { config } from '../../config.js';
import { logger } from '../../logger.js';

// ── Key management ─────────────────────────────────────────────────────────────

// In production these should be stored in DB or secrets manager
// For reference implementation, generate on startup and cache in memory
let serverKeyPair: { privateKey: string; publicKey: string } | null = null;

export function getServerKeyPair() {
  if (!serverKeyPair) {
    const { privateKey, publicKey } = generateKeyPairSync('ed25519', {
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      publicKeyEncoding: { type: 'spki', format: 'pem' },
    });
    serverKeyPair = { privateKey, publicKey };
    logger.info('Generated Ed25519 key pair for federation');
  }
  return serverKeyPair;
}

export function getPublicKeyDocument() {
  const { publicKey } = getServerKeyPair();
  return {
    '@context': 'https://w3id.org/security/v1',
    id: `${config.SERVER_URL}/federation/keys/main`,
    type: 'Ed25519VerificationKey2020',
    controller: config.SERVER_URL,
    publicKeyMultibase: Buffer.from(publicKey).toString('base64'),
  };
}

// ── HTTP Signatures ───────────────────────────────────────────────────────────

export function signRequest(method: string, url: string, body: string, date: string): string {
  const { privateKey } = getServerKeyPair();
  const target = new URL(url);
  const signingString = [
    `(request-target): ${method.toLowerCase()} ${target.pathname}${target.search}`,
    `host: ${target.host}`,
    `date: ${date}`,
    `digest: SHA-256=${Buffer.from(body).toString('base64')}`,
  ].join('\n');

  const key = createPrivateKey(privateKey);
  const signature = sign(null, Buffer.from(signingString), key);

  return [
    `keyId="${config.SERVER_URL}/federation/keys/main"`,
    `algorithm="ed25519"`,
    `headers="(request-target) host date digest"`,
    `signature="${signature.toString('base64')}"`,
  ].join(',');
}

export function verifySignature(
  method: string,
  url: string,
  headers: Record<string, string>,
  peerPublicKey: string,
): boolean {
  try {
    const sigHeader = headers['signature'];
    if (!sigHeader) return false;

    const parts = Object.fromEntries(
      sigHeader.split(',').map((p) => {
        const [k, ...vs] = p.trim().split('=');
        return [k, vs.join('=').replace(/^"|"$/g, '')];
      }),
    );

    const signedHeaders = (parts['headers'] ?? '').split(' ');
    const target = new URL(url);

    const signingString = signedHeaders
      .map((h) => {
        if (h === '(request-target)') {
          return `(request-target): ${method.toLowerCase()} ${target.pathname}${target.search}`;
        }
        return `${h}: ${headers[h] ?? ''}`;
      })
      .join('\n');

    const key = createPublicKey(Buffer.from(peerPublicKey, 'base64').toString());
    return verify(
      null,
      Buffer.from(signingString),
      key,
      Buffer.from(parts['signature'] ?? '', 'base64'),
    );
  } catch {
    return false;
  }
}

// ── Peer management ────────────────────────────────────────────────────────────

export async function listPeers() {
  const db = getDb();
  return db.select().from(schema.federationPeers);
}

export async function getPeer(id: string) {
  const db = getDb();
  const [peer] = await db
    .select()
    .from(schema.federationPeers)
    .where(eq(schema.federationPeers.id, id))
    .limit(1);

  if (!peer) throw Errors.notFound('Federation peer', id);
  return peer;
}

export async function registerPeer(input: {
  serverUrl: string;
  serverName?: string;
  publicKey: string;
  publicKeyId: string;
}) {
  const db = getDb();

  // Check if already registered
  const [existing] = await db
    .select()
    .from(schema.federationPeers)
    .where(eq(schema.federationPeers.serverUrl, input.serverUrl))
    .limit(1);

  if (existing) {
    // Update key
    const [updated] = await db
      .update(schema.federationPeers)
      .set({
        publicKey: input.publicKey,
        publicKeyId: input.publicKeyId,
        serverName: input.serverName,
        updatedAt: new Date(),
      })
      .where(eq(schema.federationPeers.id, existing.id))
      .returning();
    return updated!;
  }

  const id = generateId();
  const now = new Date();

  const [peer] = await db
    .insert(schema.federationPeers)
    .values({
      id,
      serverUrl: input.serverUrl,
      serverName: input.serverName,
      publicKey: input.publicKey,
      publicKeyId: input.publicKeyId,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  // Send reciprocal registration (fire-and-forget)
  void sendReciprocal(input.serverUrl);

  return peer!;
}

async function sendReciprocal(peerUrl: string) {
  try {
    const { publicKey } = getServerKeyPair();
    const date = new Date().toUTCString();
    const body = JSON.stringify({
      serverUrl: config.SERVER_URL,
      serverName: config.SERVER_NAME,
      publicKey: Buffer.from(publicKey).toString('base64'),
      publicKeyId: `${config.SERVER_URL}/federation/keys/main`,
    });

    const signature = signRequest('POST', `${peerUrl}/federation/peers`, body, date);

    await fetch(`${peerUrl}/federation/peers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Date: date,
        Signature: signature,
      },
      body,
      signal: AbortSignal.timeout(10000),
    });
  } catch (err) {
    logger.warn({ err, peerUrl }, 'Failed to send reciprocal federation registration');
  }
}

export async function approvePeer(id: string) {
  const db = getDb();
  const [updated] = await db
    .update(schema.federationPeers)
    .set({ status: 'active', updatedAt: new Date() })
    .where(eq(schema.federationPeers.id, id))
    .returning();

  if (!updated) throw Errors.notFound('Federation peer', id);
  return updated;
}

// ── Federated search ───────────────────────────────────────────────────────────

export async function federatedSearch(params: {
  q: string;
  category?: string;
  from?: string;
  to?: string;
}) {
  const db = getDb();

  const activePeers = await db
    .select()
    .from(schema.federationPeers)
    .where(eq(schema.federationPeers.status, 'active'));

  const results = await Promise.allSettled(
    activePeers.map(async (peer) => {
      const url = new URL(`${peer.serverUrl}/obp/v1/services`);
      if (params.q) url.searchParams.set('search', params.q);
      if (params.category) url.searchParams.set('category', params.category);

      const response = await fetch(url.toString(), {
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) return [];
      const data = (await response.json()) as { items: unknown[] };
      return (data.items ?? []).map((item) => ({ ...item as object, _server: peer.serverUrl }));
    }),
  );

  return results
    .filter((r): r is PromiseFulfilledResult<unknown[]> => r.status === 'fulfilled')
    .flatMap((r) => r.value);
}

// ── Catalog sync ───────────────────────────────────────────────────────────────

export async function syncCatalog(peerId: string) {
  const db = getDb();
  const peer = await getPeer(peerId);

  try {
    const since = peer.lastSyncAt?.toISOString();
    const url = `${peer.serverUrl}/federation/sync${since ? `?since=${since}` : ''}`;

    const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error(`Sync failed: HTTP ${response.status}`);

    const data = await response.json() as { providers?: unknown[]; services?: unknown[] };

    await db
      .update(schema.federationPeers)
      .set({ lastSyncAt: new Date(), lastSeenAt: new Date(), updatedAt: new Date() })
      .where(eq(schema.federationPeers.id, peerId));

    return data;
  } catch (err) {
    logger.warn({ err, peerId }, 'Catalog sync failed');
    throw err;
  }
}
