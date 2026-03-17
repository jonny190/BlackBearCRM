import { z } from 'zod';

export const createActivitySchema = z.object({
  account_id: z.string().uuid(),
  contact_id: z.string().uuid().nullable().optional(),
  type: z.enum(['meeting', 'email', 'call', 'note', 'proposal', 'follow_up']),
  title: z.string().min(1).max(255),
  description: z.string().nullable().optional(),
  occurred_at: z.string().datetime(),
  metadata: z.record(z.unknown()).optional(),
});

export const updateActivitySchema = createActivitySchema.partial().omit({ account_id: true });

export const activityQuerySchema = z.object({
  account_id: z.string().uuid().optional(),
  type: z.enum(['meeting', 'email', 'call', 'note', 'proposal', 'follow_up']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
  sort: z.string().default('occurred_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
});
