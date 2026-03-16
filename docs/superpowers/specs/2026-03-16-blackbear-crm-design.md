# BlackBear CRM - System Design Specification

**Date:** 2026-03-16
**Status:** Approved
**Deadline:** End of April 2026

## Overview

BlackBear CRM is a relationship-focused Customer Relationship Management system built for Black Pear. It prioritizes relationship health and institutional memory over traditional transaction tracking. The system treats accounts as evolving organisms, surfacing engagement patterns, relationship risks, and actionable intelligence for account managers.

## Constraints and Context

- **Team size:** 1-3 developers
- **Target users:** 10-25 account managers, team leads, and operations staff
- **Scale:** Up to 500 accounts, 5,000 contacts
- **Hosting:** Coolify (Docker Compose), Cloudflare proxy for HTTPS
- **Deadline:** End of April 2026 (approximately 6 weeks)
- **Scope:** Full architecture for all phases, Phase 1 features implemented

## Architecture Decision: Modular Monolith

A single deployable application with well-organized internal modules. No microservices, no event streaming, no Kubernetes. A Docker Compose stack on Coolify with PostgreSQL, Redis, and the application containers.

**Why this approach:**
- Right-sized for team and scale
- Single deployment pipeline
- Shared types between frontend and backend
- Easy to debug and reason about
- Can be decomposed later if needed

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript, Vite |
| UI Components | Material-UI (MUI) |
| Charts | Recharts |
| State Management | Redux Toolkit + RTK Query |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL 16 |
| Cache/Queue | Redis 7 |
| Job Queue | Bull |
| Real-time | Socket.io |
| ORM/Query Builder | Knex.js |
| Validation | Zod (shared between frontend and backend) |
| Forms | React Hook Form + @hookform/resolvers/zod |
| Logging | Pino (structured JSON) |
| LLM Providers | OpenAI + Anthropic (swappable abstraction) |
| Email/Calendar | Microsoft 365 via Graph API (Phase 2) |
| Auth | Self-managed JWT (access + refresh tokens) |
| Testing | Jest (backend), Vitest + React Testing Library (frontend) |
| Containerization | Docker + Docker Compose |

## Project Structure

```
blackbear-crm/
  packages/
    shared/                  # Shared types, constants, validation schemas
      src/
        types/               # TypeScript interfaces (Account, Contact, etc.)
        validation/          # Zod schemas shared between frontend and backend
        constants/           # Health score thresholds, enums, etc.

    server/                  # Express backend
      src/
        modules/
          auth/              # JWT auth, sessions, password hashing
          accounts/          # Account CRUD, search, filtering
          contacts/          # Contact management, influence scoring
          activities/        # Activity logging, timeline queries
          health/            # Health score calculation engine
          ai/                # LLM abstraction layer, briefings, summaries
          integrations/      # M365 Graph API (email, calendar)
          alerts/            # Threshold monitoring, notification dispatch
          dashboard/         # Aggregation queries for dashboard views
        core/
          database/          # Knex setup, migrations
          queue/             # Bull queue setup, job definitions
          websocket/         # Socket.io server setup
          middleware/        # Auth, error handling, rate limiting
        app.ts               # Express app assembly
        server.ts            # Entry point
        worker.ts            # Background job entry point

    client/                  # React frontend
      src/
        features/            # Feature-based organization mirroring modules
          auth/
          accounts/
          contacts/
          activities/
          health/
          dashboard/
          alerts/
        components/          # Shared UI components
        hooks/               # Shared React hooks
        services/            # API client, WebSocket client
        store/               # Redux Toolkit store setup
```

**Module pattern:** Each backend module follows a consistent internal structure:

```
modules/<name>/
  <name>.routes.ts           # Express router, input validation
  <name>.service.ts          # Business logic
  <name>.queries.ts          # Database queries (Knex)
  <name>.types.ts            # Module-specific types
```

