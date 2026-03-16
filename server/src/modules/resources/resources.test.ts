import { describe, it, expect } from 'vitest';
import { createResourceSchema, updateResourceSchema } from './schema.js';

describe('createResourceSchema', () => {
  it('accepts valid input', () => {
    const result = createResourceSchema.safeParse({
      providerId: 'prov_1',
      name: 'Chair 1',
      type: 'chair',
    });
    expect(result.success).toBe(true);
  });

  it('sets capacity default to 1', () => {
    const result = createResourceSchema.safeParse({
      providerId: 'prov_1',
      name: 'Room A',
      type: 'room',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.capacity).toBe(1);
    }
  });

  it('accepts explicit capacity', () => {
    const result = createResourceSchema.safeParse({
      providerId: 'prov_1',
      name: 'Conference Room',
      type: 'room',
      capacity: 10,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.capacity).toBe(10);
    }
  });

  it('rejects non-positive capacity', () => {
    const result = createResourceSchema.safeParse({
      providerId: 'prov_1',
      name: 'Room A',
      type: 'room',
      capacity: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing name', () => {
    const result = createResourceSchema.safeParse({
      providerId: 'prov_1',
      type: 'chair',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing type', () => {
    const result = createResourceSchema.safeParse({
      providerId: 'prov_1',
      name: 'Chair 1',
    });
    expect(result.success).toBe(false);
  });

  it('accepts serviceIds array', () => {
    const result = createResourceSchema.safeParse({
      providerId: 'prov_1',
      name: 'Chair 1',
      type: 'chair',
      serviceIds: ['svc_1', 'svc_2'],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.serviceIds).toEqual(['svc_1', 'svc_2']);
    }
  });

  it('rejects name longer than 255 chars', () => {
    const result = createResourceSchema.safeParse({
      providerId: 'prov_1',
      name: 'a'.repeat(256),
      type: 'chair',
    });
    expect(result.success).toBe(false);
  });

  it('accepts metadata object', () => {
    const result = createResourceSchema.safeParse({
      providerId: 'prov_1',
      name: 'Chair 1',
      type: 'chair',
      metadata: { color: 'red', floor: 2 },
    });
    expect(result.success).toBe(true);
  });
});

describe('updateResourceSchema', () => {
  it('accepts partial update', () => {
    const result = updateResourceSchema.safeParse({ name: 'Chair 2' });
    expect(result.success).toBe(true);
  });

  it('accepts empty object', () => {
    const result = updateResourceSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('does not include providerId field', () => {
    const result = updateResourceSchema.safeParse({ providerId: 'prov_1' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect('providerId' in result.data).toBe(false);
    }
  });

  it('validates capacity on update', () => {
    const result = updateResourceSchema.safeParse({ capacity: -1 });
    expect(result.success).toBe(false);
  });
});
