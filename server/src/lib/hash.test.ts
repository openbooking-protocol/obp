import { describe, it, expect } from 'vitest';
import { hashApiKey, hashWebhookPayload, safeCompare, sha256 } from './hash.js';

describe('hash utilities', () => {
  describe('hashApiKey', () => {
    it('produces consistent hashes', () => {
      const hash1 = hashApiKey('test-key-123');
      const hash2 = hashApiKey('test-key-123');
      expect(hash1).toBe(hash2);
    });

    it('produces different hashes for different keys', () => {
      const hash1 = hashApiKey('key-a');
      const hash2 = hashApiKey('key-b');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('hashWebhookPayload', () => {
    it('produces hex signature', () => {
      const sig = hashWebhookPayload('{"event":"test"}', 'secret');
      expect(sig).toMatch(/^[0-9a-f]{64}$/);
    });

    it('different secret = different signature', () => {
      const sig1 = hashWebhookPayload('payload', 'secret1');
      const sig2 = hashWebhookPayload('payload', 'secret2');
      expect(sig1).not.toBe(sig2);
    });
  });

  describe('safeCompare', () => {
    it('returns true for equal strings', () => {
      expect(safeCompare('abc', 'abc')).toBe(true);
    });

    it('returns false for different strings of same length', () => {
      expect(safeCompare('abc', 'xyz')).toBe(false);
    });

    it('returns false for different length strings', () => {
      expect(safeCompare('abc', 'abcd')).toBe(false);
    });
  });

  describe('sha256', () => {
    it('returns 64 char hex', () => {
      const hash = sha256('hello');
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[0-9a-f]+$/);
    });
  });
});
