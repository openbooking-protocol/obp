import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createProviderSchema, updateProviderSchema, listProvidersQuerySchema } from './schema.js';

describe('Provider schemas', () => {
  describe('createProviderSchema', () => {
    it('accepts valid input', () => {
      const result = createProviderSchema.safeParse({
        name: 'Test Provider',
        slug: 'test-provider',
        email: 'test@example.com',
        timezone: 'Europe/Belgrade',
        locale: 'sr',
        currency: 'RSD',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid slug', () => {
      const result = createProviderSchema.safeParse({
        name: 'Test',
        slug: 'Test Provider!',
        email: 'test@example.com',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.path).toContain('slug');
      }
    });

    it('rejects invalid email', () => {
      const result = createProviderSchema.safeParse({
        name: 'Test',
        slug: 'test',
        email: 'not-an-email',
      });
      expect(result.success).toBe(false);
    });

    it('sets defaults', () => {
      const result = createProviderSchema.safeParse({
        name: 'Test',
        slug: 'test',
        email: 'test@example.com',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.timezone).toBe('UTC');
        expect(result.data.currency).toBe('EUR');
        expect(result.data.categories).toEqual([]);
      }
    });
  });

  describe('listProvidersQuerySchema', () => {
    it('applies defaults', () => {
      const result = listProvidersQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });

    it('coerces string numbers', () => {
      const result = listProvidersQuerySchema.safeParse({ limit: '50' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(50);
      }
    });

    it('rejects limit > 100', () => {
      const result = listProvidersQuerySchema.safeParse({ limit: '200' });
      expect(result.success).toBe(false);
    });
  });
});
