# AI-Powered Meeting Notes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add meeting notes to account detail pages with async AI processing that extracts structured insights and feeds into health scoring.

**Architecture:** New `meetings` backend module (routes/service/queries) + Bull queue worker for AI processing + new frontend components as a tab on AccountDetailPage. Extends existing AI provider abstraction and health scoring pipeline.

**Tech Stack:** Express, Knex, Bull, Zod, React, MUI, RTK Query, react-hook-form, Socket.io

**Spec:** `docs/superpowers/specs/2026-03-18-meeting-notes-design.md`

---

## File Map

### New Files
| File | Responsibility |
|------|---------------|
| `packages/shared/src/types/meeting-note.ts` | MeetingNote and ProcessedCustomerNote type definitions |
| `packages/shared/src/validation/meeting-note.ts` | Zod schemas for create/update/query |
| `packages/server/src/core/database/migrations/010_create_meeting_notes.ts` | DB tables: meeting_notes + processed_customer_notes |
| `packages/server/src/modules/meetings/meetings.queries.ts` | Knex query functions for both tables |
| `packages/server/src/modules/meetings/meetings.service.ts` | Business logic, RBAC, queue dispatch |
| `packages/server/src/modules/meetings/meetings.routes.ts` | Express routers (account-scoped + standalone) |
| `packages/server/src/modules/meetings/ai-notes-processor.ts` | Queue worker: AI extraction logic |
| `packages/client/src/store/api/meetingsApi.ts` | RTK Query endpoints |
| `packages/client/src/features/meetings/MeetingNotesList.tsx` | List component with status chips |
| `packages/client/src/features/meetings/MeetingNotesForm.tsx` | Dialog form for create/edit |
| `packages/client/src/features/meetings/ProcessedInsights.tsx` | AI insights display grouped by type |

### Modified Files
| File | Change |
|------|--------|
| `packages/shared/src/types/index.ts` | Add `export * from './meeting-note.js'` |
| `packages/shared/src/validation/index.ts` | Add `export * from './meeting-note.js'` |
| `packages/server/src/core/queue/health-queue.ts` | Add `meetingsQueue` export |
| `packages/server/src/worker.ts` | Register `processMeetingNote` queue processor |
| `packages/server/src/app.ts` | Mount meeting note routes |
| `packages/client/src/store/api/baseApi.ts` | Add `MeetingNote` and `Insight` tag types |
| `packages/client/src/features/accounts/AccountDetailPage.tsx` | Add Meeting Notes tab |
| `packages/client/src/hooks/useSocket.ts` | Add `meeting-note:processed` listener |

---

## Task 1: Shared Types and Validation

**Files:**
- Create: `packages/shared/src/types/meeting-note.ts`
- Create: `packages/shared/src/validation/meeting-note.ts`
- Modify: `packages/shared/src/types/index.ts`
- Modify: `packages/shared/src/validation/index.ts`

- [ ] **Step 1: Create the meeting note types**

```typescript
// packages/shared/src/types/meeting-note.ts
export type MeetingNoteStatus = 'processing' | 'processed' | 'failed';

export interface MeetingNote {
  id: string;
  account_id: string;
  contact_id: string | null;
  user_id: string;
  title: string;
  raw_notes: string;
  meeting_date: string;
  participants: Array<{ name: string; role?: string }>;
  status: MeetingNoteStatus;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type ProcessedNoteType = 'insight' | 'action_item' | 'concern' | 'follow_up' | 'sentiment';

export interface ProcessedCustomerNote {
  id: string;
  meeting_note_id: string;
  account_id: string;
  note_type: ProcessedNoteType;
  content: string;
  confidence_score: number;
  created_at: string;
}
```

- [ ] **Step 2: Create the validation schemas**

```typescript
// packages/shared/src/validation/meeting-note.ts
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
```

- [ ] **Step 3: Export from shared index files**

Add to `packages/shared/src/types/index.ts`:
```typescript
export * from './meeting-note.js';
```

Add to `packages/shared/src/validation/index.ts`:
```typescript
export * from './meeting-note.js';
```

- [ ] **Step 4: Build shared package to verify**

Run: `cd packages/shared && npm run build`
Expected: Successful compilation, no errors

- [ ] **Step 5: Commit**

```bash
git add packages/shared/src/types/meeting-note.ts packages/shared/src/validation/meeting-note.ts packages/shared/src/types/index.ts packages/shared/src/validation/index.ts
git commit -m "feat(shared): add MeetingNote types and validation schemas"
```

---

## Task 2: Database Migration

**Files:**
- Create: `packages/server/src/core/database/migrations/010_create_meeting_notes.ts`

- [ ] **Step 1: Create the migration file**

