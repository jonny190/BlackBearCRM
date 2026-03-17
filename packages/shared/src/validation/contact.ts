import { z } from 'zod';

export const createContactSchema = z.object({
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  email: z.string().email().nullable().optional(),
  phone: z.string().max(50).nullable().optional(),
  title: z.string().min(1).max(200),
  role_level: z.enum(['executive', 'director', 'manager', 'individual']),
  influence_score: z.number().int().min(0).max(100).optional(),
  is_primary: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const updateContactSchema = createContactSchema.partial();

export const contactQuerySchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
  sort: z.string().default('last_name'),
  order: z.enum(['asc', 'desc']).default('asc'),
});