Routes handle HTTP concerns. Services handle business logic. Queries handle SQL. No service calls another service's queries directly.

## Database Schema

### Core Tables (Phase 1)

**users**

| Column | Type | Notes |
|--------|------|-------|
| id | UUID, PK | |
| email | varchar, unique | |
| password_hash | varchar | bcrypt |
| first_name | varchar | |
| last_name | varchar | |
| role | enum | admin, manager, team_lead |
| is_active | boolean | soft delete |
| created_at | timestamp | |
| updated_at | timestamp | |

**accounts**

| Column | Type | Notes |
|--------|------|-------|
| id | UUID, PK | |
| name | varchar | |
| industry | varchar | |
| tier | enum | enterprise, mid_market, smb |
| website | varchar, nullable | |
| status | enum | active, inactive, churned, prospect |
| owner_id | FK -> users | |
| metadata | JSONB | flexible extension fields |
| created_at | timestamp | |
| updated_at | timestamp | |

**contacts**

| Column | Type | Notes |
|--------|------|-------|
| id | UUID, PK | |
| account_id | FK -> accounts | |
| first_name | varchar | |
| last_name | varchar | |
| email | varchar, nullable | |
| phone | varchar, nullable | |
| title | varchar | |
| role_level | enum | executive, director, manager, individual |
| influence_score | integer 0-100 | Phase 1: manual, Phase 3: auto-calculated |
| is_primary | boolean | |
| last_interaction_at | timestamp, nullable | |
| metadata | JSONB | |
| created_at | timestamp | |
| updated_at | timestamp | |

**activities**

| Column | Type | Notes |
|--------|------|-------|
| id | UUID, PK | |
| account_id | FK -> accounts | |
| contact_id | FK -> contacts, nullable | |
| user_id | FK -> users | who logged it |
| type | enum | meeting, email, call, note, proposal, follow_up |
| title | varchar | |
| description | text | |
| occurred_at | timestamp | |
| metadata | JSONB | source info for Phase 2 integrations |
| created_at | timestamp | |
| updated_at | timestamp | |

### Health Scoring Tables (Phase 1)

**health_scores**

| Column | Type | Notes |
|--------|------|-------|
| id | UUID, PK | |
| account_id | FK -> accounts | |
| overall_score | integer 0-100 | |
| engagement_score | integer 0-100 | |
| sentiment_score | integer 0-100, nullable | Phase 2 |
| renewal_score | integer 0-100, nullable | Phase 2 |
| momentum_score | integer 0-100, nullable | Phase 2 |
| factors | JSONB | breakdown of contributing factors |
| calculated_at | timestamp | |

Each calculation creates a new row, providing time-series trending data.

**health_score_config**

| Column | Type | Notes |
|--------|------|-------|
| id | UUID, PK | |
| account_tier | enum | |
| weight_engagement | decimal | |
| weight_sentiment | decimal | |
| weight_renewal | decimal | |
| weight_momentum | decimal | |
| alert_threshold | integer | score below which alerts fire |
| created_at | timestamp | |
| updated_at | timestamp | |

### Alert Tables

**alerts**

| Column | Type | Notes |
|--------|------|-------|
| id | UUID, PK | |
| account_id | FK -> accounts | |
| user_id | FK -> users | recipient |
| type | enum | health_drop, activity_gap, single_contact, follow_up_due |
| severity | enum | low, medium, high, critical |
| title | varchar | |
| message | text | |
| is_read | boolean | |
| is_dismissed | boolean | |
| created_at | timestamp | |

**notification_preferences**

| Column | Type | Notes |
|--------|------|-------|
| id | UUID, PK | |
| user_id | FK -> users | |
| alert_type | enum | |
| channel | enum | in_app, email |
| is_enabled | boolean | |

Unique constraint on `(user_id, alert_type, channel)` to prevent duplicate preference entries.

### Extension Tables (Schema defined now, populated in Phase 2/3)

**ai_briefings**