```typescript
// packages/server/src/core/database/migrations/010_create_meeting_notes.ts
import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('meeting_notes', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('account_id').notNullable().references('id').inTable('accounts').onDelete('CASCADE');
    t.uuid('contact_id').references('id').inTable('contacts').onDelete('SET NULL');
    t.uuid('user_id').notNullable().references('id').inTable('users');
    t.string('title').notNullable();
    t.text('raw_notes').notNullable();
    t.timestamp('meeting_date').notNullable();
    t.jsonb('participants').defaultTo('[]');
    t.string('status', 20).notNullable().defaultTo('processing');
    t.timestamp('processed_at');
    t.timestamps(true, true);

    t.index('account_id', 'idx_meeting_notes_account_id');
    t.index('meeting_date', 'idx_meeting_notes_meeting_date');
    t.index('user_id', 'idx_meeting_notes_user_id');
  });

  await knex.schema.createTable('processed_customer_notes', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('meeting_note_id').notNullable().references('id').inTable('meeting_notes').onDelete('CASCADE');
    t.uuid('account_id').notNullable().references('id').inTable('accounts').onDelete('CASCADE');
    t.string('note_type', 50).notNullable();
    t.text('content').notNullable();
    t.float('confidence_score').notNullable();
    t.timestamp('created_at').defaultTo(knex.fn.now());

    t.index('meeting_note_id', 'idx_processed_notes_meeting_note_id');
    t.index('account_id', 'idx_processed_notes_account_id');
    t.index('note_type', 'idx_processed_notes_type');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('processed_customer_notes');
  await knex.schema.dropTableIfExists('meeting_notes');
}
```

- [ ] **Step 2: Run the migration**

Run: `cd packages/server && npx knex migrate:latest`
Expected: Migration 010 runs successfully, both tables created

- [ ] **Step 3: Commit**

```bash
git add packages/server/src/core/database/migrations/010_create_meeting_notes.ts
git commit -m "feat(db): add meeting_notes and processed_customer_notes tables"
```

---

## Task 3: Backend Queries

**Files:**
- Create: `packages/server/src/modules/meetings/meetings.queries.ts`

- [ ] **Step 1: Create the queries file**

```typescript
// packages/server/src/modules/meetings/meetings.queries.ts
import { db } from '../../core/database/connection.js';
import type { MeetingNote, ProcessedCustomerNote } from '@blackbear/shared';

export interface MeetingNoteListParams {
  ownerFilter?: string;
  page: number;
  limit: number;
  sort: string;
  order: 'asc' | 'desc';
}

export async function listMeetingNotes(accountId: string, params: MeetingNoteListParams) {
  const { ownerFilter, page, limit, sort, order } = params;
  const offset = (page - 1) * limit;

  let query = db('meeting_notes').where('meeting_notes.account_id', accountId);

  if (ownerFilter) {
    query = query.whereIn(
      'meeting_notes.account_id',
      db('accounts').where('owner_id', ownerFilter).select('id'),
    );
  }

  const countQuery = query.clone().count('* as count');
  const [{ count }] = await countQuery;
  const total = Number(count);

  const rows = await query
    .select('meeting_notes.*')
    .orderBy(`meeting_notes.${sort}`, order)
    .limit(limit)
    .offset(offset);

  return {
    data: rows as MeetingNote[],
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getMeetingNoteById(id: string) {
  return db('meeting_notes').where({ id }).first() as Promise<MeetingNote | undefined>;
}

export async function createMeetingNote(data: Partial<MeetingNote> & { account_id: string; user_id: string }) {
  const [note] = await db('meeting_notes')
    .insert({
      ...data,
      participants: JSON.stringify(data.participants ?? []),
    })
    .returning('*');
  return note as MeetingNote;
}

export async function updateMeetingNote(id: string, data: Partial<MeetingNote>) {
  const updateData: Record<string, unknown> = { ...data, updated_at: db.fn.now() };
  if (data.participants) {
    updateData.participants = JSON.stringify(data.participants);
  }
  const [note] = await db('meeting_notes')
    .where({ id })
    .update(updateData)
    .returning('*');
  return note as MeetingNote;
}

export async function deleteMeetingNote(id: string) {
  return db('meeting_notes').where({ id }).delete();
}

export async function getProcessedNotes(meetingNoteId: string) {
  return db('processed_customer_notes')
    .where({ meeting_note_id: meetingNoteId })
    .orderBy('note_type')
    .select('*') as Promise<ProcessedCustomerNote[]>;
}

export async function insertProcessedNotes(notes: Array<Omit<ProcessedCustomerNote, 'id' | 'created_at'>>) {
  return db('processed_customer_notes').insert(notes).returning('*') as Promise<ProcessedCustomerNote[]>;
}

export async function deleteProcessedNotes(meetingNoteId: string) {
  return db('processed_customer_notes').where({ meeting_note_id: meetingNoteId }).delete();
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/server/src/modules/meetings/meetings.queries.ts
git commit -m "feat(meetings): add database query functions"
```

---

## Task 4: Meetings Queue

**Files:**
- Modify: `packages/server/src/core/queue/health-queue.ts`

- [ ] **Step 1: Add meetingsQueue to existing queue file**

Add to `packages/server/src/core/queue/health-queue.ts` after the existing exports:

```typescript
export const meetingsQueue = new Bull('meeting-notes-processing', config.REDIS_URL);
```

- [ ] **Step 2: Commit**

```bash
git add packages/server/src/core/queue/health-queue.ts
git commit -m "feat(queue): add meetingsQueue for AI note processing"
```

---

## Task 5: AI Notes Processor

**Files:**
- Create: `packages/server/src/modules/meetings/ai-notes-processor.ts`

- [ ] **Step 1: Create the AI processor**

