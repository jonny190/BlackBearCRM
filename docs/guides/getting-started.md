# Getting Started with BlackPear CRM

This guide covers local development setup, default credentials, and a summary of what the application can do.

## Quick Start (Local Development)

The local setup requires Docker for the backing services (PostgreSQL and Redis) and Node.js 18 or later for running the application code.

### 1. Start backing services

```bash
docker-compose -f docker-compose.dev.yml up -d
```

This starts PostgreSQL on port 5432 and Redis on port 6379.

### 2. Install dependencies

From the project root:

```bash
npm install
```

### 3. Configure environment

Copy the example environment file for the server and edit as needed:

```bash
cp packages/server/.env.example packages/server/.env
```

At minimum you need `DATABASE_URL`, `REDIS_URL`, and `JWT_SECRET` set. See the environment variables section in the deployment guide for details.

### 4. Run database migrations

```bash
cd packages/server && npx knex migrate:latest
```

This creates all tables and seeds the default admin user.

### 5. Start the development servers

Run the server and client in separate terminals:

```bash
# Terminal 1 - API server
cd packages/server && npm run dev

# Terminal 2 - React client
cd packages/client && npm run dev
```

The app will be available at `http://localhost:5173` and the API at `http://localhost:3000`.

## Default Admin Credentials

After running migrations for the first time, a default admin account is created if `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set in the environment. If those variables are not set, check the seed files in `packages/server/src/core/database/seeds/` for the default credentials used in development.

You can change the password after first login in Settings > Security.

## Feature Overview

### Accounts

The central entity in the CRM. Accounts represent companies or organisations you manage. Each account has a tier (enterprise, mid_market, or smb), industry, status, and an assigned owner. From an account's detail page you can see contacts, activity history, health scores, AI briefings, and relationship maps.

### Contacts

People associated with an account. Contacts have a role level (executive, VP, director, manager, or individual) and can be marked as the primary contact. The system will alert you if an account has only a single contact, as that is a risk indicator.

### Activities

Logged interactions with an account -- calls, emails, meetings, notes, or demos. Activities drive health scoring and activity gap alerts. You can log activities from the account timeline tab.

### Health Scoring

The system calculates a health score for each account based on several factors: recent activity frequency, contact coverage, and custom weights you can configure. Scores are colour-coded (green 80+, amber 60-79, orange 40-59, red below 40). Health scores are recalculated automatically by the background worker.

You can adjust the weight of each scoring component in Settings > Health Scoring (admin only).

### Alerts

The system generates alerts automatically for:

- Health drops -- when an account's score falls significantly
- Activity gaps -- when no activity has been logged for a configurable number of days
- Single contact risk -- when an account has only one contact
- Follow-up due -- upcoming tasks that need attention

Alerts appear in the bell icon in the header and on the Alerts page. You can mark them as read or dismiss them.

### Dashboards

Three role-specific dashboards are available:

- Manager -- overview of all accounts, at-risk list, and recent activity
- Team Lead -- team performance metrics and pipeline health
- Operations -- system health and data quality indicators

The app redirects you to the right dashboard based on your role.

### AI Briefings

The system can generate pre-meeting briefings for any account using an AI provider (OpenAI or Anthropic). Briefings summarise recent activity, health trends, key contacts, and suggested talking points. Configure the AI provider and API key in Settings > AI (admin only).

### Reports

The Reports page (available to admins and team leads) shows:

- Account health distribution across all tiers
- Activity trends over the last 7, 30, or 90 days by activity type
- Account breakdown by tier
- The ten lowest-scoring accounts
- Average health score by tier

### Import

Admins and team leads can bulk import accounts and contacts from CSV files using the Import page. The import wizard validates the file first and shows any rows with errors before you confirm the import. Download the CSV templates from the Import page to see the required column names and format.

### Relationship Mapping

From an account's detail page, the Relationships tab lets you define and visualise how contacts relate to each other -- who reports to whom, who is a champion or detractor, and the relative strength of each relationship.

## Configuration

### AI Provider

Go to Settings > AI and enter your API key and preferred model. The system supports OpenAI and Anthropic. Briefing generation will not work until this is configured.

### Health Score Weights

Go to Settings > Health Scoring to adjust the relative importance of activity recency, contact coverage, and other factors. Changes take effect on the next scheduled scoring run.

### User Management

Admins can invite new users and assign roles (admin, team_lead, csm, viewer) from Settings > Users.
