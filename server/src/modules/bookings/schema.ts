import { z } from 'zod';

export const createBookingSchema = z.object({
  serviceId: z.string().min(1),
  slotId: z.string().min(1),
  holdToken: z.string().optional(),
  customerName: z.string().min(1).max(255),
  customerEmail: z.string().email(),
  customerPhone: z.string().max(50).optional(),
  notes: z.string().max(2000).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const cancelBookingSchema = z.object({
  reason: z.string().max(500).optional(),
});

export const listBookingsQuerySchema = z.object({
  providerId: z.string().optional(),
  serviceId: z.string().optional(),
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed', 'no_show']).optional(),
  customerEmail: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;
export type ListBookingsQuery = z.infer<typeof listBookingsQuerySchema>;