```typescript
// packages/server/src/modules/meetings/ai-notes-processor.ts
import { db } from '../../core/database/connection.js';
import { getAiProvider } from '../ai/ai.service.js';
import { healthQueue } from '../../core/queue/health-queue.js';
import { publishSocketEvent } from '../../core/websocket/socket.js';
import { logger } from '../../core/logger.js';
import {
  getMeetingNoteById,
  updateMeetingNote,
  insertProcessedNotes,
  deleteProcessedNotes,
} from './meetings.queries.js';
import type { ProcessedNoteType } from '@blackbear/shared';

interface ExtractedNote {
  type: ProcessedNoteType;
  content: string;
  confidence: number;
}

export async function processMeetingNote(meetingNoteId: string): Promise<void> {
  const note = await getMeetingNoteById(meetingNoteId);
  if (!note) {
    logger.warn({ meetingNoteId }, 'Meeting note not found for processing');
    return;
  }

  const provider = await getAiProvider();
  if (!provider) {
    await updateMeetingNote(meetingNoteId, { status: 'failed' });
    logger.warn({ meetingNoteId }, 'AI provider not configured, marking as failed');
    return;
  }

  try {
    const account = await db('accounts').where({ id: note.account_id }).first();
    const accountContext = account
      ? `Account: ${account.name}, Industry: ${account.industry ?? 'N/A'}, Tier: ${account.tier ?? 'N/A'}`
      : 'Account context unavailable';

    const prompt = `You are a CRM analyst for Black Pear CRM. Analyze the following meeting notes and extract structured insights.

${accountContext}
Meeting Title: ${note.title}
Meeting Date: ${note.meeting_date}
Participants: ${JSON.stringify(note.participants)}

Meeting Notes:
${note.raw_notes}

Extract key information and return ONLY a JSON array of objects. Each object must have:
- "type": one of "insight", "action_item", "concern", "follow_up", "sentiment"
- "content": a concise 1-2 sentence description
- "confidence": a number between 0 and 1 indicating your confidence

Example format:
[{"type": "action_item", "content": "Schedule follow-up demo for the analytics module by end of week", "confidence": 0.9}]

Return ONLY the JSON array, no other text.`;

    const response = await provider.generateText(prompt, { maxTokens: 1500, temperature: 0.3 });

    // Parse JSON from the response, handling potential markdown code blocks
    let jsonStr = response.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const extracted: ExtractedNote[] = JSON.parse(jsonStr);

    if (!Array.isArray(extracted) || extracted.length === 0) {
      throw new Error('AI returned empty or invalid array');
    }

    // Validate and filter valid entries
    const validTypes: ProcessedNoteType[] = ['insight', 'action_item', 'concern', 'follow_up', 'sentiment'];
    const validNotes = extracted
      .filter((e) => validTypes.includes(e.type) && typeof e.content === 'string' && e.content.length > 0)
      .map((e) => ({
        meeting_note_id: meetingNoteId,
        account_id: note.account_id,
        note_type: e.type,
        content: e.content,
        confidence_score: Math.max(0, Math.min(1, Number(e.confidence) || 0.5)),
      }));

    if (validNotes.length === 0) {
      throw new Error('No valid notes extracted from AI response');
    }

    // Clear any previous processed notes and insert new ones
    await deleteProcessedNotes(meetingNoteId);
    await insertProcessedNotes(validNotes);

    await updateMeetingNote(meetingNoteId, {
      status: 'processed',
      processed_at: new Date().toISOString(),
    });

    // Trigger health recalculation
    await healthQueue.add('calculateAccountHealth', { accountId: note.account_id });

    // Notify connected clients
    await publishSocketEvent('meeting-note:processed', { accountId: note.account_id, meetingNoteId });

    logger.info({ meetingNoteId, extractedCount: validNotes.length }, 'Meeting note processed successfully');
  } catch (err) {
    logger.error({ err, meetingNoteId }, 'Failed to process meeting note');
    throw err; // Let Bull handle retry
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/server/src/modules/meetings/ai-notes-processor.ts
git commit -m "feat(meetings): add AI notes processor for queue worker"
```

---

## Task 6: Meetings Service

**Files:**
- Create: `packages/server/src/modules/meetings/meetings.service.ts`

- [ ] **Step 1: Create the service**

