import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signRequest, verifySignature, getPublicKeyDocument } from './service.js';

// ── Key management ─────────────────────────────────────────────────────────────

describe('getPublicKeyDocument', () => {
  it('returns a valid public key document', () => {
    const doc = getPublicKeyDocument();
    expect(doc['@context']).toBe('https://w3id.org/security/v1');
    expect(doc.type).toBe('Ed25519VerificationKey2020');
    expect(doc.id).toContain('/federation/keys/main');
    expect(doc.publicKeyMultibase).toBeTruthy();
  });

  it('returns same key on repeated calls (cached)', () => {
    const doc1 = getPublicKeyDocument();
    const doc2 = getPublicKeyDocument();
    expect(doc1.publicKeyMultibase).toBe(doc2.publicKeyMultibase);
  });
});

// ── HTTP Signature sign/verify ─────────────────────────────────────────────────

describe('signRequest + verifySignature', () => {
  it('produces a parseable signature header', () => {
    const sig = signRequest('POST', 'http://localhost:3000/federation/peers', '{}', new Date().toUTCString());
    expect(sig).toMatch(/keyId=/);
    expect(sig).toMatch(/algorithm="ed25519"/);
    expect(sig).toMatch(/headers=/);
    expect(sig).toMatch(/signature=/);
  });

  it('verifies own signature', () => {
    const url = 'http://localhost:3000/federation/inbox';
    const method = 'POST';
    const body = JSON.stringify({ type: 'Announce', actor: 'http://peer.example' });
    const date = new Date().toUTCString();
    const sig = signRequest(method, url, body, date);

    // verifySignature expects publicKeyMultibase (base64-encoded PEM)
    const doc = getPublicKeyDocument();

    const headers: Record<string, string> = {
      'signature': sig,
      'host': 'localhost:3000',
      'date': date,
      'digest': `SHA-256=${Buffer.from(body).toString('base64')}`,
    };

    const valid = verifySignature(method, url, headers, doc.publicKeyMultibase);
    expect(valid).toBe(true);
  });

  it('rejects tampered body (digest mismatch)', () => {
    const url = 'http://localhost:3000/federation/inbox';
    const method = 'POST';
    const body = '{"original":"body"}';
    const date = new Date().toUTCString();
    const sig = signRequest(method, url, body, date);

    const doc = getPublicKeyDocument();
    const publicKey = Buffer.from(doc.publicKeyMultibase, 'base64').toString();

    const headers: Record<string, string> = {
      'signature': sig,
      'host': 'localhost:3000',
      'date': date,
      // Digest is for tampered body
      'digest': `SHA-256=${Buffer.from('{"tampered":"body"}').toString('base64')}`,
    };

    const valid = verifySignature(method, url, headers, publicKey);
    // Signature was made over original body's digest — tampered digest fails
    expect(valid).toBe(false);
  });

  it('returns false when signature header is missing', () => {
    const valid = verifySignature('GET', 'http://localhost:3000/obp/v1/services', {}, 'any-key');
    expect(valid).toBe(false);
  });
});

// ── Peer registration mocked ───────────────────────────────────────────────────

const mockInsertReturning = vi.fn();
const mockUpdateReturning = vi.fn();

function makeMockDb(rows: unknown[] = []) {
  const resolved = Promise.resolve(rows);
  const chain: Record<string, unknown> = Object.assign(resolved, {
    select: () => chain,
    from: () => chain,
    where: () => chain,
    orderBy: () => chain,
    limit: () => Promise.resolve(rows),
    insert: () => ({ values: () => ({ returning: mockInsertReturning }) }),
    update: () => ({ set: () => ({ where: () => ({ returning: mockUpdateReturning }) }) }),
  });
  return chain;
}

vi.mock('../../db/index.js', () => ({
  getDb: vi.fn(),
  schema: {
    federationPeers: {
      id: 'id', serverUrl: 'serverUrl', status: 'status',
      publicKey: 'publicKey', publicKeyId: 'publicKeyId',
      serverName: 'serverName', updatedAt: 'updatedAt',
    },
  },
}));

// Mock fetch for reciprocal registration
vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200 }));

import { getDb } from '../../db/index.js';
import { registerPeer, approvePeer, listPeers } from './service.js';

const mockGetDb = vi.mocked(getDb);

beforeEach(() => vi.clearAllMocks());

describe('registerPeer', () => {
  it('creates a new peer when not already registered', async () => {
    const newPeer = {
      id: 'peer_1', serverUrl: 'https://peer.example',
      publicKey: 'pk', publicKeyId: 'pkid', status: 'pending',
    };
    mockInsertReturning.mockResolvedValueOnce([newPeer]);
    mockGetDb.mockReturnValue(makeMockDb([]) as ReturnType<typeof getDb>); // no existing peer

    const result = await registerPeer({
      serverUrl: 'https://peer.example',
      publicKey: 'pk',
      publicKeyId: 'pkid',
    });
    expect(result.serverUrl).toBe('https://peer.example');
    expect(result.status).toBe('pending');
  });

  it('updates existing peer when already registered', async () => {
    const existing = { id: 'peer_1', serverUrl: 'https://peer.example', status: 'active' };
    const updated = { ...existing, publicKey: 'new-pk' };
    mockUpdateReturning.mockResolvedValueOnce([updated]);
    mockGetDb.mockReturnValue(makeMockDb([existing]) as ReturnType<typeof getDb>);

    const result = await registerPeer({
      serverUrl: 'https://peer.example',
      publicKey: 'new-pk',
      publicKeyId: 'new-pkid',
    });
    expect(mockUpdateReturning).toHaveBeenCalledOnce();
    expect(result.publicKey).toBe('new-pk');
  });
});

describe('approvePeer', () => {
  it('throws 404 when peer not found', async () => {
    mockGetDb.mockReturnValue(makeMockDb([]) as ReturnType<typeof getDb>);
    await expect(approvePeer('peer_missing')).rejects.toThrow();
  });
});

describe('listPeers', () => {
  it('returns all peers', async () => {
    const peers = [
      { id: 'peer_1', serverUrl: 'https://a.example', status: 'active' },
      { id: 'peer_2', serverUrl: 'https://b.example', status: 'pending' },
    ];
    mockGetDb.mockReturnValue(makeMockDb(peers) as ReturnType<typeof getDb>);

    const result = await listPeers();
    expect(result).toHaveLength(2);
  });
});
