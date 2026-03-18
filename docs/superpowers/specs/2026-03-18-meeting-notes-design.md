# AI-Powered Meeting Notes Feature - Design Spec

## Overview

Add a meeting notes feature to BlackBear CRM that allows users to create meeting notes tied to accounts, have AI automatically process them into structured insights (action items, concerns, follow-ups, sentiment), and feed those insights into the existing account health scoring system.

Meeting notes live as a new tab on the Account Detail page. AI processing happens asynchronously via a Bull queue using the existing configurable AI provider (Ollama, OpenAI, or Anthropic). Processing triggers automatically on save and can be manually re-triggered.

## Decisions

- **Navigation**: Meeting notes tab on Account Detail page (not a standalone sidebar page)
- **AI trigger**: Both automatic on save and manual re-trigger
- **AI extraction**: Structured extraction (insight, action_item, concern, follow_up, sentiment) with confidence scores, feeding into account health scoring
- **Architecture**: Standalone meetings module (not extending activities)
- **Processed notes storage**: Separate `processed_customer_notes` table (not JSONB on meeting_notes)

## Database Schema

### meeting_notes

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, auto-generated (uuid_generate_v4) |
| account_id | UUID | FK -> accounts(id) ON DELETE CASCADE, NOT NULL |
| contact_id | UUID | FK -> contacts(id) ON DELETE SET NULL, nullable |
| user_id | UUID | FK -> users(id), NOT NULL |
| title | VARCHAR(255) | NOT NULL |
| raw_notes | TEXT | NOT NULL |
| meeting_date | TIMESTAMP | NOT NULL |
| participants | JSONB | Default '[]', array of { name, role? } |
| status | VARCHAR(20) | NOT NULL, one of: draft, processing, processed, failed |
| processed_at | TIMESTAMP | Nullable |
| created_at | TIMESTAMP | Default NOW() |
| updated_at | TIMESTAMP | Default NOW() |

Indexes: `account_id`, `meeting_date`, `user_id`

### processed_customer_notes

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, auto-generated (uuid_generate_v4) |
| meeting_note_id | UUID | FK -> meeting_notes(id) ON DELETE CASCADE, NOT NULL |
| account_id | UUID | FK -> accounts(id) ON DELETE CASCADE, NOT NULL |
| note_type | VARCHAR(50) | NOT NULL, one of: insight, action_item, concern, follow_up, sentiment |
| content | TEXT | NOT NULL |
| confidence_score | FLOAT | NOT NULL, 0-1 range |
| created_at | TIMESTAMP | Default NOW() |

Indexes: `meeting_note_id`, `account_id`, `note_type`

## Backend Architecture

### New module: packages/server/src/modules/meetings/

#### meetings.routes.ts

Two routers exported from this file:

**`meetingNotesAccountRouter`** - created with `Router({ mergeParams: true })` so `req.params.id` (the account ID) is forwarded from the parent mount. Handlers must type `req.params` as `{ id: string }`. This matches the contacts router pattern exactly.

**`meetingNotesRouter`** - standard `Router()` for operations on individual meeting notes.

All routes behind `authenticate` middleware.

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/accounts/:id/meeting-notes | List meeting notes for account (paginated) |
| POST | /api/accounts/:id/meeting-notes | Create meeting note, auto-queues AI processing |
| PUT | /api/meeting-notes/:id | Update meeting note, re-queues if raw_notes changed |
| DELETE | /api/meeting-notes/:id | Delete meeting note (cascades processed notes) |
| POST | /api/meeting-notes/:id/process | Manual re-trigger of AI processing |
| GET | /api/meeting-notes/:id/insights | Get processed notes for a specific meeting note |

Request validation via `validateBody` and `validateQuery` with Zod schemas from shared package.

#### meetings.service.ts

- RBAC checks via `checkAccountAccess` pattern (managers can only access their owned accounts)
- On create: save note with status `processing`, immediately add job to meetings queue
- On update: if `raw_notes` changed, set status to `processing`, delete existing processed notes, re-queue AI processing; otherwise just update fields
- On manual process: delete existing processed notes, set status to `processing`, re-queue
- Publishes WebSocket events: `meeting-note:created`, `meeting-note:updated`, `meeting-note:processed`

