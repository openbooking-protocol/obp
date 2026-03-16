import { describe, it, expect } from 'vitest';
import { generateId, generateApiKey, generateWebhookSecret } from '../../lib/id.js';
import { hashApiKey, safeCompare } from '../../lib/hash.js';

describe('generateId', () => {
  it('returns a 26-character string', () => {
    const id = generateId();
    expect(id).toHaveLength(26);
  });

  it('returns unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });

  it('contains only URL-safe characters', () => {
    const id = generateId();
    expect(id).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});

describe('generateApiKey', () => {
  it('returns key and prefix', () => {
    const { key, prefix } = generateApiKey();
    expect(key).toBeDefined();
    expect(prefix).toBeDefined();
  });

  it('prefix starts with obp_', () => {
    const { prefix } = generateApiKey();
    expect(prefix).toMatch(/^obp_/);
  });

  it('key starts with prefix', () => {
    const { key, prefix } = generateApiKey();
    expect(key.startsWith(prefix)).toBe(true);
  });

  it('key contains underscore separator after prefix', () => {
    const { key, prefix } = generateApiKey();
    // key = "obp_XXXXXXXX_YYYYYYYYYY..."
    const afterPrefix = key.slice(prefix.length);
    expect(afterPrefix.startsWith('_')).toBe(true);
  });

  it('generates unique keys', () => {
    const keys = new Set(Array.from({ length: 50 }, () => generateApiKey().key));
    expect(keys.size).toBe(50);
  });
});

describe('generateWebhookSecret', () => {
  it('returns a 48-character string', () => {
    const secret = generateWebhookSecret();
    expect(secret).toHaveLength(48);
  });

  it('returns unique secrets', () => {
    const secrets = new Set(Array.from({ length: 50 }, () => generateWebhookSecret()));
    expect(secrets.size).toBe(50);
  });
});

describe('API key hashing', () => {
  it('hashed key does not equal original', () => {
    const { key } = generateApiKey();
    const hashed = hashApiKey(key);
    expect(hashed).not.toBe(key);
  });

  it('same key produces same hash (deterministic)', () => {
    const { key } = generateApiKey();
    expect(hashApiKey(key)).toBe(hashApiKey(key));
  });

  it('different keys produce different hashes', () => {
    const { key: key1 } = generateApiKey();
    const { key: key2 } = generateApiKey();
    expect(hashApiKey(key1)).not.toBe(hashApiKey(key2));
  });

  it('hash can be verified with safeCompare', () => {
    const { key } = generateApiKey();
    const hash = hashApiKey(key);
    expect(safeCompare(hash, hash)).toBe(true);
  });

  it('wrong key does not match hash', () => {
    const { key: key1 } = generateApiKey();
    const { key: key2 } = generateApiKey();
    const hash1 = hashApiKey(key1);
    const hash2 = hashApiKey(key2);
    expect(safeCompare(hash1, hash2)).toBe(false);
  });
});