| Column | Type | Notes |
|--------|------|-------|
| id | UUID, PK | |
| account_id | FK -> accounts | |
| type | enum | onboarding_90day, pre_meeting, relationship_gap |
| content | text | |
| model_provider | text | openai or anthropic |
| model_id | text | |
| generated_at | timestamp | |
| expires_at | timestamp | |

**integration_connections**

| Column | Type | Notes |
|--------|------|-------|
| id | UUID, PK | |
| user_id | FK -> users | |
| provider | enum | microsoft_365 |
| access_token_encrypted | text | |
| refresh_token_encrypted | text | |
| scopes | text[] | |
| connected_at | timestamp | |
| expires_at | timestamp | |

**relationship_maps**

| Column | Type | Notes |
|--------|------|-------|
| id | UUID, PK | |
| account_id | FK -> accounts | |
| contact_id | FK -> contacts | |
| related_contact_id | FK -> contacts | |
| relationship_type | text | |
| strength | integer 0-100 | |

### Database Indexes

Migrations should include indexes for foreign keys and common query patterns:

```
accounts:      idx_accounts_owner_id, idx_accounts_status, idx_accounts_tier
contacts:      idx_contacts_account_id, idx_contacts_email, idx_contacts_role_level
activities:    idx_activities_account_id, idx_activities_occurred_at, idx_activities_type,
               idx_activities_user_id
health_scores: idx_health_scores_account_id_calculated_at (composite)
alerts:        idx_alerts_user_id_is_read, idx_alerts_account_id
```

The `health_score_config` table has a unique constraint on `account_tier` to prevent duplicate configs per tier.

## API Design

### Standard Response Format

All API responses follow a consistent envelope:

**Success responses:**
```json
{
  "data": { ... },
  "meta": { "page": 1, "limit": 25, "total": 142 }
}
```

**Error responses:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable description",
    "details": { "field": "email", "reason": "already exists" }
  }
}
```

Error codes: `VALIDATION_ERROR`, `NOT_FOUND`, `UNAUTHORIZED`, `FORBIDDEN`, `CONFLICT`, `INTERNAL_ERROR`.

### Authentication

```
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
POST   /api/auth/forgot-password          # sends reset email
POST   /api/auth/reset-password           # validates token, sets new password
GET    /api/auth/me
```

JWT with short-lived access tokens (15 minutes) and longer refresh tokens (7 days). Refresh tokens stored in httpOnly cookies.

**Initial admin seeding:** A CLI command (`npm run seed:admin`) creates the first admin user from environment variables (`ADMIN_EMAIL`, `ADMIN_PASSWORD`). All subsequent users are created by admins through the user management API.

**Password resets in Phase 1:** Admin-initiated only. An admin can reset a user's password via the user management API (`PUT /api/users/:id` with new password). The `forgot-password` and `reset-password` endpoints are defined but return 501 until a transactional email service is configured in Phase 2. No frontend routes for self-service password reset in Phase 1.

### User Management (admin only)

```
GET    /api/users                          # list all users
POST   /api/users                          # create/invite new user
PUT    /api/users/:id                      # update user role, active status
DELETE /api/users/:id                      # deactivate user (soft delete)
```

### Authorization Matrix

| Resource | Action | admin | team_lead | manager |
|----------|--------|-------|-----------|---------|
| Users | Create, edit, deactivate | Yes | No | No |
| Accounts | View all | Yes | Yes | Own only |
| Accounts | Create | Yes | Yes | Yes |
| Accounts | Edit | Yes | Yes | Own only |
| Accounts | Delete | Yes | No | No |
| Accounts | Reassign owner | Yes | Yes | No |
| Contacts | View | Yes | Yes | Own accounts only |
| Contacts | Create, edit, delete | Yes | Yes | Own accounts only |
| Activities | View all | Yes | Yes | Own only |
| Activities | Create, edit, delete | Yes | Yes | Own accounts only |
| Health Config | View | Yes | Yes | Yes |
| Health Config | Edit | Yes | No | No |
| Dashboard: Manager | View | Yes | Yes | Own data only |
| Dashboard: Team Lead | View | Yes | Yes | No |
| Dashboard: Operations | View | Yes | No | No |
| Alerts | View | Yes | Own + team | Own only |

"Own only" means the user must be the account owner. Team leads can see accounts and activities for all managers on their team. Account ownership is tracked via `accounts.owner_id`.

### Core Resources (Phase 1)

```
Accounts:
  GET    /api/accounts                     # list with filtering, search, pagination
  GET    /api/accounts/:id                 # single account with health score
  POST   /api/accounts
  PUT    /api/accounts/:id
  DELETE /api/accounts/:id
  GET    /api/accounts/:id/timeline        # activity timeline

