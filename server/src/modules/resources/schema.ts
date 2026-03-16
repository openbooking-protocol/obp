import { z } from 'zod';

export const createResourceSchema = z.object({
  providerId: z.string().min(1),
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  type: z.string().min(1).max(100),
  capacity: z.number().int().positive().default(1),
  serviceIds: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const updateResourceSchema = createResourceSchema.omit({ providerId: true }).partial();

export type CreateResourceInput = z.infer<typeof createResourceSchema>;
export type UpdateResourceInput = z.infer<typeof updateResourceSchema>;
