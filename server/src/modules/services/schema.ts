import { z } from 'zod';

export const createServiceSchema = z.object({
  providerId: z.string().min(1),
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  category: z.string().min(1).max(100),
  durationMinutes: z.number().int().positive(),
  bufferBeforeMinutes: z.number().int().min(0).default(0),
  bufferAfterMinutes: z.number().int().min(0).default(0),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  currency: z.string().length(3).optional(),
  maxCapacity: z.number().int().positive().default(1),
  requiresConfirmation: z.boolean().default(false),
  imageUrl: z.string().url().optional(),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.unknown()).optional(),
  sortOrder: z.number().int().default(0),
});

export const updateServiceSchema = createServiceSchema.omit({ providerId: true }).partial();

export const listServicesQuerySchema = z.object({
  providerId: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(['active', 'inactive', 'draft']).optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
export type ListServicesQuery = z.infer<typeof listServicesQuerySchema>;