```typescript
// packages/server/src/modules/meetings/meetings.service.ts
import { NotFoundError, ForbiddenError } from '../../core/helpers/errors.js';
import { getAccountById } from '../accounts/accounts.queries.js';
import { meetingsQueue } from '../../core/queue/health-queue.js';
import { publishSocketEvent } from '../../core/websocket/socket.js';
import {
  listMeetingNotes as queryListMeetingNotes,
  getMeetingNoteById,
  createMeetingNote as queryCreateMeetingNote,
  updateMeetingNote as queryUpdateMeetingNote,
  deleteMeetingNote as queryDeleteMeetingNote,
  getProcessedNotes as queryGetProcessedNotes,
  deleteProcessedNotes,
  type MeetingNoteListParams,
} from './meetings.queries.js';
import type { MeetingNote } from '@blackbear/shared';

async function checkAccountAccess(accountId: string, userId: string, role: string) {
  const account = await getAccountById(accountId);
  if (!account) throw new NotFoundError('Account', accountId);

  if (role === 'manager' && account.owner_id !== userId) {
    throw new ForbiddenError('You do not have access to this account');
  }

  return account;
}

export async function listMeetingNotes(
  accountId: string,
  params: MeetingNoteListParams,
  userId: string,
  role: string,
) {
  await checkAccountAccess(accountId, userId, role);

  if (role === 'manager') {
    params.ownerFilter = userId;
  }

  return queryListMeetingNotes(accountId, params);
}

export async function createMeetingNote(
  accountId: string,
  data: Partial<MeetingNote>,
  userId: string,
  role: string,
) {
  await checkAccountAccess(accountId, userId, role);

  const note = await queryCreateMeetingNote({
    ...data,
    account_id: accountId,
    user_id: userId,
    status: 'processing',
  });

  // Queue AI processing
  await meetingsQueue.add('processMeetingNote', { meetingNoteId: note.id }, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
  });

  await publishSocketEvent('meeting-note:created', { accountId, meetingNote: note });

  return note;
}

export async function updateMeetingNote(
  id: string,
  data: Partial<MeetingNote>,
  userId: string,
  role: string,
) {
  const note = await getMeetingNoteById(id);
  if (!note) throw new NotFoundError('MeetingNote', id);

  if (role === 'manager') {
    await checkAccountAccess(note.account_id, userId, role);
    if (note.user_id !== userId) {
      throw new ForbiddenError('You can only edit your own meeting notes');
    }
  }

  const notesChanged = data.raw_notes && data.raw_notes !== note.raw_notes;

  const updateData: Partial<MeetingNote> = { ...data };
  if (notesChanged) {
    updateData.status = 'processing';
    updateData.processed_at = null;
  }

  const updated = await queryUpdateMeetingNote(id, updateData);

  if (notesChanged) {
    await deleteProcessedNotes(id);
    await meetingsQueue.add('processMeetingNote', { meetingNoteId: id }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
    });
  }

  await publishSocketEvent('meeting-note:updated', { accountId: note.account_id, meetingNote: updated });

  return updated;
}

export async function deleteMeetingNote(id: string, userId: string, role: string) {
  const note = await getMeetingNoteById(id);
  if (!note) throw new NotFoundError('MeetingNote', id);

  if (role !== 'admin') {
    if (note.user_id !== userId) {
      throw new ForbiddenError('You can only delete your own meeting notes');
    }
    if (role === 'manager') {
      await checkAccountAccess(note.account_id, userId, role);
    }
  }

  await queryDeleteMeetingNote(id);
}

export async function reprocessMeetingNote(id: string, userId: string, role: string) {
  const note = await getMeetingNoteById(id);
  if (!note) throw new NotFoundError('MeetingNote', id);

  await checkAccountAccess(note.account_id, userId, role);

  await deleteProcessedNotes(id);
  await queryUpdateMeetingNote(id, { status: 'processing', processed_at: null });

  await meetingsQueue.add('processMeetingNote', { meetingNoteId: id }, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
  });

  return { message: 'Processing queued' };
}

export async function getInsights(id: string, userId: string, role: string) {
  const note = await getMeetingNoteById(id);
  if (!note) throw new NotFoundError('MeetingNote', id);

  await checkAccountAccess(note.account_id, userId, role);

  return queryGetProcessedNotes(id);
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/server/src/modules/meetings/meetings.service.ts
git commit -m "feat(meetings): add service with RBAC and queue dispatch"
```

---

## Task 7: Meetings Routes

**Files:**
- Create: `packages/server/src/modules/meetings/meetings.routes.ts`

- [ ] **Step 1: Create the routes file**

```typescript
// packages/server/src/modules/meetings/meetings.routes.ts
import { Router, Request } from 'express';
import { createMeetingNoteSchema, updateMeetingNoteSchema, meetingNoteQuerySchema } from '@blackbear/shared';
import { authenticate } from '../../core/middleware/auth.js';
import { validateBody, validateQuery } from '../../core/middleware/validate.js';
import { sendSuccess, sendCreated, sendNoContent } from '../../core/helpers/response.js';
import * as meetingsService from './meetings.service.js';

// Account-scoped router: mergeParams so we get :id from /api/accounts/:id/meeting-notes
interface AccountMeetingRequest extends Request {
  params: { id: string };
}

const meetingNotesAccountRouter = Router({ mergeParams: true });
meetingNotesAccountRouter.use(authenticate);

meetingNotesAccountRouter.get('/', validateQuery(meetingNoteQuerySchema), async (req: AccountMeetingRequest, res, next) => {
  try {
    const result = await meetingsService.listMeetingNotes(
      req.params.id,
      req.query as any,
      req.user!.userId,
      req.user!.role,
    );
    sendSuccess(res, result.data, result.meta);
  } catch (err) {
    next(err);
  }
});

meetingNotesAccountRouter.post('/', validateBody(createMeetingNoteSchema), async (req: AccountMeetingRequest, res, next) => {
  try {
    const note = await meetingsService.createMeetingNote(
      req.params.id,
      req.body,
      req.user!.userId,
      req.user!.role,
    );
    sendCreated(res, note);
  } catch (err) {
    next(err);
  }
});

// Standalone router for operations on individual meeting notes
const meetingNotesRouter = Router();
meetingNotesRouter.use(authenticate);

meetingNotesRouter.put('/:id', validateBody(updateMeetingNoteSchema), async (req, res, next) => {
  try {
    const note = await meetingsService.updateMeetingNote(
      req.params.id,
      req.body,
      req.user!.userId,
      req.user!.role,
    );
    sendSuccess(res, note);
  } catch (err) {
    next(err);
  }
});

meetingNotesRouter.delete('/:id', async (req, res, next) => {
  try {
    await meetingsService.deleteMeetingNote(req.params.id, req.user!.userId, req.user!.role);
    sendNoContent(res);
  } catch (err) {
    next(err);
  }
});

meetingNotesRouter.post('/:id/process', async (req, res, next) => {
  try {
    const result = await meetingsService.reprocessMeetingNote(req.params.id, req.user!.userId, req.user!.role);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

meetingNotesRouter.get('/:id/insights', async (req, res, next) => {
  try {
    const insights = await meetingsService.getInsights(req.params.id, req.user!.userId, req.user!.role);
    sendSuccess(res, insights);
  } catch (err) {
    next(err);
  }
});

export { meetingNotesAccountRouter, meetingNotesRouter };
```