Contacts:
  GET    /api/accounts/:id/contacts        # contacts for an account
  GET    /api/contacts                     # global contact search
  POST   /api/accounts/:id/contacts
  PUT    /api/contacts/:id
  DELETE /api/contacts/:id

Activities:
  GET    /api/activities                   # global feed with filters
  POST   /api/activities
  PUT    /api/activities/:id
  DELETE /api/activities/:id

Health:
  GET    /api/accounts/:id/health          # current score + trend
  GET    /api/accounts/:id/health/history  # time-series data
  GET    /api/health/config                # score weightings
  PUT    /api/health/config                # update weightings (admin)

Alerts:
  GET    /api/alerts                       # current user's alerts
  PUT    /api/alerts/:id/read
  PUT    /api/alerts/:id/dismiss

Dashboard:
  GET    /api/dashboard/manager            # account manager dashboard data
  GET    /api/dashboard/team-lead          # team overview data
  GET    /api/dashboard/operations         # system health data

Data Import:
  POST   /api/import/accounts              # CSV upload for bulk account import
  POST   /api/import/contacts              # CSV upload for bulk contact import
  GET    /api/import/template/:type        # download CSV template (accounts or contacts)
```

### Search and Filtering

Account list query parameters:
```
GET /api/accounts?q=search_term&industry=tech&tier=enterprise&status=active
    &owner_id=uuid&page=1&limit=25&sort=name&order=asc
```

- `q` parameter searches across account name and industry using PostgreSQL ILIKE (simple pattern matching, sufficient for 500 accounts)
- Contact search: `GET /api/contacts?q=search_term` searches across first_name, last_name, email, and title
- All list endpoints support `page`, `limit`, `sort`, and `order` parameters
- Default pagination: page 1, limit 25, max limit 100

### Extension Endpoints (return 501 until Phase 2/3)

```
AI:
  POST   /api/accounts/:id/briefing        # generate AI briefing
  GET    /api/accounts/:id/briefings       # list cached briefings

Integrations:
  POST   /api/integrations/connect         # OAuth flow start
  GET    /api/integrations/callback        # OAuth callback
  GET    /api/integrations/status          # connection status
```

### Middleware Stack

```
Request -> CORS -> Rate Limiter -> JWT Auth -> Role Check -> Route Handler -> Error Handler
```

CORS allowed origin: `https://crm.blackpear.co.uk` (Cloudflare proxied domain). Configured via `CORS_ORIGIN` environment variable.

### Rate Limiting

- Read endpoints: 100 requests/minute per user
- Write endpoints: 30 requests/minute per user
- Auth endpoints: 10 requests/minute per IP (brute force protection)
- Import endpoints: 5 requests/minute per user

Rate limiting uses `express-rate-limit` backed by Redis for shared state across restarts.

## Health Score Calculation (Phase 1)

Phase 1 calculates engagement score only. The overall score equals the engagement score in Phase 1. In Phase 2+, the overall score becomes a weighted combination of all sub-scores using the weights in `health_score_config`.

### Engagement Score Formula

The engagement score is based on activity count in a rolling 30-day window, weighted by activity type:

| Activity Type | Points |
|--------------|--------|
| Meeting | 10 |
| Call | 5 |
| Email | 3 |
| Proposal | 8 |
| Note | 1 |
| Follow-up | 4 |

**Calculation:**
1. Sum weighted points for all activities in the last 30 days
2. Apply a recency decay: activities in the last 7 days count at full value, 8-14 days at 75%, 15-21 days at 50%, 22-30 days at 25%
3. Normalize to 0-100 scale where the target score (100) is based on expected cadence per tier:
   - Enterprise: 60 points/month (roughly 2 meetings + 2 calls + 4 emails)
   - Mid-market: 40 points/month
   - SMB: 20 points/month
4. Cap at 100

**Score interpretation:**
- 80-100: Healthy (green)
- 60-79: Needs attention (yellow)
- 40-59: At risk (orange)
- 0-39: Critical (red)

**Trend calculation:** Compare current score to the score from 7 days ago. Display an up arrow if improved by 5+, down arrow if dropped by 5+, flat otherwise.

### Alert Threshold Rules

| Alert Type | Condition | Severity | Tier Variation |
|-----------|-----------|----------|---------------|
| Health drop | Score drops 15+ points in 7 days | high | Same for all tiers |
| Health drop | Score drops 10+ points in 7 days | medium | Same for all tiers |
| Activity gap | No activities in N days | medium | Enterprise: 14 days, Mid-market: 21 days, SMB: 30 days |
| Activity gap | No activities in 2x N days | high | Double the above thresholds |
| Single contact | Account has fewer than 2 contacts | low | Same for all tiers |
| Single contact | Account has only contacts below director level | medium | Enterprise and mid-market only |
| Follow-up due | Proposal with no follow-up activity in 5 business days | medium | Same for all tiers |

Alerts are de-duplicated: if an active (unread, not dismissed) alert of the same type already exists for an account, a new one is not created.

## Data Import

Phase 1 includes CSV import for initial data loading.

**Account CSV template columns:** name, industry, tier, website, status, owner_email
**Contact CSV template columns:** account_name, first_name, last_name, email, phone, title, role_level, is_primary

**Import process:**
1. Upload CSV file via API endpoint
2. Server validates all rows against Zod schemas
3. Returns validation report: valid rows, invalid rows with specific errors
4. User confirms import of valid rows
5. Bulk insert via Knex transaction (all-or-nothing for the confirmed set)

Owner lookup is by email. Account lookup (for contacts) is by exact name match. Validation failures do not block valid rows from importing.

## Logging and Monitoring

**Application logging:** Pino (structured JSON logs). Log levels: error, warn, info, debug. Production runs at info level.

**What gets logged:**
- All API requests (method, path, status code, duration)
- Authentication events (login, logout, failed attempts)
- Background job execution (start, complete, fail, duration)
- Health score calculations (account ID, old score, new score)
- Error stack traces

**Health check endpoint:** `GET /api/health` (no auth required) returns `{ status: "ok", uptime: seconds, database: "connected", redis: "connected" }`.

**Operations dashboard shows:**
- API response time averages (last 1h, 24h)
- Active users in last 24h
- Data completeness: accounts without contacts, contacts without email, accounts with no activity in 30 days
- Background job success/failure rates
- System uptime

Error tracking via structured logs shipped to stdout. Coolify captures container logs. No external error tracking service in Phase 1 -- can add Sentry in Phase 2 if needed.

## Background Job System

Bull queues backed by Redis. The worker runs the same server codebase with a different entry point (worker.ts) that only starts queue processors.

### Phase 1 Queues

```
Queue: health-scoring
  - calculateAccountHealth    # triggered on new activity
  - batchRecalculate          # scheduled nightly for all accounts

Queue: alerts
  - checkHealthThresholds     # runs after score calculation
  - checkActivityGaps         # scheduled daily scan
  - checkSingleContactRisk    # scheduled weekly
```

### Phase 2/3 Queues (defined but unused)

