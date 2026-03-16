import { z } from 'zod';

const timeSlotSchema = z.object({
  start: z.string().regex(/^\d{2}:\d{2}$/, 'Format: HH:mm'),
  end: z.string().regex(/^\d{2}:\d{2}$/, 'Format: HH:mm'),
});

const weeklyRuleSchema = z.object({
  day: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
  open: z.boolean(),
  slots: z.array(timeSlotSchema).default([]),
});

const scheduleExceptionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format: YYYY-MM-DD'),
  open: z.boolean(),
  slots: z.array(timeSlotSchema).optional(),
  reason: z.string().optional(),
});

export const createScheduleSchema = z.object({
  providerId: z.string().min(1),
  serviceId: z.string().optional(),
  resourceId: z.string().optional(),
  name: z.string().default('Default'),
  timezone: z.string().default('UTC'),
  weeklyRules: z.array(weeklyRuleSchema).default([]),
  exceptions: z.array(scheduleExceptionSchema).default([]),
  effectiveFrom: z.string().datetime().optional(),
  effectiveTo: z.string().datetime().optional(),
});

export const updateScheduleSchema = createScheduleSchema.partial();

export type CreateScheduleInput = z.infer<typeof createScheduleSchema>;
export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>;