- [ ] **Step 2: Commit**

```bash
git add packages/server/src/modules/meetings/meetings.routes.ts
git commit -m "feat(meetings): add Express routes with mergeParams"
```

---

## Task 8: Register Routes and Worker

**Files:**
- Modify: `packages/server/src/app.ts`
- Modify: `packages/server/src/worker.ts`

- [ ] **Step 1: Add route imports and mounts to app.ts**

Add import near the top with the other route imports:
```typescript
import { meetingNotesAccountRouter, meetingNotesRouter } from './modules/meetings/meetings.routes.js';
```

Add route mounts after the existing `app.use('/api/activities', activityRoutes);` line:
```typescript
app.use('/api/accounts/:id/meeting-notes', meetingNotesAccountRouter);
app.use('/api/meeting-notes', meetingNotesRouter);
```

- [ ] **Step 2: Register queue processor in worker.ts**

Add import at the top of `packages/server/src/worker.ts`:
```typescript
import { meetingsQueue } from './core/queue/health-queue.js';
import { processMeetingNote } from './modules/meetings/ai-notes-processor.js';
```

Update the existing `healthQueue` import to also include `meetingsQueue`:
```typescript
import { healthQueue, alertQueue, meetingsQueue } from './core/queue/health-queue.js';
```

Add processor section before the scheduled jobs section:
```typescript
// ---------------------------------------------------------------------------
// Meeting notes queue processors
// ---------------------------------------------------------------------------

meetingsQueue.process('processMeetingNote', async (job) => {
  const { meetingNoteId } = job.data as { meetingNoteId: string };
  logger.info({ meetingNoteId }, 'Processing meeting note with AI');
  try {
    await processMeetingNote(meetingNoteId);
    logger.info({ meetingNoteId }, 'Meeting note processed');
  } catch (err) {
    logger.error({ err, meetingNoteId }, 'Failed to process meeting note');
    throw err;
  }
});
```

- [ ] **Step 3: Build server to verify**

Run: `cd packages/server && npm run build`
Expected: Successful compilation

- [ ] **Step 4: Commit**

```bash
git add packages/server/src/app.ts packages/server/src/worker.ts
git commit -m "feat(meetings): register routes in app and queue processor in worker"
```

---

## Task 9: Frontend RTK Query API

**Files:**
- Create: `packages/client/src/store/api/meetingsApi.ts`
- Modify: `packages/client/src/store/api/baseApi.ts`

- [ ] **Step 1: Add tag types to baseApi.ts**

In `packages/client/src/store/api/baseApi.ts`, update the `tagTypes` array:

```typescript
tagTypes: ['Account', 'Contact', 'Activity', 'Health', 'Alert', 'Dashboard', 'User', 'AiSettings', 'Relationship', 'Integration', 'MeetingNote', 'Insight'],
```

- [ ] **Step 2: Create the meetings API**

```typescript
// packages/client/src/store/api/meetingsApi.ts
import { baseApi } from './baseApi';
import type { MeetingNote, ProcessedCustomerNote, ApiResponse, PaginationMeta } from '@blackbear/shared';

export const meetingsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getMeetingNotes: build.query<{ data: MeetingNote[]; meta: PaginationMeta }, { accountId: string; params?: Record<string, any> }>({
      query: ({ accountId, params }) => ({ url: `/accounts/${accountId}/meeting-notes`, params }),
      providesTags: (result) =>
        result
          ? [...result.data.map((n) => ({ type: 'MeetingNote' as const, id: n.id })), 'MeetingNote']
          : ['MeetingNote'],
    }),
    createMeetingNote: build.mutation<ApiResponse<MeetingNote>, { accountId: string; data: Partial<MeetingNote> }>({
      query: ({ accountId, data }) => ({ url: `/accounts/${accountId}/meeting-notes`, method: 'POST', body: data }),
      invalidatesTags: ['MeetingNote'],
    }),
    updateMeetingNote: build.mutation<ApiResponse<MeetingNote>, { id: string; data: Partial<MeetingNote> }>({
      query: ({ id, data }) => ({ url: `/meeting-notes/${id}`, method: 'PUT', body: data }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'MeetingNote', id }, 'MeetingNote'],
    }),
    deleteMeetingNote: build.mutation<void, string>({
      query: (id) => ({ url: `/meeting-notes/${id}`, method: 'DELETE' }),
      invalidatesTags: ['MeetingNote'],
    }),
    processMeetingNote: build.mutation<ApiResponse<{ message: string }>, string>({
      query: (id) => ({ url: `/meeting-notes/${id}/process`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [{ type: 'MeetingNote', id }],
    }),
    getMeetingNoteInsights: build.query<{ data: ProcessedCustomerNote[] }, string>({
      query: (id) => ({ url: `/meeting-notes/${id}/insights` }),
      providesTags: (_r, _e, id) => [{ type: 'Insight', id }],
    }),
  }),
});

export const {
  useGetMeetingNotesQuery,
  useCreateMeetingNoteMutation,
  useUpdateMeetingNoteMutation,
  useDeleteMeetingNoteMutation,
  useProcessMeetingNoteMutation,
  useGetMeetingNoteInsightsQuery,
} = meetingsApi;
```