**Status state machine:**
- `processing` - initial state on create, or when re-processing is triggered (update with changed notes, manual re-process)
- `processed` - set by the queue worker after successful AI extraction
- `failed` - set by the queue worker after all retries exhausted, or if AI provider is not configured

#### meetings.queries.ts

Knex query functions for both tables:
- `listMeetingNotes(params)` - paginated, sorted by meeting_date desc, with RBAC owner filtering
- `getMeetingNoteById(id)` - single note lookup
- `createMeetingNote(data)` - insert with returning
- `updateMeetingNote(id, data)` - update with returning
- `deleteMeetingNote(id)` - delete
- `getProcessedNotes(meetingNoteId)` - processed notes for a meeting
- `insertProcessedNotes(notes[])` - bulk insert processed notes
- `deleteProcessedNotes(meetingNoteId)` - clear processed notes for re-processing

#### ai-notes-processor.ts

Queue worker that processes meeting notes through AI:

1. Fetches meeting note and account context (name, industry, tier)
2. Builds structured prompt requesting JSON array of `{ type, content, confidence }`
3. Calls `await getAiProvider()` (async, returns `AiProvider | null`), then `provider.generateText()` with the prompt. Must handle `null` provider (AI not configured).
4. Parses JSON response, inserts into `processed_customer_notes`
5. Updates meeting note status to `processed`, sets `processed_at`
6. Queues health recalculation: `healthQueue.add('calculateAccountHealth', { accountId })`
7. Publishes `meeting-note:processed` WebSocket event

Error handling:
- AI provider not configured: status -> `failed`, no retry
- Unparseable AI response: retry up to 3 times with exponential backoff (1s, 4s, 16s)
- All retries exhausted: status -> `failed`, user can manually re-trigger

### Queue: packages/server/src/core/queue/health-queue.ts

Add `meetingsQueue` to the existing queue file (which already exports `healthQueue` and `alertQueue`):
```typescript
export const meetingsQueue = new Bull('meeting-notes-processing', config.REDIS_URL);
```

### Worker registration: packages/server/src/worker.ts

Import `meetingsQueue` from `health-queue.ts` and register the processor:
```typescript
import { processMeetingNote } from './modules/meetings/ai-notes-processor.js';

meetingsQueue.process('processMeetingNote', async (job) => {
  const { meetingNoteId } = job.data;
  await processMeetingNote(meetingNoteId);
});
```

### Registration in app.ts

Two route mounts:
- `app.use('/api/accounts/:id/meeting-notes', meetingNotesAccountRouter)` - account-scoped routes (uses `mergeParams`)
- `app.use('/api/meeting-notes', meetingNotesRouter)` - individual note operations

## Shared Package

### packages/shared/src/types/meeting-note.ts

```typescript
export interface MeetingNote {
  id: string;
  account_id: string;
  contact_id: string | null;
  user_id: string;
  title: string;
  raw_notes: string;
  meeting_date: string;
  participants: Array<{ name: string; role?: string }>;
  status: 'draft' | 'processing' | 'processed' | 'failed';
  processed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProcessedCustomerNote {
  id: string;
  meeting_note_id: string;
  account_id: string;
  note_type: 'insight' | 'action_item' | 'concern' | 'follow_up' | 'sentiment';
  content: string;
  confidence_score: number;
  created_at: string;
}
```

### packages/shared/src/validation/meeting-note.ts

Zod schemas following the activity validation pattern:
- `createMeetingNoteSchema` - requires `title` (z.string().min(1).max(255)), `raw_notes` (z.string().min(1)), `meeting_date` (z.string().datetime()); optional `contact_id` (z.string().uuid().nullable()), `participants` (z.array(z.object({ name: z.string(), role: z.string().optional() })))
- `updateMeetingNoteSchema` - partial of create, omits account_id
- `meetingNoteQuerySchema` - pagination (page, limit, sort, order) matching the activity query schema pattern

## Frontend Architecture

### RTK Query API: packages/client/src/store/api/meetingsApi.ts

Endpoints injected into baseApi:
- `useGetMeetingNotesQuery(accountId)` - provides MeetingNote tags
- `useCreateMeetingNoteMutation()` - invalidates MeetingNote tags
- `useUpdateMeetingNoteMutation()` - invalidates specific note tag
- `useDeleteMeetingNoteMutation()` - invalidates MeetingNote tags
- `useProcessMeetingNoteMutation()` - manual re-process, invalidates MeetingNote tags
- `useGetMeetingNoteInsightsQuery(noteId)` - get processed insights, provides `Insight` tags

