import { z } from 'zod';

export const listSlotsQuerySchema = z.object({
  serviceId: z.string().optional(),
  providerId: z.string().optional(),
  from: z.string().datetime(),
  to: z.string().datetime(),
  status: z.enum(['available', 'held', 'booked', 'blocked']).optional(),
  limit: z.coerce.number().int().min(1).max(500).default(100),
  cursor: z.string().optional(),
});

export const holdSlotBodySchema = z.object({
  holdToken: z.string().optional(),
});

export type ListSlotsQuery = z.infer<typeof listSlotsQuerySchema>;