- [ ] **Step 3: Commit**

```bash
git add packages/client/src/store/api/baseApi.ts packages/client/src/store/api/meetingsApi.ts
git commit -m "feat(client): add RTK Query endpoints for meeting notes"
```

---

## Task 10: WebSocket Listener

**Files:**
- Modify: `packages/client/src/hooks/useSocket.ts`

- [ ] **Step 1: Add meeting-note:processed listener**

Add after the existing `socket.on('activity:created', ...)` block in `packages/client/src/hooks/useSocket.ts`:

```typescript
socket.on('meeting-note:processed', ({ accountId }: { accountId: string }) => {
  dispatch(baseApi.util.invalidateTags(['MeetingNote', 'Insight', { type: 'Health', id: accountId }]));
});

socket.on('meeting-note:created', () => {
  dispatch(baseApi.util.invalidateTags(['MeetingNote']));
});
```

- [ ] **Step 2: Commit**

```bash
git add packages/client/src/hooks/useSocket.ts
git commit -m "feat(client): add WebSocket listeners for meeting note events"
```

---

## Task 11: ProcessedInsights Component

**Files:**
- Create: `packages/client/src/features/meetings/ProcessedInsights.tsx`

- [ ] **Step 1: Create the component**

```tsx
// packages/client/src/features/meetings/ProcessedInsights.tsx
import { Box, Chip, Typography, CircularProgress, Card, CardContent } from '@mui/material';
import { useGetMeetingNoteInsightsQuery } from '../../store/api/meetingsApi';
import type { MeetingNoteStatus, ProcessedNoteType } from '@blackbear/shared';

const TYPE_CONFIG: Record<ProcessedNoteType, { label: string; color: 'primary' | 'error' | 'success' | 'warning' | 'secondary' }> = {
  action_item: { label: 'Action Item', color: 'primary' },
  concern: { label: 'Concern', color: 'error' },
  insight: { label: 'Insight', color: 'success' },
  follow_up: { label: 'Follow-up', color: 'warning' },
  sentiment: { label: 'Sentiment', color: 'secondary' },
};

interface Props {
  meetingNoteId: string;
  status: MeetingNoteStatus;
}

export function ProcessedInsights({ meetingNoteId, status }: Props) {
  const { data, isLoading } = useGetMeetingNoteInsightsQuery(meetingNoteId, {
    skip: status !== 'processed',
  });

  if (status === 'processing') {
    return (
      <Box display="flex" alignItems="center" gap={1} py={1}>
        <CircularProgress size={16} />
        <Typography variant="body2" color="text.secondary">Processing with AI...</Typography>
      </Box>
    );
  }

  if (status === 'failed') {
    return (
      <Typography variant="body2" color="error" py={1}>
        AI processing failed. Use the retry button to try again.
      </Typography>
    );
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" py={1}>
        <CircularProgress size={16} />
      </Box>
    );
  }

  const insights = data?.data ?? [];
  if (insights.length === 0) return null;

  // Group by type
  const grouped = insights.reduce<Record<string, typeof insights>>((acc, note) => {
    (acc[note.note_type] ??= []).push(note);
    return acc;
  }, {});

  return (
    <Box display="flex" flexDirection="column" gap={1} py={1}>
      {Object.entries(grouped).map(([type, notes]) => {
        const config = TYPE_CONFIG[type as ProcessedNoteType];
        return (
          <Card key={type} variant="outlined" sx={{ bgcolor: 'action.hover' }}>
            <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
              <Chip label={config.label} color={config.color} size="small" sx={{ mb: 0.5 }} />
              {notes.map((n) => (
                <Typography key={n.id} variant="body2" sx={{ mt: 0.5, opacity: 0.7 + n.confidence_score * 0.3 }}>
                  {n.content}
                </Typography>
              ))}
            </CardContent>
          </Card>
        );
      })}
    </Box>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/client/src/features/meetings/ProcessedInsights.tsx
git commit -m "feat(client): add ProcessedInsights component for AI results"
```

---

## Task 12: MeetingNotesForm Component

**Files:**
- Create: `packages/client/src/features/meetings/MeetingNotesForm.tsx`

- [ ] **Step 1: Create the form component**

