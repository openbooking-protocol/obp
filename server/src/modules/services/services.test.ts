import { describe, it, expect } from 'vitest';
import {
  createServiceSchema,
  updateServiceSchema,
  listServicesQuerySchema,
} from './schema.js';

describe('createServiceSchema', () => {
  it('accepts valid input', () => {
    const result = createServiceSchema.safeParse({
      providerId: 'prov_1',
      name: 'Haircut',
      category: 'hair',
      durationMinutes: 30,
    });
    expect(result.success).toBe(true);
  });

  it('sets defaults', () => {
    const result = createServiceSchema.safeParse({
      providerId: 'prov_1',
      name: 'Haircut',
      category: 'hair',
      durationMinutes: 30,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.bufferBeforeMinutes).toBe(0);
      expect(result.data.bufferAfterMinutes).toBe(0);
      expect(result.data.maxCapacity).toBe(1);
      expect(result.data.requiresConfirmation).toBe(false);
      expect(result.data.tags).toEqual([]);
      expect(result.data.sortOrder).toBe(0);
    }
  });

  it('rejects missing required fields', () => {
    const result = createServiceSchema.safeParse({
      providerId: 'prov_1',
      name: 'Haircut',
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-positive durationMinutes', () => {
    const result = createServiceSchema.safeParse({
      providerId: 'prov_1',
      name: 'Haircut',
      category: 'hair',
      durationMinutes: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid price format', () => {
    const result = createServiceSchema.safeParse({
      providerId: 'prov_1',
      name: 'Haircut',
      category: 'hair',
      durationMinutes: 30,
      price: 'not-a-price',
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid price format', () => {
    const result = createServiceSchema.safeParse({
      providerId: 'prov_1',
      name: 'Haircut',
      category: 'hair',
      durationMinutes: 30,
      price: '12.50',
      currency: 'EUR',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid imageUrl', () => {
    const result = createServiceSchema.safeParse({
      providerId: 'prov_1',
      name: 'Haircut',
      category: 'hair',
      durationMinutes: 30,
      imageUrl: 'not-a-url',
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative bufferBeforeMinutes', () => {
    const result = createServiceSchema.safeParse({
      providerId: 'prov_1',
      name: 'Haircut',
      category: 'hair',
      durationMinutes: 30,
      bufferBeforeMinutes: -1,
    });
    expect(result.success).toBe(false);
  });
});

describe('updateServiceSchema', () => {
  it('accepts partial update', () => {
    const result = updateServiceSchema.safeParse({ name: 'Beard Trim' });
    expect(result.success).toBe(true);
  });

  it('accepts empty object (no-op update)', () => {
    const result = updateServiceSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('does not include providerId', () => {
    const result = updateServiceSchema.safeParse({ providerId: 'prov_1' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect('providerId' in result.data).toBe(false);
    }
  });
});

describe('listServicesQuerySchema', () => {
  it('applies defaults', () => {
    const result = listServicesQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(20);
    }
  });

  it('coerces string limit', () => {
    const result = listServicesQuerySchema.safeParse({ limit: '50' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(50);
    }
  });

  it('rejects limit > 100', () => {
    const result = listServicesQuerySchema.safeParse({ limit: '200' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid status', () => {
    const result = listServicesQuerySchema.safeParse({ status: 'deleted' });
    expect(result.success).toBe(false);
  });

  it('accepts valid status values', () => {
    for (const status of ['active', 'inactive', 'draft']) {
      const result = listServicesQuerySchema.safeParse({ status });
      expect(result.success).toBe(true);
    }
  });
});
