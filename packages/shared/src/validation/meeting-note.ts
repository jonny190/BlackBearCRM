import { z } from 'zod';

export const createMeetingNoteSchema = z.object({
  contact_id: z.string().uuid().nullable().optional(),
  title: z.string().min(1).max(255),
  raw_notes: z.string().min(1),
  meeting_date: z.string().datetime(),
  participants: z.array(z.object({
    name: z.string().min(1),
    role: z.string().optional(),
  })).optional().default([]),
});

export const updateMeetingNoteSchema = createMeetingNoteSchema.partial();

export const meetingNoteQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
  sort: z.string().default('meeting_date'),
  order: z.enum(['asc', 'desc']).default('desc'),
});