```tsx
// packages/client/src/features/meetings/MeetingNotesForm.tsx
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, FormControl, InputLabel, Select, MenuItem, Chip, Box, IconButton } from '@mui/material';
import { Add, Close } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createMeetingNoteSchema } from '@blackbear/shared';
import { useState } from 'react';
import type { Contact } from '@blackbear/shared';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  defaultValues?: any;
  contacts: Contact[];
  isLoading?: boolean;
}

export function MeetingNotesForm({ open, onClose, onSubmit, defaultValues, contacts, isLoading }: Props) {
  const [participantName, setParticipantName] = useState('');
  const { control, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    resolver: zodResolver(createMeetingNoteSchema),
    defaultValues: defaultValues ?? {
      title: '',
      raw_notes: '',
      meeting_date: new Date().toISOString().slice(0, 16),
      contact_id: null,
      participants: [],
    },
  });

  const participants = watch('participants') ?? [];

  const addParticipant = () => {
    if (participantName.trim()) {
      setValue('participants', [...participants, { name: participantName.trim() }]);
      setParticipantName('');
    }
  };

  const removeParticipant = (index: number) => {
    setValue('participants', participants.filter((_: unknown, i: number) => i !== index));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>{defaultValues ? 'Edit Meeting Note' : 'New Meeting Note'}</DialogTitle>
        <DialogContent>
          <Controller name="title" control={control} render={({ field }) =>
            <TextField {...field} fullWidth label="Title" margin="normal" error={!!errors.title}
              helperText={errors.title?.message as string} />} />
          <Controller name="meeting_date" control={control} render={({ field }) =>
            <TextField {...field} fullWidth label="Meeting Date" type="datetime-local" margin="normal"
              InputLabelProps={{ shrink: true }} error={!!errors.meeting_date} />} />
          <Controller name="contact_id" control={control} render={({ field }) =>
            <FormControl fullWidth margin="normal">
              <InputLabel>Primary Contact</InputLabel>
              <Select {...field} value={field.value ?? ''} label="Primary Contact"
                onChange={(e) => field.onChange(e.target.value || null)}>
                <MenuItem value="">None</MenuItem>
                {contacts.map((c) => (
                  <MenuItem key={c.id} value={c.id}>{c.first_name} {c.last_name}</MenuItem>
                ))}
              </Select>
            </FormControl>} />

          <Box mt={1} mb={1}>
            <Box display="flex" gap={1} alignItems="center">
              <TextField size="small" label="Add Participant" value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addParticipant(); } }} />
              <IconButton size="small" onClick={addParticipant}><Add /></IconButton>
            </Box>
            <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.5}>
              {participants.map((p: { name: string }, i: number) => (
                <Chip key={i} label={p.name} size="small" onDelete={() => removeParticipant(i)}
                  deleteIcon={<Close fontSize="small" />} />
              ))}
            </Box>
          </Box>

          <Controller name="raw_notes" control={control} render={({ field }) =>
            <TextField {...field} fullWidth label="Meeting Notes" margin="normal" multiline rows={8}
              error={!!errors.raw_notes} helperText={errors.raw_notes?.message as string}
              placeholder="Enter your meeting notes here. AI will automatically extract insights, action items, and follow-ups." />} />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isLoading}>Save</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/client/src/features/meetings/MeetingNotesForm.tsx
git commit -m "feat(client): add MeetingNotesForm dialog component"
```

---

## Task 13: MeetingNotesList Component

**Files:**
- Create: `packages/client/src/features/meetings/MeetingNotesList.tsx`

- [ ] **Step 1: Create the list component**

```tsx
// packages/client/src/features/meetings/MeetingNotesList.tsx
import { useState } from 'react';
import { List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, Chip, Button, Box, Collapse } from '@mui/material';
import { Edit, Delete, Add, Refresh, ExpandMore, ExpandLess } from '@mui/icons-material';
import { ProcessedInsights } from './ProcessedInsights';
import type { MeetingNote, MeetingNoteStatus } from '@blackbear/shared';

const STATUS_CONFIG: Record<MeetingNoteStatus, { label: string; color: 'default' | 'info' | 'success' | 'error' }> = {
  processing: { label: 'Processing', color: 'info' },
  processed: { label: 'Processed', color: 'success' },
  failed: { label: 'Failed', color: 'error' },
};

interface Props {
  notes: MeetingNote[];
  onAdd: () => void;
  onEdit: (note: MeetingNote) => void;
  onDelete: (id: string) => void;
  onReprocess: (id: string) => void;
}

export function MeetingNotesList({ notes, onAdd, onEdit, onDelete, onReprocess }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <>
      <Box display="flex" justifyContent="flex-end" mb={1}>
        <Button startIcon={<Add />} variant="outlined" size="small" onClick={onAdd}>Add Meeting Note</Button>
      </Box>
      <List>
        {notes.map((note) => {
          const statusConfig = STATUS_CONFIG[note.status];
          const isExpanded = expandedId === note.id;
          return (
            <Box key={note.id}>
              <ListItem divider sx={{ cursor: 'pointer' }} onClick={() => toggleExpand(note.id)}>
                <ListItemText
                  primary={note.title}
                  secondary={new Date(note.meeting_date).toLocaleDateString(undefined, {
                    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                  })}
                />
                <Chip label={statusConfig.label} color={statusConfig.color} size="small" sx={{ mr: 1 }} />
                <ListItemSecondaryAction>
                  {note.status === 'failed' && (
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); onReprocess(note.id); }} title="Retry processing">
                      <Refresh fontSize="small" />
                    </IconButton>
                  )}
                  {note.status === 'processed' && (
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); toggleExpand(note.id); }}>
                      {isExpanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                    </IconButton>
                  )}
                  <IconButton size="small" onClick={(e) => { e.stopPropagation(); onEdit(note); }}>
                    <Edit fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={(e) => { e.stopPropagation(); onDelete(note.id); }}>
                    <Delete fontSize="small" />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
              <Collapse in={isExpanded}>
                <Box px={2} pb={1}>
                  <ProcessedInsights meetingNoteId={note.id} status={note.status} />
                </Box>
              </Collapse>
            </Box>
          );
        })}
      </List>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/client/src/features/meetings/MeetingNotesList.tsx
git commit -m "feat(client): add MeetingNotesList with expandable insights"
```

