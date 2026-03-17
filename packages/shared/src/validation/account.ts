import { z } from 'zod';

export const createAccountSchema = z.object({
  name: z.string().min(1).max(255),
  industry: z.string().min(1).max(100),
  tier: z.enum(['enterprise', 'mid_market', 'smb']),
  website: z.string().url().nullable().optional(),
  status: z.enum(['active', 'inactive', 'churned', 'prospect']).optional(),
  owner_id: z.string().uuid().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const updateAccountSchema = createAccountSchema.partial();

export const accountQuerySchema = z.object({
  q: z.string().optional(),
  industry: z.string().optional(),
  tier: z.enum(['enterprise', 'mid_market', 'smb']).optional(),
  status: z.enum(['active', 'inactive', 'churned', 'prospect']).optional(),
  owner_id: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
  sort: z.string().default('name'),
  order: z.enum(['asc', 'desc']).default('asc'),
});