Add `'MeetingNote'` and `'Insight'` to `tagTypes` array in `baseApi.ts`.

### New components: packages/client/src/features/meetings/

#### MeetingNotesList.tsx

List view matching ContactList pattern:
- Add button at top right
- Each row: title, meeting date, status chip (color-coded: draft=default, processing=info, processed=success, failed=error)
- Edit/delete icon buttons per row
- Retry icon button for failed status items
- Expandable rows to show ProcessedInsights inline

#### MeetingNotesForm.tsx

Dialog form matching ContactForm pattern:
- Title (text input)
- Meeting date (datetime-local input)
- Contact dropdown (populated from account's contacts)
- Participants (chip input for name/role pairs)
- Raw notes (multiline textarea, large)
- react-hook-form with Zod resolver

#### ProcessedInsights.tsx

Displays AI-extracted notes for a meeting note:
- Grouped by note_type with colored chips:
  - action_item = blue
  - concern = red
  - insight = green
  - follow_up = orange
  - sentiment = purple
- Confidence score as subtle opacity or badge
- Loading spinner when status is 'processing'
- Empty state when no insights yet

### Modifications to AccountDetailPage.tsx

- Add "Meeting Notes" tab at index 6 (after Relationships)
- Add state for meeting note form dialog (open, editing)
- Query meeting notes via `useGetMeetingNotesQuery(id)`
- Wire up CRUD mutation handlers following same pattern as contacts tab
- Render MeetingNotesList + MeetingNotesForm in the tab panel

### WebSocket: useSocket.ts

Add listener:
```typescript
socket.on('meeting-note:processed', ({ accountId }) => {
  dispatch(baseApi.util.invalidateTags(['MeetingNote', 'Insight', { type: 'Health', id: accountId }]));
});
```

This invalidates both the meeting notes list (status updates to 'processed') and any expanded insights panels.

## Health Score Integration

The existing `calculateAndStoreHealth` in `health.service.ts` already uses AI sentiment analysis on activity titles. Meeting notes provide richer sentiment data. The processor triggers `healthQueue.add('calculateAccountHealth', { accountId })` after processing, which recalculates the health score. The existing sentiment scoring path (`provider.analyzeSentiment()`) will naturally pick up the most recent activity context. No changes to `health.service.ts` are needed for the initial implementation -- the health recalculation is triggered to refresh scores based on the new engagement signal (a meeting happened). In a future iteration, the health calculator could also pull from `processed_customer_notes` sentiment entries for more nuanced scoring.

## Files to Create

1. `packages/server/src/core/database/migrations/010_create_meeting_notes.ts`
2. `packages/server/src/modules/meetings/meetings.routes.ts`
4. `packages/server/src/modules/meetings/meetings.service.ts`
5. `packages/server/src/modules/meetings/meetings.queries.ts`
6. `packages/server/src/modules/meetings/ai-notes-processor.ts`
7. `packages/shared/src/types/meeting-note.ts`
8. `packages/shared/src/validation/meeting-note.ts`
9. `packages/client/src/store/api/meetingsApi.ts`
10. `packages/client/src/features/meetings/MeetingNotesList.tsx`
11. `packages/client/src/features/meetings/MeetingNotesForm.tsx`
12. `packages/client/src/features/meetings/ProcessedInsights.tsx`

## Files to Modify

1. `packages/server/src/app.ts` - register meeting note routes (both account-scoped and standalone)
2. `packages/server/src/core/queue/health-queue.ts` - add `meetingsQueue` export
3. `packages/server/src/worker.ts` - import `meetingsQueue`, register `processMeetingNote` processor
4. `packages/client/src/store/api/baseApi.ts` - add `MeetingNote` and `Insight` tag types
5. `packages/client/src/features/accounts/AccountDetailPage.tsx` - add Meeting Notes tab at index 6 (existing tabs 0-5 remain unchanged)
6. `packages/client/src/hooks/useSocket.ts` - add `meeting-note:processed` listener
7. `packages/shared/src/types/index.ts` - export new types
8. `packages/shared/src/validation/index.ts` - export new schemas
