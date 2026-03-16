import { describe, it, expect } from 'vitest';
import { listSlotsQuerySchema, holdSlotBodySchema } from './schema.js';

describe('listSlotsQuerySchema', () => {
  it('accepts valid query with from/to', () => {
    const result = listSlotsQuerySchema.safeParse({
      from: '2026-03-16T09:00:00Z',
      to: '2026-03-16T17:00:00Z',
    });
    expect(result.success).toBe(true);
  });

  it('sets default limit to 100', () => {
    const result = listSlotsQuerySchema.safeParse({
      from: '2026-03-16T09:00:00Z',
      to: '2026-03-16T17:00:00Z',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(100);
    }
  });

  it('rejects missing from', () => {
    const result = listSlotsQuerySchema.safeParse({
      to: '2026-03-16T17:00:00Z',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing to', () => {
    const result = listSlotsQuerySchema.safeParse({
      from: '2026-03-16T09:00:00Z',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid datetime format', () => {
    const result = listSlotsQuerySchema.safeParse({
      from: '2026-03-16',
      to: '2026-03-17',
    });
    expect(result.success).toBe(false);
  });

  it('coerces string limit', () => {
    const result = listSlotsQuerySchema.safeParse({
      from: '2026-03-16T09:00:00Z',
      to: '2026-03-16T17:00:00Z',
      limit: '50',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(50);
    }
  });

  it('rejects limit > 500', () => {
    const result = listSlotsQuerySchema.safeParse({
      from: '2026-03-16T09:00:00Z',
      to: '2026-03-16T17:00:00Z',
      limit: '1000',
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid status filters', () => {
    for (const status of ['available', 'held', 'booked', 'blocked']) {
      const result = listSlotsQuerySchema.safeParse({
        from: '2026-03-16T09:00:00Z',
        to: '2026-03-16T17:00:00Z',
        status,
      });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid status', () => {
    const result = listSlotsQuerySchema.safeParse({
      from: '2026-03-16T09:00:00Z',
      to: '2026-03-16T17:00:00Z',
      status: 'expired',
    });
    expect(result.success).toBe(false);
  });

  it('accepts optional filters', () => {
    const result = listSlotsQuerySchema.safeParse({
      from: '2026-03-16T09:00:00Z',
      to: '2026-03-16T17:00:00Z',
      serviceId: 'svc_1',
      providerId: 'prov_1',
      cursor: 'abc123',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.serviceId).toBe('svc_1');
      expect(result.data.providerId).toBe('prov_1');
    }
  });
});

describe('holdSlotBodySchema', () => {
  it('accepts empty body', () => {
    const result = holdSlotBodySchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts holdToken', () => {
    const result = holdSlotBodySchema.safeParse({ holdToken: 'tok_abc123' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.holdToken).toBe('tok_abc123');
    }
  });

  it('holdToken is optional', () => {
    const result = holdSlotBodySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.holdToken).toBeUndefined();
    }
  });
});
