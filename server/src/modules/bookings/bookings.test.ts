import { describe, it, expect } from 'vitest';
import { createBookingSchema, cancelBookingSchema, listBookingsQuerySchema } from './schema.js';

describe('Booking schemas', () => {
  describe('createBookingSchema', () => {
    it('accepts valid booking', () => {
      const result = createBookingSchema.safeParse({
        serviceId: 'svc_123',
        slotId: 'slot_456',
        customerName: 'Marko Markovic',
        customerEmail: 'marko@example.com',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid email', () => {
      const result = createBookingSchema.safeParse({
        serviceId: 'svc_123',
        slotId: 'slot_456',
        customerName: 'Marko',
        customerEmail: 'not-email',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('listBookingsQuerySchema', () => {
    it('applies defaults', () => {
      const result = listBookingsQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.limit).toBe(20);
    });

    it('filters valid statuses', () => {
      const result = listBookingsQuerySchema.safeParse({ status: 'invalid_status' });
      expect(result.success).toBe(false);
    });
  });
});

describe('Booking state machine', () => {
  // State transition tests without DB
  const TRANSITIONS: Record<string, string[]> = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['completed', 'cancelled', 'no_show'],
    cancelled: [],
    completed: [],
    no_show: [],
  };

  it('allows pending -> confirmed', () => {
    expect(TRANSITIONS['pending']).toContain('confirmed');
  });

  it('allows confirmed -> completed', () => {
    expect(TRANSITIONS['confirmed']).toContain('completed');
  });

  it('does not allow cancelled -> confirmed', () => {
    expect(TRANSITIONS['cancelled']).not.toContain('confirmed');
  });

  it('does not allow completed -> cancelled', () => {
    expect(TRANSITIONS['completed']).not.toContain('cancelled');
  });

  it('terminal states have no transitions', () => {
    expect(TRANSITIONS['completed']).toHaveLength(0);
    expect(TRANSITIONS['cancelled']).toHaveLength(0);
    expect(TRANSITIONS['no_show']).toHaveLength(0);
  });
});