```
Queue: ai
  - generateBriefing
  - analyzeSentiment

Queue: integrations
  - syncCalendarEvents
  - syncEmails
```

## Real-time Communication

Socket.io backed by Redis adapter.

### Server to Client Events

```
health:updated      { accountId, score, trend }
alert:new           { alert object }
activity:created    { activity object }
dashboard:refresh   { section }
```

Socket.io is used for server-to-client push only. All mutations (marking alerts read, dismissing) go through REST endpoints for reliability. The client does not send mutation events through the socket.

## Frontend Architecture

### State Management

RTK Query handles all server state (API calls, caching, invalidation). Redux slices handle only client-local state:

```
store/
  store.ts                   # configureStore setup
  api/
    baseApi.ts               # RTK Query base with auth headers
    accountsApi.ts           # account endpoints
    contactsApi.ts           # contact endpoints
    activitiesApi.ts         # activity endpoints
    healthApi.ts             # health score endpoints
    alertsApi.ts             # alert endpoints
    dashboardApi.ts          # dashboard endpoints
  slices/
    authSlice.ts             # JWT tokens, current user
    uiSlice.ts               # sidebar state, modals, theme
    socketSlice.ts           # WebSocket connection state
```

### Feature Components

```
features/
  auth/
    LoginPage.tsx

  accounts/
    AccountListPage.tsx          # table with search, filters, health indicators
    AccountDetailPage.tsx        # tabbed: overview, contacts, timeline, health
    components/
      AccountTable.tsx
      AccountFilters.tsx
      HealthBadge.tsx            # color-coded score with trend arrow

  contacts/
    components/
      ContactList.tsx
      ContactForm.tsx
      InfluenceBadge.tsx

  activities/
    components/
      ActivityTimeline.tsx       # chronological feed per account
      ActivityForm.tsx           # log new activity
      ActivityFilters.tsx

  health/
    components/
      HealthScoreCard.tsx        # big number + trend chart
      HealthTrendChart.tsx       # Recharts line chart
      HealthFactorBreakdown.tsx  # bar chart of factor contributions
    HealthConfigPage.tsx         # admin: configure weights and thresholds

  dashboard/
    ManagerDashboard.tsx         # health overview, action items, upcoming activities
    TeamLeadDashboard.tsx        # team performance, at-risk accounts
    OperationsDashboard.tsx      # data quality, system adoption
    components/
      AtRiskAccountList.tsx
      ActivityGapList.tsx
      UpcomingActivities.tsx

  alerts/
    components/
      AlertBell.tsx              # header icon with unread count
      AlertPanel.tsx             # dropdown with alert list
      AlertItem.tsx
```

### Routing

```
/login
/dashboard                       # redirects to role-appropriate dashboard
/dashboard/manager
/dashboard/team-lead
/dashboard/operations
/accounts                        # account list
/accounts/:id                    # account detail (tabbed)
/settings/health-config          # admin only
/settings/profile
/settings/notifications
```

### Shared Components

```
components/
  layout/
    AppShell.tsx                 # sidebar + header + content area
    Sidebar.tsx
    Header.tsx                   # search, alert bell, user menu
  common/
    DataTable.tsx                # reusable MUI DataGrid wrapper
    SearchInput.tsx
    ConfirmDialog.tsx
    EmptyState.tsx
    LoadingState.tsx
```

### WebSocket Integration

A `useSocket` hook manages Socket.io connection lifecycle (connect on login, disconnect on logout). Incoming events trigger RTK Query cache invalidations so the UI updates automatically without manual state syncing.

### Responsive Design

MUI breakpoint system handles responsive layouts. AppShell sidebar collapses to hamburger on mobile. DataTables switch to card layouts on small screens.

## LLM Abstraction Layer

Defined in Phase 1, used in Phase 2.

