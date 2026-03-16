import { describe, it, expect } from 'vitest';
import { hashWebhookPayload } from '../../lib/hash.js';
import { generateWebhookSecret } from '../../lib/id.js';

describe('webhook signature', () => {
  it('produces consistent HMAC for same payload and secret', () => {
    const payload = JSON.stringify({ event: 'booking.created', payload: { id: 'bk_1' } });
    const secret = generateWebhookSecret();
    const sig1 = hashWebhookPayload(payload, secret);
    const sig2 = hashWebhookPayload(payload, secret);
    expect(sig1).toBe(sig2);
  });

  it('produces different signature when payload changes', () => {
    const secret = generateWebhookSecret();
    const sig1 = hashWebhookPayload('{"event":"booking.created"}', secret);
    const sig2 = hashWebhookPayload('{"event":"booking.cancelled"}', secret);
    expect(sig1).not.toBe(sig2);
  });

  it('produces different signature when secret changes', () => {
    const payload = '{"event":"booking.created"}';
    const sig1 = hashWebhookPayload(payload, generateWebhookSecret());
    const sig2 = hashWebhookPayload(payload, generateWebhookSecret());
    expect(sig1).not.toBe(sig2);
  });

  it('returns lowercase hex string', () => {
    const sig = hashWebhookPayload('test', 'secret');
    expect(sig).toMatch(/^[0-9a-f]+$/);
  });

  it('returns 64-character hex (SHA-256)', () => {
    const sig = hashWebhookPayload('test', 'secret');
    expect(sig).toHaveLength(64);
  });
});

describe('webhook event matching', () => {
  // Pure logic extracted from emitWebhookEvent filter
  function matches(events: string[], event: string): boolean {
    return events.includes(event) || events.includes('*');
  }

  it('matches exact event', () => {
    expect(matches(['booking.created', 'booking.cancelled'], 'booking.created')).toBe(true);
  });

  it('does not match unregistered event', () => {
    expect(matches(['booking.created'], 'booking.cancelled')).toBe(false);
  });

  it('wildcard * matches any event', () => {
    expect(matches(['*'], 'booking.created')).toBe(true);
    expect(matches(['*'], 'provider.updated')).toBe(true);
  });

  it('empty events list matches nothing', () => {
    expect(matches([], 'booking.created')).toBe(false);
  });
});

describe('generateWebhookSecret', () => {
  it('returns 48-character secret', () => {
    expect(generateWebhookSecret()).toHaveLength(48);
  });

  it('generates unique secrets', () => {
    const secrets = new Set(Array.from({ length: 20 }, () => generateWebhookSecret()));
    expect(secrets.size).toBe(20);
  });
});