---

## Task 14: Integrate into AccountDetailPage

**Files:**
- Modify: `packages/client/src/features/accounts/AccountDetailPage.tsx`

- [ ] **Step 1: Add imports**

Add at the top of `AccountDetailPage.tsx`:

```typescript
import { MeetingNotesList } from '../meetings/MeetingNotesList';
import { MeetingNotesForm } from '../meetings/MeetingNotesForm';
import {
  useGetMeetingNotesQuery,
  useCreateMeetingNoteMutation,
  useUpdateMeetingNoteMutation,
  useDeleteMeetingNoteMutation,
  useProcessMeetingNoteMutation,
} from '../../store/api/meetingsApi';
import type { MeetingNote } from '@blackbear/shared';
```

- [ ] **Step 2: Add state and queries inside the component**

After the existing activity dialog state block, add:

```typescript
// Meeting notes dialog state
const [meetingFormOpen, setMeetingFormOpen] = useState(false);
const [editingMeeting, setEditingMeeting] = useState<MeetingNote | null>(null);
```

After the existing data queries block, add:

```typescript
const { data: meetingNotesData } = useGetMeetingNotesQuery({ accountId: id! });
```

After the existing mutations block, add:

```typescript
const [createMeetingNote, { isLoading: creatingMeeting }] = useCreateMeetingNoteMutation();
const [updateMeetingNote, { isLoading: updatingMeeting }] = useUpdateMeetingNoteMutation();
const [deleteMeetingNote] = useDeleteMeetingNoteMutation();
const [processMeetingNote] = useProcessMeetingNoteMutation();
```

After the existing data destructuring, add:

```typescript
const meetingNotes = meetingNotesData?.data ?? [];
```

- [ ] **Step 3: Add handlers**

After the existing activity handlers, add:

```typescript
// Meeting note handlers
const handleAddMeeting = () => {
  setEditingMeeting(null);
  setMeetingFormOpen(true);
};

const handleEditMeeting = (note: MeetingNote) => {
  setEditingMeeting(note);
  setMeetingFormOpen(true);
};

const handleMeetingSubmit = async (data: any) => {
  if (editingMeeting) {
    await updateMeetingNote({ id: editingMeeting.id, data });
  } else {
    await createMeetingNote({ accountId: id!, data });
  }
  setMeetingFormOpen(false);
  setEditingMeeting(null);
};

const handleDeleteMeeting = async (meetingId: string) => {
  await deleteMeetingNote(meetingId);
};

const handleReprocessMeeting = async (meetingId: string) => {
  await processMeetingNote(meetingId);
};
```

- [ ] **Step 4: Add the tab and panel**

Add a new Tab after the "Relationships" tab:
```tsx
<Tab label={`Meeting Notes (${meetingNotes.length})`} />
```

Add a new TabPanel after the Relationships TabPanel (index 6):
```tsx
{/* Meeting Notes Tab */}
<TabPanel value={tab} index={6}>
  <MeetingNotesList
    notes={meetingNotes}
    onAdd={handleAddMeeting}
    onEdit={handleEditMeeting}
    onDelete={handleDeleteMeeting}
    onReprocess={handleReprocessMeeting}
  />
  <MeetingNotesForm
    open={meetingFormOpen}
    onClose={() => { setMeetingFormOpen(false); setEditingMeeting(null); }}
    onSubmit={handleMeetingSubmit}
    defaultValues={editingMeeting ?? undefined}
    contacts={contacts}
    isLoading={creatingMeeting || updatingMeeting}
  />
</TabPanel>
```

- [ ] **Step 5: Commit**

```bash
git add packages/client/src/features/accounts/AccountDetailPage.tsx
git commit -m "feat(client): add Meeting Notes tab to AccountDetailPage"
```

---

## Task 15: Build and Verify

- [ ] **Step 1: Build the shared package**

Run: `cd packages/shared && npm run build`
Expected: Success

- [ ] **Step 2: Build the server**

Run: `cd packages/server && npm run build`
Expected: Success

- [ ] **Step 3: Build the client**

Run: `cd packages/client && npm run build`
Expected: Success

- [ ] **Step 4: Fix any build errors and commit**

If any errors, fix them and commit with message:
```bash
git commit -m "fix: resolve build errors in meeting notes feature"
```

- [ ] **Step 5: Final commit if all clean**

```bash
git add -A
git commit -m "feat: complete AI-powered meeting notes feature"
```