```
ai/
  ai.provider.ts                 # interface: generateText, summarize, analyzeSentiment
  ai.openai.ts                   # OpenAI implementation
  ai.anthropic.ts                # Claude implementation
  ai.service.ts                  # provider selection from config, retries, fallback
```

Provider selected via `LLM_PROVIDER` environment variable. Both implementations conform to the same interface so they can be swapped without touching business logic.

## Deployment

### Docker Compose Stack (Coolify)

```yaml
services:
  app:                           # Express + Socket.io
    build: ./packages/server
    ports: [3000]
    depends_on: [postgres, redis]

  client:                        # Nginx serving React build
    build: ./packages/client
    ports: [80]
    depends_on: [app]

  postgres:
    image: postgres:16
    volumes: [pgdata]

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes: [redisdata]

  worker:                        # Bull queue processor
    build: ./packages/server
    command: node dist/worker.js
    depends_on: [postgres, redis]
```

### Domain Routing

```
http://crm.blackpear.co.uk         # Nginx serves React app
http://crm.blackpear.co.uk/api     # Nginx proxies to Express (port 3000)
http://crm.blackpear.co.uk/ws      # Nginx proxies WebSocket to Express
```

Cloudflare proxy provides HTTPS to end users. Internal traffic is HTTP per Coolify setup.

### Database Migrations

Knex migrations run on app container startup. A startup script checks for and applies pending migrations before starting Express. The worker container also checks migration status on startup and waits for migrations to complete before starting queue processors.

### Backup Strategy

PostgreSQL dumps scheduled via Coolify's backup feature or a cron job in the worker container.

### Environment Variables

```
DATABASE_URL=postgresql://user:pass@postgres:5432/blackbear
REDIS_URL=redis://redis:6379
JWT_SECRET=<generated>
JWT_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
OPENAI_API_KEY=<optional, Phase 2>
ANTHROPIC_API_KEY=<optional, Phase 2>
LLM_PROVIDER=openai|anthropic
MS_CLIENT_ID=<optional, Phase 2>
MS_CLIENT_SECRET=<optional, Phase 2>
MS_TENANT_ID=<optional, Phase 2>
CORS_ORIGIN=https://crm.blackpear.co.uk
ADMIN_EMAIL=<for initial seed>
ADMIN_PASSWORD=<for initial seed>
NODE_ENV=production
```

## Testing Strategy

### Backend (Jest)

- **Unit tests:** Service layer business logic (health score calculations, alert threshold checks, activity gap detection), Zod schema validation, LLM abstraction with mock providers
- **Integration tests:** API routes via supertest against a test PostgreSQL database, database query shape verification, WebSocket event verification
- **Test database:** Separate `blackbear_test` database, migrations run before suite, each test wrapped in a transaction that rolls back

### Frontend (Vitest + React Testing Library)

- **Component tests:** Feature components with mock RTK Query responses, form validation and submission, dashboard display
- **Hook tests:** useSocket with mock Socket.io client, useAuth token refresh flow
- **Integration tests:** MSW (Mock Service Worker) for API mocking, full user flow testing

### What we skip

- No E2E tests in Phase 1 (small user base, manual QA sufficient)
- No snapshot tests (maintenance burden without catching real bugs)
- No testing of MUI component internals

## Implementation Phases

### Phase 1 (MVP) - Current scope

1. Core account and contact management (full CRUD)
2. Basic health scoring (engagement frequency only)
3. Manual activity logging with timeline view
4. Simple dashboard with health score visualization
5. Alert system for health drops and activity gaps
6. Self-managed JWT authentication
7. WebSocket real-time updates
8. Role-based access control

### Phase 2 (AI Integration) - Architecture ready

1. Microsoft 365 email and calendar integration
2. AI-powered briefing generation (OpenAI/Claude)
3. Automated follow-up reminders
4. Advanced health scoring with sentiment analysis

### Phase 3 (Advanced Features) - Schema ready

1. Relationship mapping visualization
2. Advanced reporting and analytics
3. Mobile application
4. Advanced AI recommendations
