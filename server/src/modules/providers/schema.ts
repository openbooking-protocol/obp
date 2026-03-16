import { z } from 'zod';

const addressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().length(2).optional(),
});

export const createProviderSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  description: z.string().max(2000).optional(),
  email: z.string().email(),
  phone: z.string().max(50).optional(),
  website: z.string().url().optional(),
  logoUrl: z.string().url().optional(),
  timezone: z.string().default('UTC'),
  locale: z.string().default('en'),
  currency: z.string().length(3).default('EUR'),
  address: addressSchema.optional(),
  categories: z.array(z.string()).default([]),
  metadata: z.record(z.unknown()).optional(),
});

export const updateProviderSchema = createProviderSchema.partial();

export const listProvidersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(['active', 'inactive', 'suspended', 'pending']).optional(),
  search: z.string().optional(),
});

export type CreateProviderInput = z.infer<typeof createProviderSchema>;
export type UpdateProviderInput = z.infer<typeof updateProviderSchema>;
export type ListProvidersQuery = z.infer<typeof listProvidersQuerySchema>;
