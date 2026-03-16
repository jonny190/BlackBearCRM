# BlackBear CRM Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Phase 1 MVP of BlackBear CRM -- accounts, contacts, activities, health scoring, alerts, dashboards with real-time updates.

**Architecture:** Modular monolith in a monorepo (shared/server/client packages). Express + PostgreSQL + Redis + Bull for backend, React + MUI + RTK Query for frontend. Docker Compose for Coolify deployment.

**Tech Stack:** Node.js, Express, TypeScript, PostgreSQL 16, Redis 7, Bull, Socket.io, Knex.js, Zod, React 18, Vite, MUI, Redux Toolkit, RTK Query, React Hook Form, Recharts, Pino, Jest, Vitest, Docker

**Spec:** `docs/superpowers/specs/2026-03-16-blackbear-crm-design.md`

---

## Chunk 1: Foundation

### Task 1: Monorepo Scaffolding

**Files:**
- Create: `package.json` (root workspace)
- Create: `tsconfig.base.json`
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/index.ts`
- Create: `packages/server/package.json`
- Create: `packages/server/tsconfig.json`
- Create: `packages/server/src/server.ts`
- Create: `packages/client/package.json`
- Create: `packages/client/tsconfig.json`
- Create: `packages/client/vite.config.ts`
- Create: `packages/client/index.html`
- Create: `packages/client/src/main.tsx`
- Create: `packages/client/src/App.tsx`
- Create: `.gitignore`
- Create: `.env.example`

- [ ] **Step 1: Create root package.json with workspaces**

```json
{
  "name": "blackbear-crm",
  "private": true,
  "workspaces": ["packages/*"],
  "scripts": {
    "dev:server": "npm run dev --workspace=packages/server",
    "dev:client": "npm run dev --workspace=packages/client",
    "build": "npm run build --workspace=packages/shared && npm run build --workspace=packages/server && npm run build --workspace=packages/client",
    "test:server": "npm test --workspace=packages/server",
    "test:client": "npm test --workspace=packages/client",
    "migrate": "npm run migrate --workspace=packages/server",
    "migrate:rollback": "npm run migrate:rollback --workspace=packages/server",
    "seed:admin": "npm run seed:admin --workspace=packages/server"
  }
}
```

- [ ] **Step 2: Create tsconfig.base.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
```

- [ ] **Step 3: Create shared package**

`packages/shared/package.json`:
```json
{
  "name": "@blackbear/shared",
  "version": "1.0.0",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "watch": "tsc --watch"
  },
  "dependencies": {
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0"
  }
}
```

`packages/shared/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

`packages/shared/src/index.ts`:
```typescript
export * from './types/index.js';
export * from './validation/index.js';
export * from './constants/index.js';
```

Create placeholder files:
- `packages/shared/src/types/index.ts` -- `export {};`
- `packages/shared/src/validation/index.ts` -- `export {};`
- `packages/shared/src/constants/index.ts` -- `export {};`

- [ ] **Step 4: Create server package**

`packages/server/package.json`:
```json
{
  "name": "@blackbear/server",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "start:worker": "node dist/worker.js",
    "test": "jest --config jest.config.js",
    "test:watch": "jest --watch",
    "migrate": "knex migrate:latest --knexfile src/core/database/knexfile.ts",
    "migrate:rollback": "knex migrate:rollback --knexfile src/core/database/knexfile.ts",
    "migrate:make": "knex migrate:make --knexfile src/core/database/knexfile.ts",
    "seed:admin": "tsx src/scripts/seed-admin.ts"
  },
  "dependencies": {
    "@blackbear/shared": "*",
    "express": "^4.18.0",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.0",
    "cookie-parser": "^1.4.6",
    "knex": "^3.1.0",
    "pg": "^8.11.0",
    "bull": "^4.12.0",
    "socket.io": "^4.7.0",
    "ioredis": "^5.3.0",
    "pino": "^8.19.0",
    "pino-http": "^9.0.0",
    "express-rate-limit": "^7.1.0",
    "rate-limit-redis": "^4.2.0",
    "multer": "^1.4.5-lts.1",
    "csv-parse": "^5.5.0",
    "uuid": "^9.0.0",
    "dotenv": "^16.4.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.0",
    "pino-pretty": "^10.3.0",
    "@types/cors": "^2.8.0",
    "@types/bcryptjs": "^2.4.0",
    "@types/jsonwebtoken": "^9.0.0",
    "@types/cookie-parser": "^1.4.0",
    "@types/multer": "^1.4.0",
    "@types/uuid": "^9.0.0",
    "typescript": "^5.4.0",
    "tsx": "^4.7.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.0",
    "@types/jest": "^29.5.0",
    "supertest": "^6.3.0",
    "@types/supertest": "^6.0.0"
  }
}
```

`packages/server/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"],
  "references": [{ "path": "../shared" }]
}
```

`packages/server/jest.config.js`:
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^@blackbear/shared$': '<rootDir>/../shared/src'
  }
};
```

`packages/server/src/server.ts`:
```typescript
import { createApp } from './app.js';
import { config } from './core/config.js';
import { logger } from './core/logger.js';
import { db } from './core/database/connection.js';
import { createSocketServer, subscribeToSocketEvents } from './core/websocket/socket.js';
import http from 'http';

async function start() {
  // Run pending migrations
  await db.migrate.latest();
  logger.info('Database migrations complete');

  const app = createApp();
  const server = http.createServer(app);

  createSocketServer(server);
  subscribeToSocketEvents(); // Listen for worker events via Redis pub/sub

  server.listen(config.port, () => {
    logger.info(`Server running on port ${config.port}`);
  });
}

start().catch((err) => {
  logger.fatal(err, 'Failed to start server');
  process.exit(1);
});
```

- [ ] **Step 5: Create client package**

`packages/client/package.json`:
```json
{
  "name": "@blackbear/client",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@blackbear/shared": "*",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.22.0",
    "@mui/material": "^5.15.0",
    "@mui/icons-material": "^5.15.0",
    "@emotion/react": "^11.11.0",
    "@emotion/styled": "^11.11.0",
    "@reduxjs/toolkit": "^2.2.0",
    "react-redux": "^9.1.0",
    "react-hook-form": "^7.51.0",
    "@hookform/resolvers": "^3.3.0",
    "recharts": "^2.12.0",
    "@mui/lab": "^5.0.0-alpha.170",
    "socket.io-client": "^4.7.0",
    "zod": "^3.22.0",
    "@mui/x-data-grid": "^7.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.4.0",
    "vite": "^5.2.0",
    "vitest": "^1.4.0",
    "@testing-library/react": "^14.2.0",
    "@testing-library/jest-dom": "^6.4.0",
    "@testing-library/user-event": "^14.5.0",
    "msw": "^2.2.0",
    "jsdom": "^24.0.0"
  }
}
```

`packages/client/vite.config.ts`:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
      '/socket.io': { target: 'http://localhost:3000', ws: true }
    }
  }
});
```

`packages/client/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true
  },
  "include": ["src"],
  "references": [{ "path": "../shared" }]
}
```

`packages/client/index.html`:
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>BlackBear CRM</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`packages/client/src/main.tsx`:
```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

`packages/client/src/App.tsx`:
```tsx
export function App() {
  return <div>BlackBear CRM</div>;
}
```

- [ ] **Step 6: Create .gitignore and .env.example**

`.gitignore`:
```
node_modules/
dist/
.env
*.log
.DS_Store
```

`.env.example`:
```
DATABASE_URL=postgresql://blackbear:blackbear@localhost:5432/blackbear
REDIS_URL=redis://localhost:6379
JWT_SECRET=change-me-in-production
JWT_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
CORS_ORIGIN=http://localhost:5173
ADMIN_EMAIL=admin@blackpear.co.uk
ADMIN_PASSWORD=change-me
NODE_ENV=development
PORT=3000
```

- [ ] **Step 7: Install dependencies and verify build**

Run: `npm install && npm run build --workspace=packages/shared`
Expected: Clean install, shared package compiles

- [ ] **Step 8: Commit**

```bash
git init
git add -A
git commit -m "feat: monorepo scaffolding with shared/server/client packages"
```

---

### Task 2: Core Server Config, Logger, Database Connection

**Files:**
- Create: `packages/server/src/core/config.ts`
- Create: `packages/server/src/core/logger.ts`
- Create: `packages/server/src/core/database/connection.ts`
- Create: `packages/server/src/core/database/knexfile.ts`

- [ ] **Step 1: Write config module**

`packages/server/src/core/config.ts`:
```typescript
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string(),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().min(8).optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
});

export const config = envSchema.parse(process.env);
export type Config = z.infer<typeof envSchema>;
```

- [ ] **Step 2: Write logger module**

`packages/server/src/core/logger.ts`:
```typescript
import pino from 'pino';
import { config } from './config.js';

export const logger = pino({
  level: config.NODE_ENV === 'production' ? 'info' : 'debug',
  transport: config.NODE_ENV === 'development'
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
});
```

Add `pino-pretty` to server devDependencies.

- [ ] **Step 3: Write database connection**

`packages/server/src/core/database/connection.ts`:
```typescript
import knex from 'knex';
import { config } from '../config.js';

export const db = knex({
  client: 'pg',
  connection: config.DATABASE_URL,
  pool: { min: 2, max: 10 },
  migrations: {
    directory: './src/core/database/migrations',
    extension: 'ts',
  },
});
```

`packages/server/src/core/database/knexfile.ts`:
```typescript
import type { Knex } from 'knex';
import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

const config: Knex.Config = {
  client: 'pg',
  connection: process.env.DATABASE_URL,
  migrations: {
    directory: './migrations',
    extension: 'ts',
  },
};

export default config;
```

Add `dotenv` to server dependencies.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: core config, logger, and database connection"
```

---

### Task 3: Database Migrations

**Files:**
- Create: `packages/server/src/core/database/migrations/001_create_users.ts`
- Create: `packages/server/src/core/database/migrations/002_create_accounts.ts`
- Create: `packages/server/src/core/database/migrations/003_create_contacts.ts`
- Create: `packages/server/src/core/database/migrations/004_create_activities.ts`
- Create: `packages/server/src/core/database/migrations/005_create_health_scores.ts`
- Create: `packages/server/src/core/database/migrations/006_create_alerts.ts`
- Create: `packages/server/src/core/database/migrations/007_create_extension_tables.ts`

- [ ] **Step 1: Create users migration**

```typescript
import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
  await knex.schema.createTable('users', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.string('email').notNullable().unique();
    t.string('password_hash').notNullable();
    t.string('first_name').notNullable();
    t.string('last_name').notNullable();
    t.enu('role', ['admin', 'manager', 'team_lead']).notNullable().defaultTo('manager');
    t.boolean('is_active').notNullable().defaultTo(true);
    t.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('users');
}
```

- [ ] **Step 2: Create accounts migration**

```typescript
import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('accounts', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.string('name').notNullable();
    t.string('industry').notNullable();
    t.enu('tier', ['enterprise', 'mid_market', 'smb']).notNullable();
    t.string('website');
    t.enu('status', ['active', 'inactive', 'churned', 'prospect']).notNullable().defaultTo('active');
    t.uuid('owner_id').notNullable().references('id').inTable('users');
    t.jsonb('metadata').defaultTo('{}');
    t.timestamps(true, true);
    t.index('owner_id', 'idx_accounts_owner_id');
    t.index('status', 'idx_accounts_status');
    t.index('tier', 'idx_accounts_tier');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('accounts');
}
```

- [ ] **Step 3: Create contacts migration**

```typescript
import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('contacts', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('account_id').notNullable().references('id').inTable('accounts').onDelete('CASCADE');
    t.string('first_name').notNullable();
    t.string('last_name').notNullable();
    t.string('email');
    t.string('phone');
    t.string('title').notNullable();
    t.enu('role_level', ['executive', 'director', 'manager', 'individual']).notNullable();
    t.integer('influence_score').notNullable().defaultTo(50);
    t.boolean('is_primary').notNullable().defaultTo(false);
    t.timestamp('last_interaction_at');
    t.jsonb('metadata').defaultTo('{}');
    t.timestamps(true, true);
    t.index('account_id', 'idx_contacts_account_id');
    t.index('email', 'idx_contacts_email');
    t.index('role_level', 'idx_contacts_role_level');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('contacts');
}
```

- [ ] **Step 4: Create activities migration**

```typescript
import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('activities', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('account_id').notNullable().references('id').inTable('accounts').onDelete('CASCADE');
    t.uuid('contact_id').references('id').inTable('contacts').onDelete('SET NULL');
    t.uuid('user_id').notNullable().references('id').inTable('users');
    t.enu('type', ['meeting', 'email', 'call', 'note', 'proposal', 'follow_up']).notNullable();
    t.string('title').notNullable();
    t.text('description');
    t.timestamp('occurred_at').notNullable();
    t.jsonb('metadata').defaultTo('{}');
    t.timestamps(true, true);
    t.index('account_id', 'idx_activities_account_id');
    t.index('occurred_at', 'idx_activities_occurred_at');
    t.index('type', 'idx_activities_type');
    t.index('user_id', 'idx_activities_user_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('activities');
}
```

- [ ] **Step 5: Create health scores migration**

```typescript
import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('health_scores', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('account_id').notNullable().references('id').inTable('accounts').onDelete('CASCADE');
    t.integer('overall_score').notNullable();
    t.integer('engagement_score').notNullable();
    t.integer('sentiment_score');
    t.integer('renewal_score');
    t.integer('momentum_score');
    t.jsonb('factors').defaultTo('{}');
    t.timestamp('calculated_at').notNullable().defaultTo(knex.fn.now());
    t.index(['account_id', 'calculated_at'], 'idx_health_scores_account_calculated');
  });

  await knex.schema.createTable('health_score_config', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.enu('account_tier', ['enterprise', 'mid_market', 'smb']).notNullable().unique();
    t.decimal('weight_engagement', 5, 2).notNullable().defaultTo(1.0);
    t.decimal('weight_sentiment', 5, 2).notNullable().defaultTo(0.0);
    t.decimal('weight_renewal', 5, 2).notNullable().defaultTo(0.0);
    t.decimal('weight_momentum', 5, 2).notNullable().defaultTo(0.0);
    t.integer('alert_threshold').notNullable().defaultTo(40);
    t.timestamps(true, true);
  });

  // Seed default config
  await knex('health_score_config').insert([
    { account_tier: 'enterprise', weight_engagement: 1.0, alert_threshold: 50 },
    { account_tier: 'mid_market', weight_engagement: 1.0, alert_threshold: 40 },
    { account_tier: 'smb', weight_engagement: 1.0, alert_threshold: 30 },
  ]);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('health_score_config');
  await knex.schema.dropTableIfExists('health_scores');
}
```

- [ ] **Step 6: Create alerts migration**

```typescript
import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('alerts', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('account_id').notNullable().references('id').inTable('accounts').onDelete('CASCADE');
    t.uuid('user_id').notNullable().references('id').inTable('users');
    t.enu('type', ['health_drop', 'activity_gap', 'single_contact', 'follow_up_due']).notNullable();
    t.enu('severity', ['low', 'medium', 'high', 'critical']).notNullable();
    t.string('title').notNullable();
    t.text('message');
    t.boolean('is_read').notNullable().defaultTo(false);
    t.boolean('is_dismissed').notNullable().defaultTo(false);
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.index(['user_id', 'is_read'], 'idx_alerts_user_is_read');
    t.index('account_id', 'idx_alerts_account_id');
  });

  await knex.schema.createTable('notification_preferences', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.enu('alert_type', ['health_drop', 'activity_gap', 'single_contact', 'follow_up_due']).notNullable();
    t.enu('channel', ['in_app', 'email']).notNullable();
    t.boolean('is_enabled').notNullable().defaultTo(true);
    t.unique(['user_id', 'alert_type', 'channel']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('notification_preferences');
  await knex.schema.dropTableIfExists('alerts');
}
```

- [ ] **Step 7: Create extension tables migration**

```typescript
import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('ai_briefings', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('account_id').notNullable().references('id').inTable('accounts').onDelete('CASCADE');
    t.enu('type', ['onboarding_90day', 'pre_meeting', 'relationship_gap']).notNullable();
    t.text('content').notNullable();
    t.string('model_provider').notNullable();
    t.string('model_id').notNullable();
    t.timestamp('generated_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('expires_at');
  });

  await knex.schema.createTable('integration_connections', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.enu('provider', ['microsoft_365']).notNullable();
    t.text('access_token_encrypted').notNullable();
    t.text('refresh_token_encrypted').notNullable();
    t.specificType('scopes', 'text[]');
    t.timestamp('connected_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('expires_at');
  });

  await knex.schema.createTable('relationship_maps', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('account_id').notNullable().references('id').inTable('accounts').onDelete('CASCADE');
    t.uuid('contact_id').notNullable().references('id').inTable('contacts').onDelete('CASCADE');
    t.uuid('related_contact_id').notNullable().references('id').inTable('contacts').onDelete('CASCADE');
    t.string('relationship_type');
    t.integer('strength').defaultTo(50);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('relationship_maps');
  await knex.schema.dropTableIfExists('integration_connections');
  await knex.schema.dropTableIfExists('ai_briefings');
}
```

- [ ] **Step 8: Run migrations against local PostgreSQL**

Run: `npm run migrate`
Expected: All 7 migrations applied successfully

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: database migrations for all tables (Phase 1 + extension schemas)"
```

---

## Chunk 2: Shared Types, Middleware, Auth & Users

### Task 4: Shared Types and Validation Schemas

**Files:**
- Create: `packages/shared/src/types/user.ts`
- Create: `packages/shared/src/types/account.ts`
- Create: `packages/shared/src/types/contact.ts`
- Create: `packages/shared/src/types/activity.ts`
- Create: `packages/shared/src/types/health.ts`
- Create: `packages/shared/src/types/alert.ts`
- Create: `packages/shared/src/types/api.ts`
- Create: `packages/shared/src/validation/auth.ts`
- Create: `packages/shared/src/validation/account.ts`
- Create: `packages/shared/src/validation/contact.ts`
- Create: `packages/shared/src/validation/activity.ts`
- Create: `packages/shared/src/constants/health.ts`
- Create: `packages/shared/src/constants/enums.ts`
- Modify: `packages/shared/src/types/index.ts`
- Modify: `packages/shared/src/validation/index.ts`
- Modify: `packages/shared/src/constants/index.ts`

- [ ] **Step 1: Write enum constants**

`packages/shared/src/constants/enums.ts`:
```typescript
export const UserRole = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  TEAM_LEAD: 'team_lead',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const AccountTier = {
  ENTERPRISE: 'enterprise',
  MID_MARKET: 'mid_market',
  SMB: 'smb',
} as const;
export type AccountTier = (typeof AccountTier)[keyof typeof AccountTier];

export const AccountStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  CHURNED: 'churned',
  PROSPECT: 'prospect',
} as const;
export type AccountStatus = (typeof AccountStatus)[keyof typeof AccountStatus];

export const RoleLevel = {
  EXECUTIVE: 'executive',
  DIRECTOR: 'director',
  MANAGER: 'manager',
  INDIVIDUAL: 'individual',
} as const;
export type RoleLevel = (typeof RoleLevel)[keyof typeof RoleLevel];

export const ActivityType = {
  MEETING: 'meeting',
  EMAIL: 'email',
  CALL: 'call',
  NOTE: 'note',
  PROPOSAL: 'proposal',
  FOLLOW_UP: 'follow_up',
} as const;
export type ActivityType = (typeof ActivityType)[keyof typeof ActivityType];

export const AlertType = {
  HEALTH_DROP: 'health_drop',
  ACTIVITY_GAP: 'activity_gap',
  SINGLE_CONTACT: 'single_contact',
  FOLLOW_UP_DUE: 'follow_up_due',
} as const;
export type AlertType = (typeof AlertType)[keyof typeof AlertType];

export const Severity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;
export type Severity = (typeof Severity)[keyof typeof Severity];
```

- [ ] **Step 2: Write health constants**

`packages/shared/src/constants/health.ts`:
```typescript
import { ActivityType, AccountTier } from './enums.js';

export const ACTIVITY_POINTS: Record<string, number> = {
  [ActivityType.MEETING]: 10,
  [ActivityType.CALL]: 5,
  [ActivityType.EMAIL]: 3,
  [ActivityType.PROPOSAL]: 8,
  [ActivityType.NOTE]: 1,
  [ActivityType.FOLLOW_UP]: 4,
};

export const TIER_TARGET_POINTS: Record<string, number> = {
  [AccountTier.ENTERPRISE]: 60,
  [AccountTier.MID_MARKET]: 40,
  [AccountTier.SMB]: 20,
};

export const RECENCY_DECAY = [
  { maxDays: 7, multiplier: 1.0 },
  { maxDays: 14, multiplier: 0.75 },
  { maxDays: 21, multiplier: 0.5 },
  { maxDays: 30, multiplier: 0.25 },
];

export const HEALTH_THRESHOLDS = {
  HEALTHY: 80,
  NEEDS_ATTENTION: 60,
  AT_RISK: 40,
} as const;

export const ACTIVITY_GAP_DAYS: Record<string, number> = {
  [AccountTier.ENTERPRISE]: 14,
  [AccountTier.MID_MARKET]: 21,
  [AccountTier.SMB]: 30,
};

export const PROPOSAL_FOLLOW_UP_DAYS = 5;
```

- [ ] **Step 3: Write TypeScript interfaces**

`packages/shared/src/types/user.ts`:
```typescript
import { UserRole } from '../constants/enums.js';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type UserPublic = Omit<User, 'created_at' | 'updated_at'> & {
  created_at: string;
};
```

`packages/shared/src/types/account.ts`:
```typescript
import { AccountTier, AccountStatus } from '../constants/enums.js';

export interface Account {
  id: string;
  name: string;
  industry: string;
  tier: AccountTier;
  website: string | null;
  status: AccountStatus;
  owner_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}
```

`packages/shared/src/types/contact.ts`:
```typescript
import { RoleLevel } from '../constants/enums.js';

export interface Contact {
  id: string;
  account_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  title: string;
  role_level: RoleLevel;
  influence_score: number;
  is_primary: boolean;
  last_interaction_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}
```

`packages/shared/src/types/activity.ts`:
```typescript
import { ActivityType } from '../constants/enums.js';

export interface Activity {
  id: string;
  account_id: string;
  contact_id: string | null;
  user_id: string;
  type: ActivityType;
  title: string;
  description: string | null;
  occurred_at: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}
```

`packages/shared/src/types/health.ts`:
```typescript
export interface HealthScore {
  id: string;
  account_id: string;
  overall_score: number;
  engagement_score: number;
  sentiment_score: number | null;
  renewal_score: number | null;
  momentum_score: number | null;
  factors: Record<string, unknown>;
  calculated_at: string;
}

export interface HealthScoreConfig {
  id: string;
  account_tier: string;
  weight_engagement: number;
  weight_sentiment: number;
  weight_renewal: number;
  weight_momentum: number;
  alert_threshold: number;
}

export type HealthTrend = 'up' | 'down' | 'flat';
```

`packages/shared/src/types/alert.ts`:
```typescript
import { AlertType, Severity } from '../constants/enums.js';

export interface Alert {
  id: string;
  account_id: string;
  user_id: string;
  type: AlertType;
  severity: Severity;
  title: string;
  message: string | null;
  is_read: boolean;
  is_dismissed: boolean;
  created_at: string;
}
```

`packages/shared/src/types/api.ts`:
```typescript
export interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}
```

- [ ] **Step 4: Write Zod validation schemas**

`packages/shared/src/validation/auth.ts`:
```typescript
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  role: z.enum(['admin', 'manager', 'team_lead']),
});

export const updateUserSchema = z.object({
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().min(1).max(100).optional(),
  role: z.enum(['admin', 'manager', 'team_lead']).optional(),
  is_active: z.boolean().optional(),
  password: z.string().min(8).optional(),
});
```

`packages/shared/src/validation/account.ts`:
```typescript
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
```

`packages/shared/src/validation/contact.ts`:
```typescript
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
```

`packages/shared/src/validation/activity.ts`:
```typescript
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
```

- [ ] **Step 5: Update index files**

`packages/shared/src/types/index.ts`:
```typescript
export * from './user.js';
export * from './account.js';
export * from './contact.js';
export * from './activity.js';
export * from './health.js';
export * from './alert.js';
export * from './api.js';
```

`packages/shared/src/validation/index.ts`:
```typescript
export * from './auth.js';
export * from './account.js';
export * from './contact.js';
export * from './activity.js';
```

`packages/shared/src/constants/index.ts`:
```typescript
export * from './enums.js';
export * from './health.js';
```

- [ ] **Step 6: Build shared package and verify**

Run: `npm run build --workspace=packages/shared`
Expected: Compiles without errors

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: shared types, validation schemas, and constants"
```

---

### Task 5: Core Middleware and Express App

**Files:**
- Create: `packages/server/src/core/middleware/error-handler.ts`
- Create: `packages/server/src/core/middleware/auth.ts`
- Create: `packages/server/src/core/middleware/rbac.ts`
- Create: `packages/server/src/core/middleware/validate.ts`
- Create: `packages/server/src/core/middleware/rate-limit.ts`
- Create: `packages/server/src/core/helpers/response.ts`
- Create: `packages/server/src/core/helpers/errors.ts`
- Create: `packages/server/src/app.ts`

- [ ] **Step 1: Write custom error classes**

`packages/server/src/core/helpers/errors.ts`:
```typescript
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(404, 'NOT_FOUND', id ? `${resource} ${id} not found` : `${resource} not found`);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(400, 'VALIDATION_ERROR', message, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(401, 'UNAUTHORIZED', message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(403, 'FORBIDDEN', message);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(409, 'CONFLICT', message, details);
  }
}
```

- [ ] **Step 2: Write response helper**

`packages/server/src/core/helpers/response.ts`:
```typescript
import { Response } from 'express';
import type { PaginationMeta } from '@blackbear/shared';

export function sendSuccess<T>(res: Response, data: T, meta?: PaginationMeta, status = 200) {
  const body: { data: T; meta?: PaginationMeta } = { data };
  if (meta) body.meta = meta;
  return res.status(status).json(body);
}

export function sendCreated<T>(res: Response, data: T) {
  return sendSuccess(res, data, undefined, 201);
}

export function sendNoContent(res: Response) {
  return res.status(204).send();
}
```

- [ ] **Step 3: Write error handler middleware**

`packages/server/src/core/middleware/error-handler.ts`:
```typescript
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../helpers/errors.js';
import { logger } from '../logger.js';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: err.flatten().fieldErrors,
      },
    });
  }

  logger.error(err, 'Unhandled error');
  return res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
  });
}
```

- [ ] **Step 4: Write auth middleware**

`packages/server/src/core/middleware/auth.ts`:
```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { UnauthorizedError } from '../helpers/errors.js';

export interface AuthPayload {
  userId: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new UnauthorizedError());
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, config.JWT_SECRET) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    next(new UnauthorizedError('Invalid or expired token'));
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next();

  const token = header.slice(7);
  try {
    req.user = jwt.verify(token, config.JWT_SECRET) as AuthPayload;
  } catch {
    // Token invalid, continue without auth
  }
  next();
}
```

- [ ] **Step 5: Write RBAC middleware**

`packages/server/src/core/middleware/rbac.ts`:
```typescript
import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '../helpers/errors.js';

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new UnauthorizedError());
    if (!roles.includes(req.user.role)) return next(new ForbiddenError());
    next();
  };
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) return next(new UnauthorizedError());
  if (req.user.role !== 'admin') return next(new ForbiddenError());
  next();
}
```

- [ ] **Step 6: Write validation middleware**

`packages/server/src/core/middleware/validate.ts`:
```typescript
import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export function validateBody(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    req.body = schema.parse(req.body);
    next();
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    req.query = schema.parse(req.query) as any;
    next();
  };
}
```

- [ ] **Step 7: Write rate limit middleware**

`packages/server/src/core/middleware/rate-limit.ts`:
```typescript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redis } from '../queue/setup.js';

const store = new RedisStore({ sendCommand: (...args: string[]) => redis.call(...args) as any });

export const readLimiter = rateLimit({
  windowMs: 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false, store,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
});

export const writeLimiter = rateLimit({
  windowMs: 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false, store,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
});

export const authLimiter = rateLimit({
  windowMs: 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false, store,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many login attempts' } },
});

export const importLimiter = rateLimit({
  windowMs: 60 * 1000, max: 5, standardHeaders: true, legacyHeaders: false, store,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many import requests' } },
});
```

- [ ] **Step 8: Write Express app assembly**

`packages/server/src/app.ts`:
```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { config } from './core/config.js';
import { logger } from './core/logger.js';
import { errorHandler } from './core/middleware/error-handler.js';

export function createApp() {
  const app = express();

  // Security and parsing
  app.use(helmet());
  app.use(cors({ origin: config.CORS_ORIGIN, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());
  app.use(pinoHttp({ logger }));

  // Health check (no auth)
  app.get('/api/health', async (_req, res) => {
    let dbStatus = 'disconnected';
    let redisStatus = 'disconnected';
    try { await db.raw('SELECT 1'); dbStatus = 'connected'; } catch {}
    try { await redis.ping(); redisStatus = 'connected'; } catch {}
    res.json({ status: 'ok', uptime: process.uptime(), database: dbStatus, redis: redisStatus });
  });

  // Routes will be mounted here as modules are built:
  // app.use('/api/auth', authRoutes);
  // app.use('/api/users', userRoutes);
  // app.use('/api/accounts', accountRoutes);
  // etc.

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}
```

- [ ] **Step 9: Verify server compiles**

Run: `cd packages/server && npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: core middleware (auth, RBAC, validation, rate limiting, error handling) and Express app"
```

---

### Task 6: Auth Module

**Files:**
- Create: `packages/server/src/modules/auth/auth.routes.ts`
- Create: `packages/server/src/modules/auth/auth.service.ts`
- Create: `packages/server/src/modules/auth/auth.queries.ts`
- Test: `packages/server/src/modules/auth/auth.service.test.ts`
- Test: `packages/server/src/modules/auth/auth.routes.test.ts`

- [ ] **Step 1: Write auth queries**

`packages/server/src/modules/auth/auth.queries.ts`:
```typescript
import { db } from '../../core/database/connection.js';

export function findUserByEmail(email: string) {
  return db('users').where({ email, is_active: true }).first();
}

export function findUserById(id: string) {
  return db('users').where({ id, is_active: true }).first();
}

export function storeRefreshToken(userId: string, token: string, expiresAt: Date) {
  // For Phase 1, refresh tokens are stateless (stored in httpOnly cookie).
  // If token revocation is needed, add a refresh_tokens table.
  return Promise.resolve();
}
```

- [ ] **Step 2: Write auth service**

`packages/server/src/modules/auth/auth.service.ts`:
```typescript
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../../core/config.js';
import { UnauthorizedError } from '../../core/helpers/errors.js';
import { findUserByEmail, findUserById } from './auth.queries.js';
import type { AuthPayload } from '../../core/middleware/auth.js';

export async function login(email: string, password: string) {
  const user = await findUserByEmail(email);
  if (!user) throw new UnauthorizedError('Invalid email or password');

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw new UnauthorizedError('Invalid email or password');

  const payload: AuthPayload = { userId: user.id, email: user.email, role: user.role };
  const accessToken = jwt.sign(payload, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRY });
  const refreshToken = jwt.sign(payload, config.JWT_SECRET, { expiresIn: config.JWT_REFRESH_EXPIRY });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
    },
  };
}

export async function refreshAccessToken(refreshToken: string) {
  try {
    const payload = jwt.verify(refreshToken, config.JWT_SECRET) as AuthPayload;
    const user = await findUserById(payload.userId);
    if (!user) throw new UnauthorizedError();

    const newPayload: AuthPayload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = jwt.sign(newPayload, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRY });
    return { accessToken };
  } catch {
    throw new UnauthorizedError('Invalid refresh token');
  }
}

export async function getMe(userId: string) {
  const user = await findUserById(userId);
  if (!user) throw new UnauthorizedError();
  const { password_hash, ...publicUser } = user;
  return publicUser;
}
```

- [ ] **Step 3: Write auth routes**

`packages/server/src/modules/auth/auth.routes.ts`:
```typescript
import { Router } from 'express';
import { loginSchema } from '@blackbear/shared';
import { validateBody } from '../../core/middleware/validate.js';
import { authenticate } from '../../core/middleware/auth.js';
import { authLimiter } from '../../core/middleware/rate-limit.js';
import { sendSuccess } from '../../core/helpers/response.js';
import * as authService from './auth.service.js';

const router = Router();

router.post('/login', authLimiter, validateBody(loginSchema), async (req, res, next) => {
  try {
    const { accessToken, refreshToken, user } = await authService.login(req.body.email, req.body.password);
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    sendSuccess(res, { accessToken, user });
  } catch (err) {
    next(err);
  }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'No refresh token' } });
    const result = await authService.refreshAccessToken(token);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

router.post('/logout', (_req, res) => {
  res.clearCookie('refreshToken');
  res.status(204).send();
});

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user!.userId);
    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
});

// Phase 2 stubs
router.post('/forgot-password', (_req, res) => {
  res.status(501).json({ error: { code: 'NOT_IMPLEMENTED', message: 'Self-service password reset available in Phase 2' } });
});
router.post('/reset-password', (_req, res) => {
  res.status(501).json({ error: { code: 'NOT_IMPLEMENTED', message: 'Self-service password reset available in Phase 2' } });
});

export const authRoutes = router;
```

- [ ] **Step 4: Write auth service tests**

`packages/server/src/modules/auth/auth.service.test.ts`:
```typescript
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { login, refreshAccessToken, getMe } from './auth.service';
import * as queries from './auth.queries';

jest.mock('./auth.queries');

const mockUser = {
  id: '123',
  email: 'test@test.com',
  password_hash: bcrypt.hashSync('password123', 10),
  first_name: 'Test',
  last_name: 'User',
  role: 'manager',
  is_active: true,
};

describe('auth.service', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('login', () => {
    it('returns tokens and user for valid credentials', async () => {
      (queries.findUserByEmail as jest.Mock).mockResolvedValue(mockUser);
      const result = await login('test@test.com', 'password123');
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user.email).toBe('test@test.com');
    });

    it('throws for invalid email', async () => {
      (queries.findUserByEmail as jest.Mock).mockResolvedValue(null);
      await expect(login('bad@test.com', 'password123')).rejects.toThrow('Invalid email or password');
    });

    it('throws for invalid password', async () => {
      (queries.findUserByEmail as jest.Mock).mockResolvedValue(mockUser);
      await expect(login('test@test.com', 'wrong')).rejects.toThrow('Invalid email or password');
    });
  });
});
```

- [ ] **Step 5: Run tests**

Run: `npm test --workspace=packages/server -- --testPathPattern=auth.service`
Expected: 3 tests pass

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: auth module (login, logout, refresh, me) with tests"
```

---

### Task 7: User Management Module

**Files:**
- Create: `packages/server/src/modules/auth/users.routes.ts`
- Create: `packages/server/src/modules/auth/users.service.ts`
- Create: `packages/server/src/modules/auth/users.queries.ts`
- Create: `packages/server/src/scripts/seed-admin.ts`
- Test: `packages/server/src/modules/auth/users.service.test.ts`

- [ ] **Step 1: Write user queries**

`packages/server/src/modules/auth/users.queries.ts`:
```typescript
import { db } from '../../core/database/connection.js';

export function listUsers() {
  return db('users').select('id', 'email', 'first_name', 'last_name', 'role', 'is_active', 'created_at').orderBy('last_name');
}

export function findUserById(id: string) {
  return db('users').where({ id }).first();
}

export function findUserByEmail(email: string) {
  return db('users').where({ email }).first();
}

export function insertUser(data: Record<string, unknown>) {
  return db('users').insert(data).returning('*');
}

export function updateUser(id: string, data: Record<string, unknown>) {
  return db('users').where({ id }).update({ ...data, updated_at: db.fn.now() }).returning('*');
}
```

- [ ] **Step 2: Write user service**

`packages/server/src/modules/auth/users.service.ts`:
```typescript
import bcrypt from 'bcryptjs';
import { ConflictError, NotFoundError } from '../../core/helpers/errors.js';
import * as queries from './users.queries.js';

export async function listUsers() {
  return queries.listUsers();
}

export async function createUser(data: { email: string; password: string; first_name: string; last_name: string; role: string }) {
  const existing = await queries.findUserByEmail(data.email);
  if (existing) throw new ConflictError('Email already in use');

  const password_hash = await bcrypt.hash(data.password, 12);
  const [user] = await queries.insertUser({
    email: data.email,
    password_hash,
    first_name: data.first_name,
    last_name: data.last_name,
    role: data.role,
  });
  const { password_hash: _, ...publicUser } = user;
  return publicUser;
}

export async function updateUser(id: string, data: Record<string, unknown>) {
  const existing = await queries.findUserById(id);
  if (!existing) throw new NotFoundError('User', id);

  const updateData = { ...data };
  if (typeof data.password === 'string') {
    updateData.password_hash = await bcrypt.hash(data.password, 12);
    delete updateData.password;
  }

  const [user] = await queries.updateUser(id, updateData);
  const { password_hash: _, ...publicUser } = user;
  return publicUser;
}

export async function deactivateUser(id: string) {
  const existing = await queries.findUserById(id);
  if (!existing) throw new NotFoundError('User', id);
  await queries.updateUser(id, { is_active: false });
}
```

- [ ] **Step 3: Write user routes**

`packages/server/src/modules/auth/users.routes.ts`:
```typescript
import { Router } from 'express';
import { createUserSchema, updateUserSchema } from '@blackbear/shared';
import { authenticate } from '../../core/middleware/auth.js';
import { requireAdmin } from '../../core/middleware/rbac.js';
import { validateBody } from '../../core/middleware/validate.js';
import { sendSuccess, sendCreated, sendNoContent } from '../../core/helpers/response.js';
import * as usersService from './users.service.js';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/', async (_req, res, next) => {
  try {
    const users = await usersService.listUsers();
    sendSuccess(res, users);
  } catch (err) { next(err); }
});

router.post('/', validateBody(createUserSchema), async (req, res, next) => {
  try {
    const user = await usersService.createUser(req.body);
    sendCreated(res, user);
  } catch (err) { next(err); }
});

router.put('/:id', validateBody(updateUserSchema), async (req, res, next) => {
  try {
    const user = await usersService.updateUser(req.params.id, req.body);
    sendSuccess(res, user);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await usersService.deactivateUser(req.params.id);
    sendNoContent(res);
  } catch (err) { next(err); }
});

export const userRoutes = router;
```

- [ ] **Step 4: Write admin seed script**

`packages/server/src/scripts/seed-admin.ts`:
```typescript
import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

import bcrypt from 'bcryptjs';
import { db } from '../core/database/connection.js';

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env');
    process.exit(1);
  }

  const existing = await db('users').where({ email }).first();
  if (existing) {
    console.log(`Admin user ${email} already exists`);
    process.exit(0);
  }

  const password_hash = await bcrypt.hash(password, 12);
  await db('users').insert({
    email,
    password_hash,
    first_name: 'Admin',
    last_name: 'User',
    role: 'admin',
    is_active: true,
  });

  console.log(`Admin user ${email} created successfully`);
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error('Failed to seed admin:', err);
  process.exit(1);
});
```

- [ ] **Step 5: Mount auth and user routes in app.ts**

Update `packages/server/src/app.ts` to import and mount:
```typescript
import { authRoutes } from './modules/auth/auth.routes.js';
import { userRoutes } from './modules/auth/users.routes.js';

// After middleware setup:
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
```

- [ ] **Step 6: Run tests**

Run: `npm test --workspace=packages/server`
Expected: All tests pass

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: user management (CRUD, admin seed script) with RBAC"
```

---

## Chunk 3: Core CRUD Modules

### Task 8: Accounts Module

**Files:**
- Create: `packages/server/src/modules/accounts/accounts.queries.ts`
- Create: `packages/server/src/modules/accounts/accounts.service.ts`
- Create: `packages/server/src/modules/accounts/accounts.routes.ts`
- Test: `packages/server/src/modules/accounts/accounts.service.test.ts`

- [ ] **Step 1: Write account queries**

`packages/server/src/modules/accounts/accounts.queries.ts`:
```typescript
import { db } from '../../core/database/connection.js';

interface ListParams {
  q?: string;
  industry?: string;
  tier?: string;
  status?: string;
  owner_id?: string;
  page: number;
  limit: number;
  sort: string;
  order: string;
}

export async function listAccounts(params: ListParams, userId: string, userRole: string) {
  let query = db('accounts');

  // RBAC: managers see only own accounts
  if (userRole === 'manager') {
    query = query.where('owner_id', userId);
  }

  if (params.q) {
    query = query.where(function () {
      this.whereILike('name', `%${params.q}%`).orWhereILike('industry', `%${params.q}%`);
    });
  }
  if (params.industry) query = query.where('industry', params.industry);
  if (params.tier) query = query.where('tier', params.tier);
  if (params.status) query = query.where('status', params.status);
  if (params.owner_id) query = query.where('owner_id', params.owner_id);

  const countResult = await query.clone().count('id as total').first();
  const total = Number(countResult?.total ?? 0);

  const rows = await query
    .select('accounts.*')
    .orderBy(params.sort, params.order)
    .limit(params.limit)
    .offset((params.page - 1) * params.limit);

  return { rows, total };
}

export function findAccountById(id: string) {
  return db('accounts').where({ id }).first();
}

export function insertAccount(data: Record<string, unknown>) {
  return db('accounts').insert(data).returning('*');
}

export function updateAccount(id: string, data: Record<string, unknown>) {
  return db('accounts').where({ id }).update({ ...data, updated_at: db.fn.now() }).returning('*');
}

export function deleteAccount(id: string) {
  return db('accounts').where({ id }).del();
}
```

- [ ] **Step 2: Write account service**

`packages/server/src/modules/accounts/accounts.service.ts`:
```typescript
import { NotFoundError, ForbiddenError } from '../../core/helpers/errors.js';
import * as queries from './accounts.queries.js';

export async function listAccounts(params: any, userId: string, userRole: string) {
  const { rows, total } = await queries.listAccounts(params, userId, userRole);
  return {
    data: rows,
    meta: { page: params.page, limit: params.limit, total },
  };
}

export async function getAccount(id: string, userId: string, userRole: string) {
  const account = await queries.findAccountById(id);
  if (!account) throw new NotFoundError('Account', id);
  if (userRole === 'manager' && account.owner_id !== userId) {
    throw new ForbiddenError();
  }
  return account;
}

export async function createAccount(data: Record<string, unknown>, userId: string) {
  if (!data.owner_id) data.owner_id = userId;
  const [account] = await queries.insertAccount(data);
  return account;
}

export async function updateAccount(id: string, data: Record<string, unknown>, userId: string, userRole: string) {
  const existing = await queries.findAccountById(id);
  if (!existing) throw new NotFoundError('Account', id);
  if (userRole === 'manager' && existing.owner_id !== userId) throw new ForbiddenError();
  // Only admin and team_lead can reassign owner
  if (data.owner_id && data.owner_id !== existing.owner_id && userRole === 'manager') {
    throw new ForbiddenError('Cannot reassign account owner');
  }
  const [account] = await queries.updateAccount(id, data);
  return account;
}

export async function deleteAccount(id: string, userRole: string) {
  if (userRole !== 'admin') throw new ForbiddenError();
  const existing = await queries.findAccountById(id);
  if (!existing) throw new NotFoundError('Account', id);
  await queries.deleteAccount(id);
}
```

- [ ] **Step 3: Write account routes**

`packages/server/src/modules/accounts/accounts.routes.ts`:
```typescript
import { Router } from 'express';
import { createAccountSchema, updateAccountSchema, accountQuerySchema } from '@blackbear/shared';
import { authenticate } from '../../core/middleware/auth.js';
import { validateBody, validateQuery } from '../../core/middleware/validate.js';
import { sendSuccess, sendCreated, sendNoContent } from '../../core/helpers/response.js';
import * as accountsService from './accounts.service.js';

const router = Router();
router.use(authenticate);

router.get('/', validateQuery(accountQuerySchema), async (req, res, next) => {
  try {
    const result = await accountsService.listAccounts(req.query, req.user!.userId, req.user!.role);
    res.json(result);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const account = await accountsService.getAccount(req.params.id, req.user!.userId, req.user!.role);
    sendSuccess(res, account);
  } catch (err) { next(err); }
});

router.post('/', validateBody(createAccountSchema), async (req, res, next) => {
  try {
    const account = await accountsService.createAccount(req.body, req.user!.userId);
    sendCreated(res, account);
  } catch (err) { next(err); }
});

router.put('/:id', validateBody(updateAccountSchema), async (req, res, next) => {
  try {
    const account = await accountsService.updateAccount(req.params.id, req.body, req.user!.userId, req.user!.role);
    sendSuccess(res, account);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await accountsService.deleteAccount(req.params.id, req.user!.role);
    sendNoContent(res);
  } catch (err) { next(err); }
});

export const accountRoutes = router;
```

- [ ] **Step 4: Mount in app.ts**

Add to `packages/server/src/app.ts`:
```typescript
import { accountRoutes } from './modules/accounts/accounts.routes.js';
app.use('/api/accounts', accountRoutes);
```

- [ ] **Step 5: Write account service tests**

`packages/server/src/modules/accounts/accounts.service.test.ts`:
```typescript
import { getAccount, createAccount, deleteAccount } from './accounts.service';
import * as queries from './accounts.queries';

jest.mock('./accounts.queries');

const mockAccount = {
  id: 'acc-1',
  name: 'Test Corp',
  industry: 'tech',
  tier: 'enterprise',
  status: 'active',
  owner_id: 'user-1',
};

describe('accounts.service', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getAccount', () => {
    it('returns account for admin', async () => {
      (queries.findAccountById as jest.Mock).mockResolvedValue(mockAccount);
      const result = await getAccount('acc-1', 'user-2', 'admin');
      expect(result.name).toBe('Test Corp');
    });

    it('returns account for owner', async () => {
      (queries.findAccountById as jest.Mock).mockResolvedValue(mockAccount);
      const result = await getAccount('acc-1', 'user-1', 'manager');
      expect(result.name).toBe('Test Corp');
    });

    it('throws Forbidden for non-owner manager', async () => {
      (queries.findAccountById as jest.Mock).mockResolvedValue(mockAccount);
      await expect(getAccount('acc-1', 'user-2', 'manager')).rejects.toThrow('Insufficient permissions');
    });

    it('throws NotFound for missing account', async () => {
      (queries.findAccountById as jest.Mock).mockResolvedValue(null);
      await expect(getAccount('bad', 'user-1', 'admin')).rejects.toThrow('not found');
    });
  });

  describe('deleteAccount', () => {
    it('allows admin to delete', async () => {
      (queries.findAccountById as jest.Mock).mockResolvedValue(mockAccount);
      (queries.deleteAccount as jest.Mock).mockResolvedValue(1);
      await deleteAccount('acc-1', 'admin');
      expect(queries.deleteAccount).toHaveBeenCalledWith('acc-1');
    });

    it('denies non-admin delete', async () => {
      await expect(deleteAccount('acc-1', 'manager')).rejects.toThrow('Insufficient permissions');
    });
  });
});
```

- [ ] **Step 6: Run tests**

Run: `npm test --workspace=packages/server -- --testPathPattern=accounts`
Expected: All tests pass

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: accounts module (CRUD with RBAC, search, pagination)"
```

---

### Task 9: Contacts Module

**Files:**
- Create: `packages/server/src/modules/contacts/contacts.queries.ts`
- Create: `packages/server/src/modules/contacts/contacts.service.ts`
- Create: `packages/server/src/modules/contacts/contacts.routes.ts`
- Test: `packages/server/src/modules/contacts/contacts.service.test.ts`

- [ ] **Step 1: Write contact queries**

`packages/server/src/modules/contacts/contacts.queries.ts`:
```typescript
import { db } from '../../core/database/connection.js';

export function listByAccount(accountId: string, params: any) {
  let query = db('contacts').where('account_id', accountId);
  return query.orderBy(params.sort, params.order)
    .limit(params.limit)
    .offset((params.page - 1) * params.limit);
}

export function countByAccount(accountId: string) {
  return db('contacts').where('account_id', accountId).count('id as total').first();
}

export async function searchContacts(params: any) {
  let query = db('contacts');

  // RBAC: if ownerFilter is set, only return contacts from accounts owned by that user
  if (params.ownerFilter) {
    query = query.whereIn('account_id',
      db('accounts').where('owner_id', params.ownerFilter).select('id'));
  }

  if (params.q) {
    query = query.where(function () {
      this.whereILike('first_name', `%${params.q}%`)
        .orWhereILike('last_name', `%${params.q}%`)
        .orWhereILike('email', `%${params.q}%`)
        .orWhereILike('title', `%${params.q}%`);
    });
  }
  const countResult = await query.clone().count('id as total').first();
  const total = Number(countResult?.total ?? 0);
  const rows = await query.orderBy(params.sort, params.order)
    .limit(params.limit).offset((params.page - 1) * params.limit);
  return { rows, total };
}

export function findContactById(id: string) {
  return db('contacts').where({ id }).first();
}

export function insertContact(data: Record<string, unknown>) {
  return db('contacts').insert(data).returning('*');
}

export function updateContact(id: string, data: Record<string, unknown>) {
  return db('contacts').where({ id }).update({ ...data, updated_at: db.fn.now() }).returning('*');
}

export function deleteContact(id: string) {
  return db('contacts').where({ id }).del();
}
```

- [ ] **Step 2: Write contact service**

`packages/server/src/modules/contacts/contacts.service.ts`:
```typescript
import { NotFoundError, ForbiddenError } from '../../core/helpers/errors.js';
import * as queries from './contacts.queries.js';
import { findAccountById } from '../accounts/accounts.queries.js';

async function checkAccountAccess(accountId: string, userId: string, userRole: string) {
  const account = await findAccountById(accountId);
  if (!account) throw new NotFoundError('Account', accountId);
  if (userRole === 'manager' && account.owner_id !== userId) throw new ForbiddenError();
  return account;
}

export async function listByAccount(accountId: string, params: any, userId: string, userRole: string) {
  await checkAccountAccess(accountId, userId, userRole);
  const rows = await queries.listByAccount(accountId, params);
  const countResult = await queries.countByAccount(accountId);
  const total = Number(countResult?.total ?? 0);
  return { data: rows, meta: { page: params.page, limit: params.limit, total } };
}

export async function searchContacts(params: any, userId: string, userRole: string) {
  // RBAC: managers can only search contacts in their own accounts
  if (userRole === 'manager') {
    params.ownerFilter = userId;
  }
  const { rows, total } = await queries.searchContacts(params);
  return { data: rows, meta: { page: params.page, limit: params.limit, total } };
}

export async function createContact(accountId: string, data: Record<string, unknown>, userId: string, userRole: string) {
  await checkAccountAccess(accountId, userId, userRole);
  const [contact] = await queries.insertContact({ ...data, account_id: accountId });
  return contact;
}

export async function updateContact(id: string, data: Record<string, unknown>, userId: string, userRole: string) {
  const contact = await queries.findContactById(id);
  if (!contact) throw new NotFoundError('Contact', id);
  await checkAccountAccess(contact.account_id, userId, userRole);
  const [updated] = await queries.updateContact(id, data);
  return updated;
}

export async function deleteContact(id: string, userId: string, userRole: string) {
  const contact = await queries.findContactById(id);
  if (!contact) throw new NotFoundError('Contact', id);
  await checkAccountAccess(contact.account_id, userId, userRole);
  await queries.deleteContact(id);
}
```

- [ ] **Step 3: Write contact routes**

`packages/server/src/modules/contacts/contacts.routes.ts`:
```typescript
import { Router } from 'express';
import { createContactSchema, updateContactSchema, contactQuerySchema } from '@blackbear/shared';
import { authenticate } from '../../core/middleware/auth.js';
import { validateBody, validateQuery } from '../../core/middleware/validate.js';
import { sendSuccess, sendCreated, sendNoContent } from '../../core/helpers/response.js';
import * as contactsService from './contacts.service.js';

const accountContactsRouter = Router({ mergeParams: true });
const contactsRouter = Router();

accountContactsRouter.use(authenticate);
contactsRouter.use(authenticate);

// GET /api/accounts/:id/contacts
accountContactsRouter.get('/', validateQuery(contactQuerySchema), async (req, res, next) => {
  try {
    const result = await contactsService.listByAccount(req.params.id, req.query, req.user!.userId, req.user!.role);
    res.json(result);
  } catch (err) { next(err); }
});

// POST /api/accounts/:id/contacts
accountContactsRouter.post('/', validateBody(createContactSchema), async (req, res, next) => {
  try {
    const contact = await contactsService.createContact(req.params.id, req.body, req.user!.userId, req.user!.role);
    sendCreated(res, contact);
  } catch (err) { next(err); }
});

// GET /api/contacts (global search)
contactsRouter.get('/', validateQuery(contactQuerySchema), async (req, res, next) => {
  try {
    const result = await contactsService.searchContacts(req.query, req.user!.userId, req.user!.role);
    res.json(result);
  } catch (err) { next(err); }
});

// PUT /api/contacts/:id
contactsRouter.put('/:id', validateBody(updateContactSchema), async (req, res, next) => {
  try {
    const contact = await contactsService.updateContact(req.params.id, req.body, req.user!.userId, req.user!.role);
    sendSuccess(res, contact);
  } catch (err) { next(err); }
});

// DELETE /api/contacts/:id
contactsRouter.delete('/:id', async (req, res, next) => {
  try {
    await contactsService.deleteContact(req.params.id, req.user!.userId, req.user!.role);
    sendNoContent(res);
  } catch (err) { next(err); }
});

export { accountContactsRouter, contactsRouter };
```

- [ ] **Step 4: Mount in app.ts**

```typescript
import { accountContactsRouter, contactsRouter } from './modules/contacts/contacts.routes.js';
app.use('/api/accounts/:id/contacts', accountContactsRouter);
app.use('/api/contacts', contactsRouter);
```

- [ ] **Step 5: Run tests**

Run: `npm test --workspace=packages/server`
Expected: All tests pass

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: contacts module (account-scoped CRUD, global search)"
```

---

### Task 10: Activities Module

**Files:**
- Create: `packages/server/src/modules/activities/activities.queries.ts`
- Create: `packages/server/src/modules/activities/activities.service.ts`
- Create: `packages/server/src/modules/activities/activities.routes.ts`
- Test: `packages/server/src/modules/activities/activities.service.test.ts`

- [ ] **Step 1: Write activity queries**

`packages/server/src/modules/activities/activities.queries.ts`:
```typescript
import { db } from '../../core/database/connection.js';

export async function listActivities(params: any, userId: string, userRole: string) {
  let query = db('activities');

  if (userRole === 'manager') {
    query = query.where('activities.user_id', userId);
  }
  if (params.account_id) query = query.where('account_id', params.account_id);
  if (params.type) query = query.where('type', params.type);

  const countResult = await query.clone().count('id as total').first();
  const total = Number(countResult?.total ?? 0);
  const rows = await query.orderBy(params.sort, params.order)
    .limit(params.limit).offset((params.page - 1) * params.limit);
  return { rows, total };
}

export function getAccountTimeline(accountId: string, limit = 50, offset = 0) {
  return db('activities')
    .where('account_id', accountId)
    .orderBy('occurred_at', 'desc')
    .limit(limit)
    .offset(offset);
}

export function findActivityById(id: string) {
  return db('activities').where({ id }).first();
}

export function insertActivity(data: Record<string, unknown>) {
  return db('activities').insert(data).returning('*');
}

export function updateActivity(id: string, data: Record<string, unknown>) {
  return db('activities').where({ id }).update({ ...data, updated_at: db.fn.now() }).returning('*');
}

export function deleteActivity(id: string) {
  return db('activities').where({ id }).del();
}
```

- [ ] **Step 2: Write activity service**

`packages/server/src/modules/activities/activities.service.ts`:
```typescript
import { NotFoundError, ForbiddenError } from '../../core/helpers/errors.js';
import * as queries from './activities.queries.js';
import { findAccountById } from '../accounts/accounts.queries.js';

export async function listActivities(params: any, userId: string, userRole: string) {
  const { rows, total } = await queries.listActivities(params, userId, userRole);
  return { data: rows, meta: { page: params.page, limit: params.limit, total } };
}

export async function getAccountTimeline(accountId: string, userId: string, userRole: string) {
  const account = await findAccountById(accountId);
  if (!account) throw new NotFoundError('Account', accountId);
  if (userRole === 'manager' && account.owner_id !== userId) throw new ForbiddenError();
  const activities = await queries.getAccountTimeline(accountId);
  return activities;
}

export async function createActivity(data: Record<string, unknown>, userId: string, userRole: string) {
  const account = await findAccountById(data.account_id as string);
  if (!account) throw new NotFoundError('Account', data.account_id as string);
  if (userRole === 'manager' && account.owner_id !== userId) throw new ForbiddenError();

  const [activity] = await queries.insertActivity({ ...data, user_id: userId });

  // Update contact last_interaction_at if contact is specified
  if (activity.contact_id) {
    const { db } = await import('../../core/database/connection.js');
    await db('contacts').where({ id: activity.contact_id }).update({ last_interaction_at: activity.occurred_at });
  }

  // Trigger health score recalculation
  healthQueue.add('calculateAccountHealth', { accountId: activity.account_id });

  // Emit activity:created event
  const { publishSocketEvent } = await import('../../core/websocket/socket.js');
  publishSocketEvent('activity:created', activity, userId);

  return activity;
}

export async function updateActivity(id: string, data: Record<string, unknown>, userId: string, userRole: string) {
  const activity = await queries.findActivityById(id);
  if (!activity) throw new NotFoundError('Activity', id);
  const account = await findAccountById(activity.account_id);
  if (userRole === 'manager' && account.owner_id !== userId) throw new ForbiddenError();
  const [updated] = await queries.updateActivity(id, data);
  return updated;
}

export async function deleteActivity(id: string, userId: string, userRole: string) {
  const activity = await queries.findActivityById(id);
  if (!activity) throw new NotFoundError('Activity', id);
  const account = await findAccountById(activity.account_id);
  if (userRole === 'manager' && account.owner_id !== userId) throw new ForbiddenError();
  await queries.deleteActivity(id);
}
```

- [ ] **Step 3: Write activity routes**

`packages/server/src/modules/activities/activities.routes.ts`:
```typescript
import { Router } from 'express';
import { createActivitySchema, updateActivitySchema, activityQuerySchema } from '@blackbear/shared';
import { authenticate } from '../../core/middleware/auth.js';
import { validateBody, validateQuery } from '../../core/middleware/validate.js';
import { sendSuccess, sendCreated, sendNoContent } from '../../core/helpers/response.js';
import * as activitiesService from './activities.service.js';

const router = Router();
router.use(authenticate);

router.get('/', validateQuery(activityQuerySchema), async (req, res, next) => {
  try {
    const result = await activitiesService.listActivities(req.query, req.user!.userId, req.user!.role);
    res.json(result);
  } catch (err) { next(err); }
});

router.post('/', validateBody(createActivitySchema), async (req, res, next) => {
  try {
    const activity = await activitiesService.createActivity(req.body, req.user!.userId, req.user!.role);
    sendCreated(res, activity);
  } catch (err) { next(err); }
});

router.put('/:id', validateBody(updateActivitySchema), async (req, res, next) => {
  try {
    const activity = await activitiesService.updateActivity(req.params.id, req.body, req.user!.userId, req.user!.role);
    sendSuccess(res, activity);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await activitiesService.deleteActivity(req.params.id, req.user!.userId, req.user!.role);
    sendNoContent(res);
  } catch (err) { next(err); }
});

export const activityRoutes = router;
```

Also create a timeline route on the accounts router. Add to `packages/server/src/modules/accounts/accounts.routes.ts`:
```typescript
import { getAccountTimeline } from '../activities/activities.service.js';

// GET /api/accounts/:id/timeline
router.get('/:id/timeline', async (req, res, next) => {
  try {
    const activities = await getAccountTimeline(req.params.id, req.user!.userId, req.user!.role);
    sendSuccess(res, activities);
  } catch (err) { next(err); }
});
```

- [ ] **Step 4: Mount in app.ts**

```typescript
import { activityRoutes } from './modules/activities/activities.routes.js';
app.use('/api/activities', activityRoutes);
```

- [ ] **Step 5: Run tests**

Run: `npm test --workspace=packages/server`
Expected: All tests pass

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: activities module (CRUD, timeline, contact interaction tracking)"
```

---

## Chunk 4: Health Scoring, Alerts, WebSocket, and Worker

### Task 11: Health Scoring Engine

**Files:**
- Create: `packages/server/src/modules/health/health.queries.ts`
- Create: `packages/server/src/modules/health/health.service.ts`
- Create: `packages/server/src/modules/health/health.calculator.ts`
- Create: `packages/server/src/modules/health/health.routes.ts`
- Create: `packages/server/src/core/queue/setup.ts`
- Create: `packages/server/src/core/queue/health-queue.ts`
- Test: `packages/server/src/modules/health/health.calculator.test.ts`

- [ ] **Step 1: Write Redis and Bull queue setup**

`packages/server/src/core/queue/setup.ts`:
```typescript
import Redis from 'ioredis';
import { config } from '../config.js';

export const redis = new Redis(config.REDIS_URL, { maxRetriesPerRequest: null });

export function createQueue(name: string) {
  const Bull = require('bull');
  return new Bull(name, { createClient: () => new Redis(config.REDIS_URL, { maxRetriesPerRequest: null }) });
}
```

`packages/server/src/core/queue/health-queue.ts`:
```typescript
import Bull from 'bull';
import { config } from '../config.js';

export const healthQueue = new Bull('health-scoring', config.REDIS_URL);
export const alertQueue = new Bull('alerts', config.REDIS_URL);
```

- [ ] **Step 2: Write health calculator (pure function, easy to test)**

`packages/server/src/modules/health/health.calculator.ts`:
```typescript
import { ACTIVITY_POINTS, TIER_TARGET_POINTS, RECENCY_DECAY } from '@blackbear/shared';

interface ActivityInput {
  type: string;
  occurred_at: string;
}

export function calculateEngagementScore(activities: ActivityInput[], tier: string, now = new Date()): number {
  if (activities.length === 0) return 0;

  let totalPoints = 0;

  for (const activity of activities) {
    const activityDate = new Date(activity.occurred_at);
    const daysSince = Math.floor((now.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSince > 30) continue;

    const basePoints = ACTIVITY_POINTS[activity.type] ?? 0;
    const decay = RECENCY_DECAY.find((d) => daysSince <= d.maxDays);
    const multiplier = decay?.multiplier ?? 0;

    totalPoints += basePoints * multiplier;
  }

  const target = TIER_TARGET_POINTS[tier] ?? 40;
  const score = Math.round((totalPoints / target) * 100);
  return Math.min(score, 100);
}

export function calculateTrend(currentScore: number, previousScore: number | null): 'up' | 'down' | 'flat' {
  if (previousScore === null) return 'flat';
  const diff = currentScore - previousScore;
  if (diff >= 5) return 'up';
  if (diff <= -5) return 'down';
  return 'flat';
}

export function getHealthColor(score: number): string {
  if (score >= 80) return 'green';
  if (score >= 60) return 'yellow';
  if (score >= 40) return 'orange';
  return 'red';
}
```

- [ ] **Step 3: Write health calculator tests**

`packages/server/src/modules/health/health.calculator.test.ts`:
```typescript
import { calculateEngagementScore, calculateTrend, getHealthColor } from './health.calculator';

describe('health.calculator', () => {
  const now = new Date('2026-03-16T12:00:00Z');

  describe('calculateEngagementScore', () => {
    it('returns 0 for no activities', () => {
      expect(calculateEngagementScore([], 'enterprise', now)).toBe(0);
    });

    it('scores a meeting at full value within 7 days', () => {
      const activities = [{ type: 'meeting', occurred_at: '2026-03-14T10:00:00Z' }];
      // 10 points / 60 target * 100 = 16.67 -> 17
      expect(calculateEngagementScore(activities, 'enterprise', now)).toBe(17);
    });

    it('applies decay for older activities', () => {
      const activities = [{ type: 'meeting', occurred_at: '2026-03-02T10:00:00Z' }];
      // 14 days old -> 75% decay -> 7.5 / 60 * 100 = 12.5 -> 13
      expect(calculateEngagementScore(activities, 'enterprise', now)).toBe(13);
    });

    it('caps at 100', () => {
      const activities = Array.from({ length: 20 }, (_, i) => ({
        type: 'meeting',
        occurred_at: new Date(now.getTime() - i * 24 * 60 * 60 * 1000).toISOString(),
      }));
      expect(calculateEngagementScore(activities, 'smb', now)).toBe(100);
    });

    it('uses different targets per tier', () => {
      const activities = [{ type: 'meeting', occurred_at: '2026-03-14T10:00:00Z' }];
      const enterprise = calculateEngagementScore(activities, 'enterprise', now);
      const smb = calculateEngagementScore(activities, 'smb', now);
      expect(smb).toBeGreaterThan(enterprise); // SMB target is lower
    });
  });

  describe('calculateTrend', () => {
    it('returns up for +5 or more', () => {
      expect(calculateTrend(75, 70)).toBe('up');
    });
    it('returns down for -5 or more', () => {
      expect(calculateTrend(65, 70)).toBe('down');
    });
    it('returns flat for small changes', () => {
      expect(calculateTrend(72, 70)).toBe('flat');
    });
    it('returns flat for null previous', () => {
      expect(calculateTrend(50, null)).toBe('flat');
    });
  });

  describe('getHealthColor', () => {
    it('returns green for 80+', () => { expect(getHealthColor(85)).toBe('green'); });
    it('returns yellow for 60-79', () => { expect(getHealthColor(65)).toBe('yellow'); });
    it('returns orange for 40-59', () => { expect(getHealthColor(45)).toBe('orange'); });
    it('returns red for 0-39', () => { expect(getHealthColor(20)).toBe('red'); });
  });
});
```

- [ ] **Step 4: Run calculator tests**

Run: `npm test --workspace=packages/server -- --testPathPattern=health.calculator`
Expected: All tests pass

- [ ] **Step 5: Write health queries and service**

`packages/server/src/modules/health/health.queries.ts`:
```typescript
import { db } from '../../core/database/connection.js';

export function getLatestScore(accountId: string) {
  return db('health_scores').where({ account_id: accountId }).orderBy('calculated_at', 'desc').first();
}

export function getScoreHistory(accountId: string, days = 90) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return db('health_scores').where('account_id', accountId)
    .where('calculated_at', '>=', since).orderBy('calculated_at', 'asc');
}

export function getScoreFromDaysAgo(accountId: string, days: number) {
  const target = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return db('health_scores').where('account_id', accountId)
    .where('calculated_at', '<=', target).orderBy('calculated_at', 'desc').first();
}

export function insertScore(data: Record<string, unknown>) {
  return db('health_scores').insert(data).returning('*');
}

export function getConfig(tier: string) {
  return db('health_score_config').where({ account_tier: tier }).first();
}

export function listConfig() {
  return db('health_score_config').orderBy('account_tier');
}

export function updateConfig(tier: string, data: Record<string, unknown>) {
  return db('health_score_config').where({ account_tier: tier })
    .update({ ...data, updated_at: db.fn.now() }).returning('*');
}

export function getActivitiesForScoring(accountId: string, days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return db('activities').where('account_id', accountId)
    .where('occurred_at', '>=', since).select('type', 'occurred_at');
}
```

`packages/server/src/modules/health/health.service.ts`:
```typescript
import * as queries from './health.queries.js';
import { calculateEngagementScore, calculateTrend, getHealthColor } from './health.calculator.js';
import { findAccountById } from '../accounts/accounts.queries.js';
import { NotFoundError } from '../../core/helpers/errors.js';
import { logger } from '../../core/logger.js';

export async function calculateAndStoreHealth(accountId: string) {
  const account = await findAccountById(accountId);
  if (!account) throw new NotFoundError('Account', accountId);

  const activities = await queries.getActivitiesForScoring(accountId);
  const engagementScore = calculateEngagementScore(activities, account.tier);
  const overallScore = engagementScore; // Phase 1: engagement only

  const previousScore = await queries.getScoreFromDaysAgo(accountId, 7);
  const trend = calculateTrend(overallScore, previousScore?.overall_score ?? null);

  const [score] = await queries.insertScore({
    account_id: accountId,
    overall_score: overallScore,
    engagement_score: engagementScore,
    factors: { activity_count: activities.length, tier: account.tier },
  });

  logger.info({ accountId, oldScore: previousScore?.overall_score, newScore: overallScore }, 'Health score calculated');

  return { ...score, trend, color: getHealthColor(overallScore) };
}

export async function getAccountHealth(accountId: string) {
  const account = await findAccountById(accountId);
  if (!account) throw new NotFoundError('Account', accountId);

  const latest = await queries.getLatestScore(accountId);
  if (!latest) return { score: null, trend: 'flat' as const, color: 'gray' };

  const previous = await queries.getScoreFromDaysAgo(accountId, 7);
  const trend = calculateTrend(latest.overall_score, previous?.overall_score ?? null);

  return { ...latest, trend, color: getHealthColor(latest.overall_score) };
}

export async function getHealthHistory(accountId: string, days = 90) {
  const account = await findAccountById(accountId);
  if (!account) throw new NotFoundError('Account', accountId);
  return queries.getScoreHistory(accountId, days);
}

export async function getHealthConfig() {
  return queries.listConfig();
}

export async function updateHealthConfig(tier: string, data: Record<string, unknown>) {
  const [config] = await queries.updateConfig(tier, data);
  return config;
}
```

- [ ] **Step 6: Write health routes**

`packages/server/src/modules/health/health.routes.ts`:
```typescript
import { Router } from 'express';
import { authenticate } from '../../core/middleware/auth.js';
import { requireAdmin } from '../../core/middleware/rbac.js';
import { sendSuccess } from '../../core/helpers/response.js';
import * as healthService from './health.service.js';

const router = Router();
router.use(authenticate);

// GET /api/accounts/:accountId/health (mounted under accounts)
export async function getAccountHealth(req: any, res: any, next: any) {
  try {
    const health = await healthService.getAccountHealth(req.params.id);
    sendSuccess(res, health);
  } catch (err) { next(err); }
}

export async function getHealthHistory(req: any, res: any, next: any) {
  try {
    const history = await healthService.getHealthHistory(req.params.id);
    sendSuccess(res, history);
  } catch (err) { next(err); }
}

// Config routes at /api/health/config
router.get('/config', async (_req, res, next) => {
  try {
    const config = await healthService.getHealthConfig();
    sendSuccess(res, config);
  } catch (err) { next(err); }
});

router.put('/config', requireAdmin, async (req, res, next) => {
  try {
    const { tier, ...data } = req.body;
    const config = await healthService.updateHealthConfig(tier, data);
    sendSuccess(res, config);
  } catch (err) { next(err); }
});

export const healthRoutes = router;
```

Mount health endpoints in accounts routes and app.ts:
```typescript
// In accounts.routes.ts add:
import { getAccountHealth, getHealthHistory } from '../health/health.routes.js';
router.get('/:id/health', getAccountHealth);
router.get('/:id/health/history', getHealthHistory);

// In app.ts add:
import { healthRoutes } from './modules/health/health.routes.js';
app.use('/api/health', healthRoutes);
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: health scoring engine with calculator, storage, and API"
```

---

### Task 12: Alert System

**Files:**
- Create: `packages/server/src/modules/alerts/alerts.queries.ts`
- Create: `packages/server/src/modules/alerts/alerts.service.ts`
- Create: `packages/server/src/modules/alerts/alerts.checker.ts`
- Create: `packages/server/src/modules/alerts/alerts.routes.ts`
- Test: `packages/server/src/modules/alerts/alerts.checker.test.ts`

- [ ] **Step 1: Write alert queries**

`packages/server/src/modules/alerts/alerts.queries.ts`:
```typescript
import { db } from '../../core/database/connection.js';

export function listAlertsByUser(userId: string) {
  return db('alerts').where({ user_id: userId, is_dismissed: false })
    .orderBy('created_at', 'desc').limit(50);
}

export function findActiveAlert(accountId: string, type: string) {
  return db('alerts').where({ account_id: accountId, type, is_read: false, is_dismissed: false }).first();
}

export function insertAlert(data: Record<string, unknown>) {
  return db('alerts').insert(data).returning('*');
}

export function markRead(id: string) {
  return db('alerts').where({ id }).update({ is_read: true });
}

export function markDismissed(id: string) {
  return db('alerts').where({ id }).update({ is_dismissed: true });
}

export function getUnreadCount(userId: string) {
  return db('alerts').where({ user_id: userId, is_read: false, is_dismissed: false }).count('id as count').first();
}
```

- [ ] **Step 2: Write alert checker (pure logic for detecting alert conditions)**

`packages/server/src/modules/alerts/alerts.checker.ts`:
```typescript
import { ACTIVITY_GAP_DAYS } from '@blackbear/shared';
import { db } from '../../core/database/connection.js';
import * as alertQueries from './alerts.queries.js';
import { logger } from '../../core/logger.js';
import { publishSocketEvent } from '../../core/websocket/socket.js';

export async function checkHealthThresholds(accountId: string, score: number, previousScore: number | null, userId: string) {
  if (previousScore === null) return;

  const drop = previousScore - score;

  if (drop >= 15) {
    await createAlertIfNew(accountId, userId, 'health_drop', 'high',
      'Significant health score drop', `Score dropped ${drop} points (from ${previousScore} to ${score}) in the last 7 days`);
  } else if (drop >= 10) {
    await createAlertIfNew(accountId, userId, 'health_drop', 'medium',
      'Health score declining', `Score dropped ${drop} points (from ${previousScore} to ${score}) in the last 7 days`);
  }
}

export async function checkActivityGaps() {
  const accounts = await db('accounts').where({ status: 'active' });

  for (const account of accounts) {
    const gapDays = ACTIVITY_GAP_DAYS[account.tier] ?? 30;
    const since = new Date(Date.now() - gapDays * 24 * 60 * 60 * 1000);
    const recentActivity = await db('activities')
      .where('account_id', account.id)
      .where('occurred_at', '>=', since).first();

    if (!recentActivity) {
      const doubleSince = new Date(Date.now() - gapDays * 2 * 24 * 60 * 60 * 1000);
      const anyActivity = await db('activities')
        .where('account_id', account.id)
        .where('occurred_at', '>=', doubleSince).first();

      const severity = anyActivity ? 'medium' : 'high';
      await createAlertIfNew(account.id, account.owner_id, 'activity_gap', severity,
        'Activity gap detected', `No activities in the last ${gapDays} days for ${account.name}`);
    }
  }
}

export async function checkSingleContactRisk() {
  const accounts = await db('accounts').where({ status: 'active' });

  for (const account of accounts) {
    const contacts = await db('contacts').where('account_id', account.id);
    const contactCount = contacts.length;

    if (contactCount < 2) {
      await createAlertIfNew(account.id, account.owner_id, 'single_contact', 'low',
        'Single contact risk', `${account.name} has only ${contactCount} contact(s)`);
    }

    if (['enterprise', 'mid_market'].includes(account.tier)) {
      const hasDirectorPlus = contacts.some((c: any) => ['executive', 'director'].includes(c.role_level));
      if (!hasDirectorPlus && contactCount > 0) {
        await createAlertIfNew(account.id, account.owner_id, 'single_contact', 'medium',
          'No senior contacts', `${account.name} has no contacts at director level or above`);
      }
    }
  }
}

export async function checkFollowUpDue() {
  // Find proposals with no follow-up in 5 business days (approx 7 calendar days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const proposals = await db('activities')
    .where('type', 'proposal')
    .where('occurred_at', '<=', sevenDaysAgo)
    .select('*');

  for (const proposal of proposals) {
    const followUp = await db('activities')
      .where('account_id', proposal.account_id)
      .where('occurred_at', '>', proposal.occurred_at)
      .whereIn('type', ['meeting', 'call', 'email', 'follow_up'])
      .first();

    if (!followUp) {
      const account = await db('accounts').where({ id: proposal.account_id }).first();
      if (account) {
        await createAlertIfNew(account.id, account.owner_id, 'follow_up_due', 'medium',
          'Proposal follow-up overdue', `No follow-up on "${proposal.title}" for ${account.name} since ${new Date(proposal.occurred_at).toLocaleDateString()}`);
      }
    }
  }
}

async function createAlertIfNew(accountId: string, userId: string, type: string, severity: string, title: string, message: string) {
  const existing = await alertQueries.findActiveAlert(accountId, type);
  if (existing) return null;

  const [alert] = await alertQueries.insertAlert({
    account_id: accountId, user_id: userId, type, severity, title, message,
  });
  logger.info({ accountId, type, severity }, 'Alert created');

  // Emit alert via Redis pub/sub -> Socket.io
  publishSocketEvent('alert:new', alert, userId);

  return alert;
}
```

- [ ] **Step 3: Write alert routes**

`packages/server/src/modules/alerts/alerts.routes.ts`:
```typescript
import { Router } from 'express';
import { authenticate } from '../../core/middleware/auth.js';
import { sendSuccess, sendNoContent } from '../../core/helpers/response.js';
import * as alertQueries from './alerts.queries.js';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const alerts = await alertQueries.listAlertsByUser(req.user!.userId);
    const countResult = await alertQueries.getUnreadCount(req.user!.userId);
    sendSuccess(res, { alerts, unread_count: Number(countResult?.count ?? 0) });
  } catch (err) { next(err); }
});

router.put('/:id/read', async (req, res, next) => {
  try {
    await alertQueries.markRead(req.params.id);
    sendNoContent(res);
  } catch (err) { next(err); }
});

router.put('/:id/dismiss', async (req, res, next) => {
  try {
    await alertQueries.markDismissed(req.params.id);
    sendNoContent(res);
  } catch (err) { next(err); }
});

export const alertRoutes = router;
```

Mount in app.ts:
```typescript
import { alertRoutes } from './modules/alerts/alerts.routes.js';
app.use('/api/alerts', alertRoutes);
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: alert system (health drops, activity gaps, single contact risk)"
```

---

### Task 13: WebSocket, Worker, and Wiring

**Files:**
- Create: `packages/server/src/core/websocket/socket.ts`
- Create: `packages/server/src/worker.ts`
- Modify: `packages/server/src/modules/activities/activities.service.ts` (wire Bull queue)

- [ ] **Step 1: Write Socket.io server**

`packages/server/src/core/websocket/socket.ts`:
```typescript
import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { logger } from '../logger.js';
import type { AuthPayload } from '../middleware/auth.js';

let io: Server;

export function createSocketServer(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: { origin: config.CORS_ORIGIN, credentials: true },
    path: '/socket.io',
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const payload = jwt.verify(token, config.JWT_SECRET) as AuthPayload;
      (socket as any).user = payload;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const user = (socket as any).user as AuthPayload;
    socket.join(`user:${user.userId}`);
    logger.debug({ userId: user.userId }, 'WebSocket connected');

    socket.on('disconnect', () => {
      logger.debug({ userId: user.userId }, 'WebSocket disconnected');
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}

export function emitToUser(userId: string, event: string, data: any) {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, data);
}

export function emitToAll(event: string, data: any) {
  if (!io) return;
  io.emit(event, data);
}

// Redis pub/sub bridge for worker -> app socket emissions
// Worker publishes to Redis channel, app subscribes and emits via Socket.io
import { redis } from '../queue/setup.js';

const SOCKET_CHANNEL = 'socket:events';

export function publishSocketEvent(event: string, data: any, targetUserId?: string) {
  redis.publish(SOCKET_CHANNEL, JSON.stringify({ event, data, targetUserId }));
}

export function subscribeToSocketEvents() {
  const sub = redis.duplicate();
  sub.subscribe(SOCKET_CHANNEL);
  sub.on('message', (_channel: string, message: string) => {
    const { event, data, targetUserId } = JSON.parse(message);
    if (targetUserId) {
      emitToUser(targetUserId, event, data);
    } else {
      emitToAll(event, data);
    }
  });
}
```

- [ ] **Step 2: Write worker entry point**

`packages/server/src/worker.ts`:
```typescript
import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

import { logger } from './core/logger.js';
import { db } from './core/database/connection.js';
import { healthQueue, alertQueue } from './core/queue/health-queue.js';
import { calculateAndStoreHealth } from './modules/health/health.service.js';
import { checkHealthThresholds, checkActivityGaps, checkSingleContactRisk, checkFollowUpDue } from './modules/alerts/alerts.checker.js';
import { getScoreFromDaysAgo } from './modules/health/health.queries.js';
import { publishSocketEvent } from './core/websocket/socket.js';

async function start() {
  // Wait for migrations
  const pending = await db.migrate.list();
  if (pending[1].length > 0) {
    logger.info('Waiting for migrations...');
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  // Health scoring jobs
  healthQueue.process('calculateAccountHealth', async (job: any) => {
    const { accountId } = job.data;
    logger.info({ accountId }, 'Calculating health score');
    const result = await calculateAndStoreHealth(accountId);

    // Emit health update via Redis pub/sub -> Socket.io
    const account = await db('accounts').where({ id: accountId }).first();
    if (account) {
      publishSocketEvent('health:updated', { accountId, score: result.overall_score, trend: result.trend }, account.owner_id);

      // Check thresholds after calculation
      const previous = await getScoreFromDaysAgo(accountId, 7);
      await checkHealthThresholds(accountId, result.overall_score, previous?.overall_score ?? null, account.owner_id);
    }
  });

  healthQueue.process('batchRecalculate', async () => {
    logger.info('Starting nightly batch health recalculation');
    const accounts = await db('accounts').where({ status: 'active' }).select('id');
    for (const account of accounts) {
      await healthQueue.add('calculateAccountHealth', { accountId: account.id });
    }
  });

  // Alert jobs
  alertQueue.process('checkActivityGaps', async () => {
    logger.info('Checking activity gaps');
    await checkActivityGaps();
  });

  alertQueue.process('checkSingleContactRisk', async () => {
    logger.info('Checking single contact risks');
    await checkSingleContactRisk();
  });

  alertQueue.process('checkFollowUpDue', async () => {
    logger.info('Checking overdue proposal follow-ups');
    await checkFollowUpDue();
  });

  // Scheduled jobs
  healthQueue.add('batchRecalculate', {}, { repeat: { cron: '0 2 * * *' } }); // 2 AM daily
  alertQueue.add('checkActivityGaps', {}, { repeat: { cron: '0 3 * * *' } }); // 3 AM daily
  alertQueue.add('checkSingleContactRisk', {}, { repeat: { cron: '0 4 * * 1' } }); // 4 AM Monday
  alertQueue.add('checkFollowUpDue', {}, { repeat: { cron: '0 5 * * *' } }); // 5 AM daily

  logger.info('Worker started with scheduled jobs');
}

start().catch((err) => {
  logger.fatal(err, 'Worker failed to start');
  process.exit(1);
});
```

- [ ] **Step 3: Wire activity creation to health queue**

Update `packages/server/src/modules/activities/activities.service.ts` -- in the `createActivity` function, after inserting the activity, add:

```typescript
import { healthQueue } from '../../core/queue/health-queue.js';

// After: const [activity] = await queries.insertActivity(...)
healthQueue.add('calculateAccountHealth', { accountId: activity.account_id });
```

- [ ] **Step 4: Verify server and worker both compile**

Run: `cd packages/server && npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: WebSocket server, background worker with scheduled jobs, health/alert wiring"
```

---

## Chunk 5: Frontend Foundation

### Task 14: Redux Store, RTK Query, Auth Slice

**Files:**
- Create: `packages/client/src/store/store.ts`
- Create: `packages/client/src/store/api/baseApi.ts`
- Create: `packages/client/src/store/api/authApi.ts`
- Create: `packages/client/src/store/slices/authSlice.ts`
- Create: `packages/client/src/store/slices/uiSlice.ts`

- [ ] **Step 1: Write baseApi with auth headers**

`packages/client/src/store/api/baseApi.ts`:
```typescript
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../store';

export const baseApi = createApi({
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.accessToken;
      if (token) headers.set('authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Account', 'Contact', 'Activity', 'Health', 'Alert', 'Dashboard', 'User'],
  endpoints: () => ({}),
});
```

- [ ] **Step 2: Write authApi and authSlice**

`packages/client/src/store/api/authApi.ts`:
```typescript
import { baseApi } from './baseApi';

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation<{ data: { accessToken: string; user: any } }, { email: string; password: string }>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),
    logout: build.mutation<void, void>({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
    }),
    refresh: build.mutation<{ data: { accessToken: string } }, void>({
      query: () => ({ url: '/auth/refresh', method: 'POST' }),
    }),
    getMe: build.query<{ data: any }, void>({
      query: () => '/auth/me',
    }),
  }),
});

export const { useLoginMutation, useLogoutMutation, useRefreshMutation, useGetMeQuery } = authApi;
```

`packages/client/src/store/slices/authSlice.ts`:
```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  accessToken: string | null;
  user: any | null;
}

const initialState: AuthState = {
  accessToken: localStorage.getItem('accessToken'),
  user: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ accessToken: string; user: any }>) {
      state.accessToken = action.payload.accessToken;
      state.user = action.payload.user;
      localStorage.setItem('accessToken', action.payload.accessToken);
    },
    clearCredentials(state) {
      state.accessToken = null;
      state.user = null;
      localStorage.removeItem('accessToken');
    },
    setToken(state, action: PayloadAction<string>) {
      state.accessToken = action.payload;
      localStorage.setItem('accessToken', action.payload);
    },
  },
});

export const { setCredentials, clearCredentials, setToken } = authSlice.actions;
export default authSlice.reducer;
```

`packages/client/src/store/slices/uiSlice.ts`:
```typescript
import { createSlice } from '@reduxjs/toolkit';

interface UiState {
  sidebarOpen: boolean;
}

const uiSlice = createSlice({
  name: 'ui',
  initialState: { sidebarOpen: true } as UiState,
  reducers: {
    toggleSidebar(state) { state.sidebarOpen = !state.sidebarOpen; },
    setSidebarOpen(state, action) { state.sidebarOpen = action.payload; },
  },
});

export const { toggleSidebar, setSidebarOpen } = uiSlice.actions;
export default uiSlice.reducer;
```

- [ ] **Step 3: Write store configuration**

`packages/client/src/store/store.ts`:
```typescript
import { configureStore } from '@reduxjs/toolkit';
import { baseApi } from './api/baseApi';
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    auth: authReducer,
    ui: uiReducer,
  },
  middleware: (getDefault) => getDefault().concat(baseApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: Redux store, RTK Query base, auth slice"
```

---

### Task 15: MUI Theme, App Shell, Router

**Files:**
- Create: `packages/client/src/theme.ts`
- Create: `packages/client/src/components/layout/AppShell.tsx`
- Create: `packages/client/src/components/layout/Sidebar.tsx`
- Create: `packages/client/src/components/layout/Header.tsx`
- Create: `packages/client/src/components/common/LoadingState.tsx`
- Create: `packages/client/src/components/common/EmptyState.tsx`
- Create: `packages/client/src/features/auth/LoginPage.tsx`
- Create: `packages/client/src/features/auth/ProtectedRoute.tsx`
- Create: `packages/client/src/hooks/useAuth.ts`
- Modify: `packages/client/src/App.tsx`
- Modify: `packages/client/src/main.tsx`

- [ ] **Step 1: Write MUI theme**

`packages/client/src/theme.ts`:
```typescript
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: { main: '#1a1a2e' },
    secondary: { main: '#e94560' },
    background: { default: '#f5f5f5' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiButton: { styleOverrides: { root: { textTransform: 'none' } } },
  },
});
```

- [ ] **Step 2: Write useAuth hook**

`packages/client/src/hooks/useAuth.ts`:
```typescript
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { RootState } from '../store/store';
import { setCredentials, clearCredentials } from '../store/slices/authSlice';
import { useLoginMutation, useLogoutMutation } from '../store/api/authApi';

export function useAuth() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { accessToken, user } = useSelector((state: RootState) => state.auth);
  const [loginMutation, { isLoading: isLoggingIn }] = useLoginMutation();
  const [logoutMutation] = useLogoutMutation();

  const login = async (email: string, password: string) => {
    const result = await loginMutation({ email, password }).unwrap();
    dispatch(setCredentials({ accessToken: result.data.accessToken, user: result.data.user }));
    navigate('/dashboard');
  };

  const logout = async () => {
    await logoutMutation().unwrap().catch(() => {});
    dispatch(clearCredentials());
    navigate('/login');
  };

  return { user, isAuthenticated: !!accessToken, isLoggingIn, login, logout };
}
```

- [ ] **Step 3: Write LoginPage**

`packages/client/src/features/auth/LoginPage.tsx`:
```tsx
import { useState } from 'react';
import { Box, Card, CardContent, TextField, Button, Typography, Alert } from '@mui/material';
import { useAuth } from '../../hooks/useAuth';

export function LoginPage() {
  const { login, isLoggingIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err?.data?.error?.message ?? 'Login failed');
    }
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" bgcolor="background.default">
      <Card sx={{ width: 400 }}>
        <CardContent>
          <Typography variant="h5" mb={3}>BlackBear CRM</Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <form onSubmit={handleSubmit}>
            <TextField fullWidth label="Email" type="email" value={email}
              onChange={(e) => setEmail(e.target.value)} margin="normal" required />
            <TextField fullWidth label="Password" type="password" value={password}
              onChange={(e) => setPassword(e.target.value)} margin="normal" required />
            <Button fullWidth type="submit" variant="contained" disabled={isLoggingIn} sx={{ mt: 2 }}>
              {isLoggingIn ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
```

- [ ] **Step 4: Write ProtectedRoute**

`packages/client/src/features/auth/ProtectedRoute.tsx`:
```tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';

export function ProtectedRoute() {
  const token = useSelector((state: RootState) => state.auth.accessToken);
  return token ? <Outlet /> : <Navigate to="/login" replace />;
}
```

- [ ] **Step 5: Write Sidebar, Header, and AppShell**

`packages/client/src/components/layout/Sidebar.tsx`:
```tsx
import { Drawer, List, ListItemButton, ListItemIcon, ListItemText, Toolbar } from '@mui/material';
import { Dashboard, Business, People, Timeline, Settings, NotificationsActive } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
  { label: 'Accounts', icon: <Business />, path: '/accounts' },
  { label: 'Alerts', icon: <NotificationsActive />, path: '/alerts' },
  { label: 'Settings', icon: <Settings />, path: '/settings/profile' },
];

const DRAWER_WIDTH = 240;

export function Sidebar({ open }: { open: boolean }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Drawer variant="persistent" open={open}
      sx={{ width: open ? DRAWER_WIDTH : 0, flexShrink: 0,
        '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' } }}>
      <Toolbar />
      <List>
        {NAV_ITEMS.map((item) => (
          <ListItemButton key={item.path} selected={location.pathname.startsWith(item.path)}
            onClick={() => navigate(item.path)}>
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </Drawer>
  );
}
```

`packages/client/src/components/layout/Header.tsx`:
```tsx
import { AppBar, Toolbar, IconButton, Typography, Box, Badge } from '@mui/material';
import { Menu as MenuIcon, Logout } from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const { user, logout } = useAuth();

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <IconButton color="inherit" onClick={onToggleSidebar} edge="start" sx={{ mr: 2 }}>
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>BlackBear CRM</Typography>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="body2">{user?.first_name} {user?.last_name}</Typography>
          <IconButton color="inherit" onClick={logout}><Logout /></IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
```

`packages/client/src/components/layout/AppShell.tsx`:
```tsx
import { Box, Toolbar } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import type { RootState } from '../../store/store';
import { toggleSidebar } from '../../store/slices/uiSlice';

export function AppShell() {
  const dispatch = useDispatch();
  const sidebarOpen = useSelector((state: RootState) => state.ui.sidebarOpen);

  return (
    <Box sx={{ display: 'flex' }}>
      <Header onToggleSidebar={() => dispatch(toggleSidebar())} />
      <Sidebar open={sidebarOpen} />
      <Box component="main" sx={{ flexGrow: 1, p: 3, ml: sidebarOpen ? '240px' : 0, transition: 'margin 0.3s' }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
```

- [ ] **Step 6: Write common components**

`packages/client/src/components/common/LoadingState.tsx`:
```tsx
import { Box, CircularProgress } from '@mui/material';

export function LoadingState() {
  return (
    <Box display="flex" justifyContent="center" alignItems="center" py={4}>
      <CircularProgress />
    </Box>
  );
}
```

`packages/client/src/components/common/EmptyState.tsx`:
```tsx
import { Box, Typography } from '@mui/material';

export function EmptyState({ message = 'No data found' }: { message?: string }) {
  return (
    <Box display="flex" justifyContent="center" alignItems="center" py={4}>
      <Typography color="text.secondary">{message}</Typography>
    </Box>
  );
}
```

- [ ] **Step 7: Wire up App.tsx with router**

`packages/client/src/App.tsx`:
```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { store } from './store/store';
import { theme } from './theme';
import { AppShell } from './components/layout/AppShell';
import { ProtectedRoute } from './features/auth/ProtectedRoute';
import { LoginPage } from './features/auth/LoginPage';

// Lazy-loaded pages will be added as they are built
function PlaceholderPage({ title }: { title: string }) {
  return <div>{title} - Coming soon</div>;
}

export function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<AppShell />}>
                <Route path="/dashboard" element={<PlaceholderPage title="Dashboard" />} />
                <Route path="/accounts" element={<PlaceholderPage title="Accounts" />} />
                <Route path="/accounts/:id" element={<PlaceholderPage title="Account Detail" />} />
                <Route path="/alerts" element={<PlaceholderPage title="Alerts" />} />
                <Route path="/settings/*" element={<PlaceholderPage title="Settings" />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  );
}
```

Update `packages/client/src/main.tsx` to ensure it imports `App` correctly (already done in Task 1).

- [ ] **Step 8: Verify client builds**

Run: `npm run build --workspace=packages/client`
Expected: Vite builds without errors

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: frontend foundation (MUI theme, auth flow, app shell, router)"
```

---

## Chunk 6: Frontend Feature Pages

### Task 16: RTK Query API Slices

**Files:**
- Create: `packages/client/src/store/api/accountsApi.ts`
- Create: `packages/client/src/store/api/contactsApi.ts`
- Create: `packages/client/src/store/api/activitiesApi.ts`
- Create: `packages/client/src/store/api/healthApi.ts`
- Create: `packages/client/src/store/api/alertsApi.ts`
- Create: `packages/client/src/store/api/dashboardApi.ts`
- Create: `packages/client/src/store/api/usersApi.ts`

- [ ] **Step 1: Write all RTK Query API slices**

`packages/client/src/store/api/accountsApi.ts`:
```typescript
import { baseApi } from './baseApi';
import type { Account, ApiResponse, PaginationMeta } from '@blackbear/shared';

export const accountsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getAccounts: build.query<{ data: Account[]; meta: PaginationMeta }, Record<string, any>>({
      query: (params) => ({ url: '/accounts', params }),
      providesTags: (result) =>
        result ? [...result.data.map((a) => ({ type: 'Account' as const, id: a.id })), 'Account'] : ['Account'],
    }),
    getAccount: build.query<ApiResponse<Account>, string>({
      query: (id) => `/accounts/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Account', id }],
    }),
    createAccount: build.mutation<ApiResponse<Account>, Partial<Account>>({
      query: (body) => ({ url: '/accounts', method: 'POST', body }),
      invalidatesTags: ['Account'],
    }),
    updateAccount: build.mutation<ApiResponse<Account>, { id: string; data: Partial<Account> }>({
      query: ({ id, data }) => ({ url: `/accounts/${id}`, method: 'PUT', body: data }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Account', id }, 'Dashboard'],
    }),
    deleteAccount: build.mutation<void, string>({
      query: (id) => ({ url: `/accounts/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Account', 'Dashboard'],
    }),
    getTimeline: build.query<ApiResponse<any[]>, string>({
      query: (id) => `/accounts/${id}/timeline`,
      providesTags: (_r, _e, id) => [{ type: 'Activity', id }],
    }),
  }),
});

export const {
  useGetAccountsQuery, useGetAccountQuery, useCreateAccountMutation,
  useUpdateAccountMutation, useDeleteAccountMutation, useGetTimelineQuery,
} = accountsApi;
```

`packages/client/src/store/api/contactsApi.ts`:
```typescript
import { baseApi } from './baseApi';
import type { Contact, ApiResponse, PaginationMeta } from '@blackbear/shared';

export const contactsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getAccountContacts: build.query<{ data: Contact[]; meta: PaginationMeta }, { accountId: string; params?: any }>({
      query: ({ accountId, params }) => ({ url: `/accounts/${accountId}/contacts`, params }),
      providesTags: ['Contact'],
    }),
    searchContacts: build.query<{ data: Contact[]; meta: PaginationMeta }, Record<string, any>>({
      query: (params) => ({ url: '/contacts', params }),
      providesTags: ['Contact'],
    }),
    createContact: build.mutation<ApiResponse<Contact>, { accountId: string; data: Partial<Contact> }>({
      query: ({ accountId, data }) => ({ url: `/accounts/${accountId}/contacts`, method: 'POST', body: data }),
      invalidatesTags: ['Contact', 'Alert'],
    }),
    updateContact: build.mutation<ApiResponse<Contact>, { id: string; data: Partial<Contact> }>({
      query: ({ id, data }) => ({ url: `/contacts/${id}`, method: 'PUT', body: data }),
      invalidatesTags: ['Contact'],
    }),
    deleteContact: build.mutation<void, string>({
      query: (id) => ({ url: `/contacts/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Contact', 'Alert'],
    }),
  }),
});

export const {
  useGetAccountContactsQuery, useSearchContactsQuery, useCreateContactMutation,
  useUpdateContactMutation, useDeleteContactMutation,
} = contactsApi;
```

`packages/client/src/store/api/activitiesApi.ts`:
```typescript
import { baseApi } from './baseApi';
import type { Activity, ApiResponse, PaginationMeta } from '@blackbear/shared';

export const activitiesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getActivities: build.query<{ data: Activity[]; meta: PaginationMeta }, Record<string, any>>({
      query: (params) => ({ url: '/activities', params }),
      providesTags: ['Activity'],
    }),
    createActivity: build.mutation<ApiResponse<Activity>, Partial<Activity>>({
      query: (body) => ({ url: '/activities', method: 'POST', body }),
      invalidatesTags: ['Activity', 'Health', 'Dashboard'],
    }),
    updateActivity: build.mutation<ApiResponse<Activity>, { id: string; data: Partial<Activity> }>({
      query: ({ id, data }) => ({ url: `/activities/${id}`, method: 'PUT', body: data }),
      invalidatesTags: ['Activity'],
    }),
    deleteActivity: build.mutation<void, string>({
      query: (id) => ({ url: `/activities/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Activity', 'Health', 'Dashboard'],
    }),
  }),
});

export const {
  useGetActivitiesQuery, useCreateActivityMutation,
  useUpdateActivityMutation, useDeleteActivityMutation,
} = activitiesApi;
```

`packages/client/src/store/api/healthApi.ts`:
```typescript
import { baseApi } from './baseApi';

export const healthApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getAccountHealth: build.query<{ data: any }, string>({
      query: (id) => `/accounts/${id}/health`,
      providesTags: (_r, _e, id) => [{ type: 'Health', id }],
    }),
    getHealthHistory: build.query<{ data: any[] }, string>({
      query: (id) => `/accounts/${id}/health/history`,
      providesTags: (_r, _e, id) => [{ type: 'Health', id }],
    }),
    getHealthConfig: build.query<{ data: any[] }, void>({
      query: () => '/health/config',
    }),
    updateHealthConfig: build.mutation<{ data: any }, { tier: string; data: any }>({
      query: ({ tier, data }) => ({ url: '/health/config', method: 'PUT', body: { tier, ...data } }),
      invalidatesTags: ['Health'],
    }),
  }),
});

export const {
  useGetAccountHealthQuery, useGetHealthHistoryQuery,
  useGetHealthConfigQuery, useUpdateHealthConfigMutation,
} = healthApi;
```

`packages/client/src/store/api/alertsApi.ts`:
```typescript
import { baseApi } from './baseApi';

export const alertsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getAlerts: build.query<{ data: { alerts: any[]; unread_count: number } }, void>({
      query: () => '/alerts',
      providesTags: ['Alert'],
    }),
    markRead: build.mutation<void, string>({
      query: (id) => ({ url: `/alerts/${id}/read`, method: 'PUT' }),
      invalidatesTags: ['Alert'],
    }),
    dismissAlert: build.mutation<void, string>({
      query: (id) => ({ url: `/alerts/${id}/dismiss`, method: 'PUT' }),
      invalidatesTags: ['Alert'],
    }),
  }),
});

export const { useGetAlertsQuery, useMarkReadMutation, useDismissAlertMutation } = alertsApi;
```

`packages/client/src/store/api/dashboardApi.ts`:
```typescript
import { baseApi } from './baseApi';

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getManagerDashboard: build.query<{ data: any }, void>({
      query: () => '/dashboard/manager',
      providesTags: ['Dashboard'],
    }),
    getTeamLeadDashboard: build.query<{ data: any }, void>({
      query: () => '/dashboard/team-lead',
      providesTags: ['Dashboard'],
    }),
    getOperationsDashboard: build.query<{ data: any }, void>({
      query: () => '/dashboard/operations',
      providesTags: ['Dashboard'],
    }),
  }),
});

export const { useGetManagerDashboardQuery, useGetTeamLeadDashboardQuery, useGetOperationsDashboardQuery } = dashboardApi;
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: RTK Query API slices for all endpoints"
```

---

### Task 17: Account List and Detail Pages

**Files:**
- Create: `packages/client/src/features/accounts/AccountListPage.tsx`
- Create: `packages/client/src/features/accounts/AccountDetailPage.tsx`
- Create: `packages/client/src/features/accounts/components/AccountTable.tsx`
- Create: `packages/client/src/features/accounts/components/AccountFilters.tsx`
- Create: `packages/client/src/features/accounts/components/AccountForm.tsx`
- Create: `packages/client/src/features/accounts/components/HealthBadge.tsx`

- [ ] **Step 1: Write HealthBadge component**

`packages/client/src/features/accounts/components/HealthBadge.tsx`:
```tsx
import { Chip } from '@mui/material';
import { TrendingUp, TrendingDown, TrendingFlat } from '@mui/icons-material';

const COLOR_MAP: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  green: 'success', yellow: 'warning', orange: 'warning', red: 'error', gray: 'default',
};

const TREND_ICON = { up: <TrendingUp fontSize="small" />, down: <TrendingDown fontSize="small" />, flat: <TrendingFlat fontSize="small" /> };

export function HealthBadge({ score, color, trend }: { score: number | null; color: string; trend: string }) {
  if (score === null) return <Chip label="No data" size="small" />;
  return (
    <Chip
      label={score}
      color={COLOR_MAP[color] ?? 'default'}
      size="small"
      icon={TREND_ICON[trend as keyof typeof TREND_ICON]}
    />
  );
}
```

- [ ] **Step 2: Write AccountTable**

`packages/client/src/features/accounts/components/AccountTable.tsx`:
```tsx
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import { HealthBadge } from './HealthBadge';
import { Chip } from '@mui/material';

const columns: GridColDef[] = [
  { field: 'name', headerName: 'Account', flex: 1, minWidth: 200 },
  { field: 'industry', headerName: 'Industry', flex: 0.5 },
  { field: 'tier', headerName: 'Tier', width: 120, renderCell: (p) => <Chip label={p.value} size="small" variant="outlined" /> },
  { field: 'status', headerName: 'Status', width: 100 },
  { field: 'health', headerName: 'Health', width: 100, renderCell: (p) =>
    <HealthBadge score={p.row.healthScore} color={p.row.healthColor} trend={p.row.healthTrend} /> },
];

interface Props {
  accounts: any[];
  loading: boolean;
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function AccountTable({ accounts, loading, total, page, pageSize, onPageChange, onPageSizeChange }: Props) {
  const navigate = useNavigate();

  return (
    <DataGrid
      rows={accounts}
      columns={columns}
      loading={loading}
      rowCount={total}
      paginationMode="server"
      paginationModel={{ page: page - 1, pageSize }}
      onPaginationModelChange={(m) => { onPageChange(m.page + 1); onPageSizeChange(m.pageSize); }}
      onRowClick={(p) => navigate(`/accounts/${p.id}`)}
      pageSizeOptions={[10, 25, 50]}
      disableRowSelectionOnClick
      autoHeight
      sx={{ cursor: 'pointer' }}
    />
  );
}
```

- [ ] **Step 3: Write AccountFilters**

`packages/client/src/features/accounts/components/AccountFilters.tsx`:
```tsx
import { Box, TextField, FormControl, InputLabel, Select, MenuItem, Button } from '@mui/material';
import { Add } from '@mui/icons-material';

interface Props {
  filters: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  onCreateClick: () => void;
}

export function AccountFilters({ filters, onFilterChange, onCreateClick }: Props) {
  return (
    <Box display="flex" gap={2} mb={2} flexWrap="wrap" alignItems="center">
      <TextField size="small" label="Search" value={filters.q ?? ''} onChange={(e) => onFilterChange('q', e.target.value)} />
      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel>Tier</InputLabel>
        <Select value={filters.tier ?? ''} label="Tier" onChange={(e) => onFilterChange('tier', e.target.value)}>
          <MenuItem value="">All</MenuItem>
          <MenuItem value="enterprise">Enterprise</MenuItem>
          <MenuItem value="mid_market">Mid Market</MenuItem>
          <MenuItem value="smb">SMB</MenuItem>
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel>Status</InputLabel>
        <Select value={filters.status ?? ''} label="Status" onChange={(e) => onFilterChange('status', e.target.value)}>
          <MenuItem value="">All</MenuItem>
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="inactive">Inactive</MenuItem>
          <MenuItem value="churned">Churned</MenuItem>
          <MenuItem value="prospect">Prospect</MenuItem>
        </Select>
      </FormControl>
      <Box flexGrow={1} />
      <Button variant="contained" startIcon={<Add />} onClick={onCreateClick}>New Account</Button>
    </Box>
  );
}
```

- [ ] **Step 4: Write AccountForm dialog**

`packages/client/src/features/accounts/components/AccountForm.tsx`:
```tsx
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createAccountSchema } from '@blackbear/shared';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  defaultValues?: any;
  isLoading?: boolean;
}

export function AccountForm({ open, onClose, onSubmit, defaultValues, isLoading }: Props) {
  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(createAccountSchema),
    defaultValues: defaultValues ?? { name: '', industry: '', tier: 'smb', website: '', status: 'active' },
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>{defaultValues ? 'Edit Account' : 'New Account'}</DialogTitle>
        <DialogContent>
          <Controller name="name" control={control} render={({ field }) =>
            <TextField {...field} fullWidth label="Account Name" margin="normal" error={!!errors.name} helperText={errors.name?.message as string} />} />
          <Controller name="industry" control={control} render={({ field }) =>
            <TextField {...field} fullWidth label="Industry" margin="normal" error={!!errors.industry} />} />
          <Controller name="tier" control={control} render={({ field }) =>
            <FormControl fullWidth margin="normal"><InputLabel>Tier</InputLabel>
              <Select {...field} label="Tier"><MenuItem value="enterprise">Enterprise</MenuItem>
                <MenuItem value="mid_market">Mid Market</MenuItem><MenuItem value="smb">SMB</MenuItem></Select>
            </FormControl>} />
          <Controller name="website" control={control} render={({ field }) =>
            <TextField {...field} fullWidth label="Website" margin="normal" />} />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isLoading}>{isLoading ? 'Saving...' : 'Save'}</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
```

- [ ] **Step 5: Write AccountListPage**

`packages/client/src/features/accounts/AccountListPage.tsx`:
```tsx
import { useState } from 'react';
import { Typography } from '@mui/material';
import { useGetAccountsQuery, useCreateAccountMutation } from '../../store/api/accountsApi';
import { AccountTable } from './components/AccountTable';
import { AccountFilters } from './components/AccountFilters';
import { AccountForm } from './components/AccountForm';
import { LoadingState } from '../../components/common/LoadingState';

export function AccountListPage() {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [formOpen, setFormOpen] = useState(false);

  const queryParams = { ...filters, page, limit: pageSize };
  const { data, isLoading } = useGetAccountsQuery(queryParams);
  const [createAccount, { isLoading: isCreating }] = useCreateAccountMutation();

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => value ? { ...prev, [key]: value } : (() => { const n = { ...prev }; delete n[key]; return n; })());
    setPage(1);
  };

  const handleCreate = async (formData: any) => {
    await createAccount(formData).unwrap();
    setFormOpen(false);
  };

  return (
    <>
      <Typography variant="h5" mb={2}>Accounts</Typography>
      <AccountFilters filters={filters} onFilterChange={handleFilterChange} onCreateClick={() => setFormOpen(true)} />
      {isLoading ? <LoadingState /> :
        <AccountTable accounts={data?.data ?? []} loading={isLoading} total={data?.meta?.total ?? 0}
          page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />}
      <AccountForm open={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleCreate} isLoading={isCreating} />
    </>
  );
}
```

- [ ] **Step 6: Write AccountDetailPage (tabbed view)**

`packages/client/src/features/accounts/AccountDetailPage.tsx`:
```tsx
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Typography, Tabs, Tab, Box, Paper } from '@mui/material';
import { useGetAccountQuery } from '../../store/api/accountsApi';
import { useGetAccountHealthQuery } from '../../store/api/healthApi';
import { useGetAccountContactsQuery } from '../../store/api/contactsApi';
import { useGetTimelineQuery } from '../../store/api/accountsApi';
import { HealthBadge } from './components/HealthBadge';
import { LoadingState } from '../../components/common/LoadingState';

function TabPanel({ children, value, index }: { children: React.ReactNode; value: number; index: number }) {
  return value === index ? <Box py={2}>{children}</Box> : null;
}

export function AccountDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState(0);
  const { data: accountData, isLoading } = useGetAccountQuery(id!);
  const { data: healthData } = useGetAccountHealthQuery(id!);
  const { data: contactsData } = useGetAccountContactsQuery({ accountId: id! });
  const { data: timelineData } = useGetTimelineQuery(id!);

  if (isLoading) return <LoadingState />;
  const account = accountData?.data;
  const health = healthData?.data;

  return (
    <>
      <Box display="flex" alignItems="center" gap={2} mb={2}>
        <Typography variant="h5">{account?.name}</Typography>
        {health && <HealthBadge score={health.overall_score} color={health.color} trend={health.trend} />}
      </Box>
      <Typography variant="body2" color="text.secondary" mb={2}>
        {account?.industry} | {account?.tier} | {account?.status}
      </Typography>

      <Paper>
        <Tabs value={tab} onChange={(_e, v) => setTab(v)}>
          <Tab label="Overview" />
          <Tab label={`Contacts (${contactsData?.data?.length ?? 0})`} />
          <Tab label="Timeline" />
          <Tab label="Health" />
        </Tabs>

        <Box p={2}>
          <TabPanel value={tab} index={0}>
            <Typography variant="body1">Account overview with key metrics. Website: {account?.website ?? 'N/A'}</Typography>
          </TabPanel>

          <TabPanel value={tab} index={1}>
            {/* ContactList component will be rendered here */}
            <Typography>Contacts: {contactsData?.data?.length ?? 0}</Typography>
          </TabPanel>

          <TabPanel value={tab} index={2}>
            {/* ActivityTimeline component will be rendered here */}
            <Typography>Activities: {timelineData?.data?.length ?? 0}</Typography>
          </TabPanel>

          <TabPanel value={tab} index={3}>
            {/* HealthScoreCard + HealthTrendChart will be rendered here */}
            <Typography>Health Score: {health?.overall_score ?? 'N/A'}</Typography>
          </TabPanel>
        </Box>
      </Paper>
    </>
  );
}
```

- [ ] **Step 7: Update App.tsx routes to use real pages**

Replace placeholder routes in `App.tsx`:
```typescript
import { AccountListPage } from './features/accounts/AccountListPage';
import { AccountDetailPage } from './features/accounts/AccountDetailPage';

// Replace the placeholder routes:
<Route path="/accounts" element={<AccountListPage />} />
<Route path="/accounts/:id" element={<AccountDetailPage />} />
```

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: account list and detail pages with health badges, filtering, and forms"
```

---

### Task 18: Contact, Activity, and Health Components

**Files:**
- Create: `packages/client/src/features/contacts/components/ContactList.tsx`
- Create: `packages/client/src/features/contacts/components/ContactForm.tsx`
- Create: `packages/client/src/features/activities/components/ActivityTimeline.tsx`
- Create: `packages/client/src/features/activities/components/ActivityForm.tsx`
- Create: `packages/client/src/features/health/components/HealthScoreCard.tsx`
- Create: `packages/client/src/features/health/components/HealthTrendChart.tsx`

- [ ] **Step 1: Write ContactList**

`packages/client/src/features/contacts/components/ContactList.tsx`:
```tsx
import { List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, Chip, Button, Box } from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
import type { Contact } from '@blackbear/shared';

interface Props {
  contacts: Contact[];
  onEdit: (contact: Contact) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

export function ContactList({ contacts, onEdit, onDelete, onAdd }: Props) {
  return (
    <>
      <Box display="flex" justifyContent="flex-end" mb={1}>
        <Button startIcon={<Add />} variant="outlined" size="small" onClick={onAdd}>Add Contact</Button>
      </Box>
      <List>
        {contacts.map((c) => (
          <ListItem key={c.id} divider>
            <ListItemText
              primary={`${c.first_name} ${c.last_name}`}
              secondary={`${c.title} | ${c.email ?? 'No email'}`}
            />
            <Chip label={c.role_level} size="small" sx={{ mr: 1 }} />
            {c.is_primary && <Chip label="Primary" color="primary" size="small" sx={{ mr: 1 }} />}
            <ListItemSecondaryAction>
              <IconButton size="small" onClick={() => onEdit(c)}><Edit fontSize="small" /></IconButton>
              <IconButton size="small" onClick={() => onDelete(c.id)}><Delete fontSize="small" /></IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
    </>
  );
}
```

- [ ] **Step 2: Write ContactForm dialog**

`packages/client/src/features/contacts/components/ContactForm.tsx`:
```tsx
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, FormControl, InputLabel, Select, MenuItem, FormControlLabel, Switch } from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createContactSchema } from '@blackbear/shared';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  defaultValues?: any;
  isLoading?: boolean;
}

export function ContactForm({ open, onClose, onSubmit, defaultValues, isLoading }: Props) {
  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(createContactSchema),
    defaultValues: defaultValues ?? { first_name: '', last_name: '', email: '', phone: '', title: '', role_level: 'individual', is_primary: false },
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>{defaultValues ? 'Edit Contact' : 'New Contact'}</DialogTitle>
        <DialogContent>
          <Controller name="first_name" control={control} render={({ field }) =>
            <TextField {...field} fullWidth label="First Name" margin="normal" error={!!errors.first_name} />} />
          <Controller name="last_name" control={control} render={({ field }) =>
            <TextField {...field} fullWidth label="Last Name" margin="normal" error={!!errors.last_name} />} />
          <Controller name="email" control={control} render={({ field }) =>
            <TextField {...field} fullWidth label="Email" margin="normal" />} />
          <Controller name="title" control={control} render={({ field }) =>
            <TextField {...field} fullWidth label="Job Title" margin="normal" error={!!errors.title} />} />
          <Controller name="role_level" control={control} render={({ field }) =>
            <FormControl fullWidth margin="normal"><InputLabel>Role Level</InputLabel>
              <Select {...field} label="Role Level">
                <MenuItem value="executive">Executive</MenuItem><MenuItem value="director">Director</MenuItem>
                <MenuItem value="manager">Manager</MenuItem><MenuItem value="individual">Individual</MenuItem>
              </Select></FormControl>} />
          <Controller name="is_primary" control={control} render={({ field }) =>
            <FormControlLabel control={<Switch checked={field.value} onChange={field.onChange} />} label="Primary Contact" />} />
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

- [ ] **Step 3: Write ActivityTimeline**

`packages/client/src/features/activities/components/ActivityTimeline.tsx`:
```tsx
import { Timeline, TimelineItem, TimelineSeparator, TimelineConnector, TimelineContent, TimelineDot } from '@mui/lab';
import { Typography, Box, Button } from '@mui/material';
import { Email, Phone, Event, Note, Description, FollowTheSigns, Add } from '@mui/icons-material';

const TYPE_ICONS: Record<string, React.ReactElement> = {
  meeting: <Event />, email: <Email />, call: <Phone />,
  note: <Note />, proposal: <Description />, follow_up: <FollowTheSigns />,
};

interface Props {
  activities: any[];
  onAdd: () => void;
}

export function ActivityTimeline({ activities, onAdd }: Props) {
  return (
    <>
      <Box display="flex" justifyContent="flex-end" mb={1}>
        <Button startIcon={<Add />} variant="outlined" size="small" onClick={onAdd}>Log Activity</Button>
      </Box>
      <Timeline position="right" sx={{ p: 0 }}>
        {activities.map((a) => (
          <TimelineItem key={a.id}>
            <TimelineSeparator>
              <TimelineDot color="primary">{TYPE_ICONS[a.type] ?? <Note />}</TimelineDot>
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent>
              <Typography variant="subtitle2">{a.title}</Typography>
              <Typography variant="caption" color="text.secondary">
                {a.type} | {new Date(a.occurred_at).toLocaleDateString()}
              </Typography>
              {a.description && <Typography variant="body2" mt={0.5}>{a.description}</Typography>}
            </TimelineContent>
          </TimelineItem>
        ))}
      </Timeline>
    </>
  );
}
```

Note: Add `@mui/lab` to client dependencies for Timeline components.

- [ ] **Step 4: Write ActivityForm dialog**

`packages/client/src/features/activities/components/ActivityForm.tsx`:
```tsx
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createActivitySchema } from '@blackbear/shared';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  accountId: string;
  isLoading?: boolean;
}

export function ActivityForm({ open, onClose, onSubmit, accountId, isLoading }: Props) {
  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(createActivitySchema),
    defaultValues: { account_id: accountId, type: 'meeting', title: '', description: '', occurred_at: new Date().toISOString().slice(0, 16) },
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>Log Activity</DialogTitle>
        <DialogContent>
          <Controller name="type" control={control} render={({ field }) =>
            <FormControl fullWidth margin="normal"><InputLabel>Type</InputLabel>
              <Select {...field} label="Type">
                <MenuItem value="meeting">Meeting</MenuItem><MenuItem value="call">Call</MenuItem>
                <MenuItem value="email">Email</MenuItem><MenuItem value="note">Note</MenuItem>
                <MenuItem value="proposal">Proposal</MenuItem><MenuItem value="follow_up">Follow-up</MenuItem>
              </Select></FormControl>} />
          <Controller name="title" control={control} render={({ field }) =>
            <TextField {...field} fullWidth label="Title" margin="normal" error={!!errors.title} />} />
          <Controller name="description" control={control} render={({ field }) =>
            <TextField {...field} fullWidth label="Description" margin="normal" multiline rows={3} />} />
          <Controller name="occurred_at" control={control} render={({ field }) =>
            <TextField {...field} fullWidth label="Date/Time" type="datetime-local" margin="normal" InputLabelProps={{ shrink: true }} />} />
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

- [ ] **Step 5: Write HealthScoreCard and HealthTrendChart**

`packages/client/src/features/health/components/HealthScoreCard.tsx`:
```tsx
import { Card, CardContent, Typography, Box } from '@mui/material';
import { TrendingUp, TrendingDown, TrendingFlat } from '@mui/icons-material';

const COLOR_MAP: Record<string, string> = { green: '#4caf50', yellow: '#ff9800', orange: '#f57c00', red: '#f44336', gray: '#9e9e9e' };
const TREND = { up: <TrendingUp />, down: <TrendingDown />, flat: <TrendingFlat /> };

export function HealthScoreCard({ score, color, trend }: { score: number | null; color: string; trend: string }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="overline">Health Score</Typography>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="h2" sx={{ color: COLOR_MAP[color] ?? '#9e9e9e' }}>
            {score ?? '--'}
          </Typography>
          <Box sx={{ color: COLOR_MAP[color] }}>{TREND[trend as keyof typeof TREND]}</Box>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {score !== null && score >= 80 ? 'Healthy' : score !== null && score >= 60 ? 'Needs attention' : score !== null && score >= 40 ? 'At risk' : score !== null ? 'Critical' : 'No data'}
        </Typography>
      </CardContent>
    </Card>
  );
}
```

`packages/client/src/features/health/components/HealthTrendChart.tsx`:
```tsx
import { Card, CardContent, Typography } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface Props {
  history: Array<{ calculated_at: string; overall_score: number }>;
}

export function HealthTrendChart({ history }: Props) {
  const chartData = history.map((h) => ({
    date: new Date(h.calculated_at).toLocaleDateString(),
    score: h.overall_score,
  }));

  return (
    <Card>
      <CardContent>
        <Typography variant="overline" mb={2}>Health Score Trend</Typography>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <ReferenceLine y={80} stroke="#4caf50" strokeDasharray="3 3" label="Healthy" />
            <ReferenceLine y={40} stroke="#f44336" strokeDasharray="3 3" label="At Risk" />
            <Line type="monotone" dataKey="score" stroke="#1a1a2e" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: contact list/form, activity timeline/form, health score card and trend chart"
```

---

### Task 19: Dashboard Pages

**Files:**
- Create: `packages/server/src/modules/dashboard/dashboard.routes.ts`
- Create: `packages/server/src/modules/dashboard/dashboard.service.ts`
- Create: `packages/client/src/features/dashboard/ManagerDashboard.tsx`
- Create: `packages/client/src/features/dashboard/DashboardRedirect.tsx`

- [ ] **Step 1: Write dashboard backend service**

`packages/server/src/modules/dashboard/dashboard.service.ts`:
```typescript
import { db } from '../../core/database/connection.js';

export async function getManagerDashboard(userId: string) {
  const accounts = await db('accounts').where({ owner_id: userId, status: 'active' });
  const accountIds = accounts.map((a: any) => a.id);

  // Get latest health scores for each account
  const healthScores = await db('health_scores')
    .whereIn('account_id', accountIds)
    .distinctOn('account_id')
    .orderBy('account_id')
    .orderBy('calculated_at', 'desc');

  const atRisk = healthScores.filter((h: any) => h.overall_score < 60);

  // Recent activities
  const recentActivities = await db('activities')
    .whereIn('account_id', accountIds)
    .orderBy('occurred_at', 'desc').limit(10);

  // Unread alerts
  const alerts = await db('alerts').where({ user_id: userId, is_read: false, is_dismissed: false })
    .orderBy('created_at', 'desc').limit(10);

  return {
    total_accounts: accounts.length,
    at_risk_count: atRisk.length,
    health_scores: healthScores,
    at_risk_accounts: atRisk.map((h: any) => {
      const account = accounts.find((a: any) => a.id === h.account_id);
      return { ...h, account_name: account?.name };
    }),
    recent_activities: recentActivities,
    alerts,
  };
}

export async function getTeamLeadDashboard() {
  const accounts = await db('accounts').where({ status: 'active' });
  const healthScores = await db('health_scores')
    .distinctOn('account_id')
    .orderBy('account_id')
    .orderBy('calculated_at', 'desc');
  const atRisk = healthScores.filter((h: any) => h.overall_score < 60);

  return {
    total_accounts: accounts.length,
    at_risk_count: atRisk.length,
    at_risk_accounts: atRisk.map((h: any) => {
      const account = accounts.find((a: any) => a.id === h.account_id);
      return { ...h, account_name: account?.name, owner_id: account?.owner_id };
    }),
  };
}

export async function getOperationsDashboard() {
  const totalAccounts = await db('accounts').count('id as count').first();
  const totalContacts = await db('contacts').count('id as count').first();
  const accountsWithoutContacts = await db('accounts')
    .leftJoin('contacts', 'accounts.id', 'contacts.account_id')
    .whereNull('contacts.id').count('accounts.id as count').first();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const inactiveAccounts = await db('accounts')
    .where('status', 'active')
    .whereNotIn('id', db('activities').where('occurred_at', '>=', thirtyDaysAgo).distinct('account_id'))
    .count('id as count').first();

  return {
    total_accounts: Number(totalAccounts?.count ?? 0),
    total_contacts: Number(totalContacts?.count ?? 0),
    accounts_without_contacts: Number(accountsWithoutContacts?.count ?? 0),
    inactive_accounts_30d: Number(inactiveAccounts?.count ?? 0),
  };
}
```

- [ ] **Step 2: Write dashboard routes**

`packages/server/src/modules/dashboard/dashboard.routes.ts`:
```typescript
import { Router } from 'express';
import { authenticate } from '../../core/middleware/auth.js';
import { requireRole } from '../../core/middleware/rbac.js';
import { sendSuccess } from '../../core/helpers/response.js';
import * as dashboardService from './dashboard.service.js';

const router = Router();
router.use(authenticate);

router.get('/manager', async (req, res, next) => {
  try {
    const data = await dashboardService.getManagerDashboard(req.user!.userId);
    sendSuccess(res, data);
  } catch (err) { next(err); }
});

router.get('/team-lead', requireRole('admin', 'team_lead'), async (_req, res, next) => {
  try {
    const data = await dashboardService.getTeamLeadDashboard();
    sendSuccess(res, data);
  } catch (err) { next(err); }
});

router.get('/operations', requireRole('admin'), async (_req, res, next) => {
  try {
    const data = await dashboardService.getOperationsDashboard();
    sendSuccess(res, data);
  } catch (err) { next(err); }
});

export const dashboardRoutes = router;
```

Mount in app.ts:
```typescript
import { dashboardRoutes } from './modules/dashboard/dashboard.routes.js';
app.use('/api/dashboard', dashboardRoutes);
```

- [ ] **Step 3: Write DashboardRedirect and ManagerDashboard**

`packages/client/src/features/dashboard/DashboardRedirect.tsx`:
```tsx
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';

export function DashboardRedirect() {
  const user = useSelector((state: RootState) => state.auth.user);
  if (user?.role === 'admin') return <Navigate to="/dashboard/operations" replace />;
  if (user?.role === 'team_lead') return <Navigate to="/dashboard/team-lead" replace />;
  return <Navigate to="/dashboard/manager" replace />;
}
```

`packages/client/src/features/dashboard/ManagerDashboard.tsx`:
```tsx
import { Grid, Card, CardContent, Typography, List, ListItem, ListItemText, Chip } from '@mui/material';
import { useGetManagerDashboardQuery } from '../../store/api/dashboardApi';
import { LoadingState } from '../../components/common/LoadingState';
import { HealthBadge } from '../accounts/components/HealthBadge';
import { useNavigate } from 'react-router-dom';

export function ManagerDashboard() {
  const { data, isLoading } = useGetManagerDashboardQuery();
  const navigate = useNavigate();

  if (isLoading) return <LoadingState />;
  const d = data?.data;

  return (
    <>
      <Typography variant="h5" mb={3}>Dashboard</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={4}>
          <Card><CardContent>
            <Typography variant="overline">Total Accounts</Typography>
            <Typography variant="h3">{d?.total_accounts ?? 0}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card><CardContent>
            <Typography variant="overline">At Risk</Typography>
            <Typography variant="h3" color="error">{d?.at_risk_count ?? 0}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card><CardContent>
            <Typography variant="overline">Unread Alerts</Typography>
            <Typography variant="h3" color="warning.main">{d?.alerts?.length ?? 0}</Typography>
          </CardContent></Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card><CardContent>
            <Typography variant="h6" mb={1}>At-Risk Accounts</Typography>
            <List>
              {d?.at_risk_accounts?.map((a: any) => (
                <ListItem key={a.account_id} button onClick={() => navigate(`/accounts/${a.account_id}`)}>
                  <ListItemText primary={a.account_name} />
                  <Chip label={a.overall_score} color="error" size="small" />
                </ListItem>
              ))}
            </List>
          </CardContent></Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card><CardContent>
            <Typography variant="h6" mb={1}>Recent Activity</Typography>
            <List>
              {d?.recent_activities?.slice(0, 5).map((a: any) => (
                <ListItem key={a.id}>
                  <ListItemText primary={a.title} secondary={`${a.type} | ${new Date(a.occurred_at).toLocaleDateString()}`} />
                </ListItem>
              ))}
            </List>
          </CardContent></Card>
        </Grid>
      </Grid>
    </>
  );
}
```

- [ ] **Step 4: Update App.tsx routes**

```typescript
import { DashboardRedirect } from './features/dashboard/DashboardRedirect';
import { ManagerDashboard } from './features/dashboard/ManagerDashboard';

<Route path="/dashboard" element={<DashboardRedirect />} />
<Route path="/dashboard/manager" element={<ManagerDashboard />} />
<Route path="/dashboard/team-lead" element={<PlaceholderPage title="Team Lead Dashboard" />} />
<Route path="/dashboard/operations" element={<PlaceholderPage title="Operations Dashboard" />} />
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: dashboard backend + manager dashboard frontend"
```

---

### Task 20: Alerts UI and WebSocket Hook

**Files:**
- Create: `packages/client/src/features/alerts/components/AlertBell.tsx`
- Create: `packages/client/src/features/alerts/components/AlertPanel.tsx`
- Create: `packages/client/src/hooks/useSocket.ts`
- Modify: `packages/client/src/components/layout/Header.tsx`

- [ ] **Step 1: Write useSocket hook**

`packages/client/src/hooks/useSocket.ts`:
```typescript
import { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { io, Socket } from 'socket.io-client';
import type { RootState } from '../store/store';
import { baseApi } from '../store/api/baseApi';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const token = useSelector((state: RootState) => state.auth.accessToken);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!token) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      return;
    }

    const socket = io(window.location.origin, { auth: { token }, path: '/socket.io' });

    socket.on('health:updated', ({ accountId }) => {
      dispatch(baseApi.util.invalidateTags([{ type: 'Health', id: accountId }, 'Dashboard']));
    });

    socket.on('alert:new', () => {
      dispatch(baseApi.util.invalidateTags(['Alert']));
    });

    socket.on('activity:created', () => {
      dispatch(baseApi.util.invalidateTags(['Activity', 'Dashboard']));
    });

    socketRef.current = socket;

    return () => { socket.disconnect(); };
  }, [token, dispatch]);
}
```

- [ ] **Step 2: Write AlertBell and AlertPanel**

`packages/client/src/features/alerts/components/AlertBell.tsx`:
```tsx
import { IconButton, Badge, Popover } from '@mui/material';
import { Notifications } from '@mui/icons-material';
import { useState } from 'react';
import { useGetAlertsQuery } from '../../../store/api/alertsApi';
import { AlertPanel } from './AlertPanel';

export function AlertBell() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { data } = useGetAlertsQuery();
  const unread = data?.data?.unread_count ?? 0;

  return (
    <>
      <IconButton color="inherit" onClick={(e) => setAnchorEl(e.currentTarget)}>
        <Badge badgeContent={unread} color="error"><Notifications /></Badge>
      </IconButton>
      <Popover open={!!anchorEl} anchorEl={anchorEl} onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <AlertPanel alerts={data?.data?.alerts ?? []} onClose={() => setAnchorEl(null)} />
      </Popover>
    </>
  );
}
```

`packages/client/src/features/alerts/components/AlertPanel.tsx`:
```tsx
import { Box, List, ListItem, ListItemText, Typography, IconButton, Chip } from '@mui/material';
import { Close, CheckCircle } from '@mui/icons-material';
import { useMarkReadMutation, useDismissAlertMutation } from '../../../store/api/alertsApi';

const SEVERITY_COLOR: Record<string, 'error' | 'warning' | 'info' | 'default'> = {
  critical: 'error', high: 'error', medium: 'warning', low: 'info',
};

export function AlertPanel({ alerts, onClose }: { alerts: any[]; onClose: () => void }) {
  const [markRead] = useMarkReadMutation();
  const [dismiss] = useDismissAlertMutation();

  return (
    <Box sx={{ width: 360, maxHeight: 400, overflow: 'auto' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" px={2} py={1}>
        <Typography variant="h6">Alerts</Typography>
        <IconButton size="small" onClick={onClose}><Close /></IconButton>
      </Box>
      <List dense>
        {alerts.length === 0 && (
          <ListItem><ListItemText primary="No alerts" /></ListItem>
        )}
        {alerts.map((alert) => (
          <ListItem key={alert.id} secondaryAction={
            <IconButton size="small" onClick={() => dismiss(alert.id)}><CheckCircle fontSize="small" /></IconButton>
          } onClick={() => markRead(alert.id)} sx={{ cursor: 'pointer', bgcolor: alert.is_read ? 'inherit' : 'action.hover' }}>
            <ListItemText
              primary={<Box display="flex" gap={1} alignItems="center">
                {alert.title} <Chip label={alert.severity} size="small" color={SEVERITY_COLOR[alert.severity]} />
              </Box>}
              secondary={alert.message}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
```

- [ ] **Step 3: Add AlertBell to Header and useSocket to AppShell**

Update `Header.tsx` to include `<AlertBell />` next to the user name.

Update `AppShell.tsx` to call `useSocket()` at the top of the component.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: alert bell, alert panel, WebSocket hook for real-time updates"
```

---

## Chunk 7: Data Import, Docker, and Deployment

### Task 21: CSV Data Import

**Files:**
- Create: `packages/server/src/modules/import/import.routes.ts`
- Create: `packages/server/src/modules/import/import.service.ts`

- [ ] **Step 1: Write import service**

`packages/server/src/modules/import/import.service.ts`:
```typescript
import { parse } from 'csv-parse/sync';
import { createAccountSchema, createContactSchema } from '@blackbear/shared';
import { db } from '../../core/database/connection.js';
import { logger } from '../../core/logger.js';

interface ImportResult {
  total: number;
  valid: number;
  invalid: number;
  errors: Array<{ row: number; errors: Record<string, string[]> }>;
  imported: number;
}

// Step 1: Validate CSV and return report (no data inserted)
export async function validateAccounts(csvBuffer: Buffer, userId: string) {
  const records = parse(csvBuffer, { columns: true, skip_empty_lines: true, trim: true });
  const validRows: any[] = [];
  const errors: ImportResult['errors'] = [];

  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    let owner_id = userId;
    if (row.owner_email) {
      const owner = await db('users').where({ email: row.owner_email, is_active: true }).first();
      if (owner) owner_id = owner.id;
    }
    const result = createAccountSchema.safeParse({
      name: row.name, industry: row.industry, tier: row.tier,
      website: row.website || null, status: row.status || 'active', owner_id,
    });
    if (result.success) {
      validRows.push(result.data);
    } else {
      errors.push({ row: i + 2, errors: result.error.flatten().fieldErrors as any });
    }
  }
  return { total: records.length, valid: validRows.length, invalid: errors.length, errors, validRows };
}

// Step 2: Confirm and insert validated rows
export async function confirmAccountImport(validRows: any[], userId: string) {
  let imported = 0;
  if (validRows.length > 0) {
    await db.transaction(async (trx) => {
      await trx('accounts').insert(validRows);
      imported = validRows.length;
    });
  }
  logger.info({ imported }, 'Account import confirmed');
  return { imported };
}

// Step 1: Validate contacts CSV
export async function validateContacts(csvBuffer: Buffer, userId: string) {
  const records = parse(csvBuffer, { columns: true, skip_empty_lines: true, trim: true });
  const validRows: any[] = [];
  const errors: ImportResult['errors'] = [];

  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    const account = await db('accounts').whereILike('name', row.account_name).first();
    if (!account) {
      errors.push({ row: i + 2, errors: { account_name: [`Account "${row.account_name}" not found`] } });
      continue;
    }
    const result = createContactSchema.safeParse({
      first_name: row.first_name, last_name: row.last_name,
      email: row.email || null, phone: row.phone || null,
      title: row.title, role_level: row.role_level,
      is_primary: row.is_primary === 'true',
    });
    if (result.success) {
      validRows.push({ ...result.data, account_id: account.id });
    } else {
      errors.push({ row: i + 2, errors: result.error.flatten().fieldErrors as any });
    }
  }
  return { total: records.length, valid: validRows.length, invalid: errors.length, errors, validRows };
}

// Step 2: Confirm and insert validated contacts
export async function confirmContactImport(validRows: any[]) {
  let imported = 0;
  if (validRows.length > 0) {
    await db.transaction(async (trx) => {
      await trx('contacts').insert(validRows);
      imported = validRows.length;
    });
  }
  logger.info({ imported }, 'Contact import confirmed');
  return { imported };
}

export function getAccountTemplate(): string {
  return 'name,industry,tier,website,status,owner_email\n';
}

export function getContactTemplate(): string {
  return 'account_name,first_name,last_name,email,phone,title,role_level,is_primary\n';
}
```

- [ ] **Step 2: Write import routes**

`packages/server/src/modules/import/import.routes.ts`:
```typescript
import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../../core/middleware/auth.js';
import { requireRole } from '../../core/middleware/rbac.js';
import { sendSuccess } from '../../core/helpers/response.js';
import * as importService from './import.service.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.use(authenticate, requireRole('admin', 'team_lead'));

import { importLimiter } from '../../core/middleware/rate-limit.js';
router.use(importLimiter);

router.post('/accounts/validate', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'No file uploaded' } });
    const result = await importService.validateAccounts(req.file.buffer, req.user!.userId);
    sendSuccess(res, result);
  } catch (err) { next(err); }
});

router.post('/accounts/confirm', async (req, res, next) => {
  try {
    const result = await importService.confirmAccountImport(req.body.validRows, req.user!.userId);
    sendSuccess(res, result);
  } catch (err) { next(err); }
});

router.post('/contacts/validate', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'No file uploaded' } });
    const result = await importService.validateContacts(req.file.buffer, req.user!.userId);
    sendSuccess(res, result);
  } catch (err) { next(err); }
});

router.post('/contacts/confirm', async (req, res, next) => {
  try {
    const result = await importService.confirmContactImport(req.body.validRows);
    sendSuccess(res, result);
  } catch (err) { next(err); }
});

router.get('/template/:type', (req, res) => {
  const type = req.params.type;
  const csv = type === 'accounts' ? importService.getAccountTemplate() : importService.getContactTemplate();
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=${type}-template.csv`);
  res.send(csv);
});

export const importRoutes = router;
```

Mount in app.ts:
```typescript
import { importRoutes } from './modules/import/import.routes.js';
app.use('/api/import', importRoutes);
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: CSV data import for accounts and contacts with validation"
```

---

### Task 22: Docker Configuration

**Files:**
- Create: `packages/server/Dockerfile`
- Create: `packages/client/Dockerfile`
- Create: `packages/client/nginx.conf`
- Create: `docker-compose.yml`
- Create: `docker-compose.dev.yml`

- [ ] **Step 1: Write server Dockerfile**

`packages/server/Dockerfile`:
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/server/package.json packages/server/
RUN npm ci --workspace=packages/shared --workspace=packages/server
COPY packages/shared packages/shared
COPY packages/server packages/server
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=packages/server

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/packages/shared/package.json packages/shared/
COPY --from=builder /app/packages/shared/dist packages/shared/dist
COPY --from=builder /app/packages/server/package.json packages/server/
COPY --from=builder /app/packages/server/dist packages/server/dist
RUN npm ci --workspace=packages/shared --workspace=packages/server --omit=dev
EXPOSE 3000
CMD ["node", "packages/server/dist/server.js"]
```

- [ ] **Step 2: Write client Dockerfile and nginx.conf**

`packages/client/nginx.conf`:
```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://app:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /socket.io {
        proxy_pass http://app:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

`packages/client/Dockerfile`:
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/client/package.json packages/client/
RUN npm ci --workspace=packages/shared --workspace=packages/client
COPY packages/shared packages/shared
COPY packages/client packages/client
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=packages/client

FROM nginx:alpine
COPY --from=builder /app/packages/client/dist /usr/share/nginx/html
COPY packages/client/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

- [ ] **Step 3: Write docker-compose.yml for production**

`docker-compose.yml`:
```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: packages/server/Dockerfile
    restart: unless-stopped
    env_file: .env
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
    networks:
      - internal

  worker:
    build:
      context: .
      dockerfile: packages/server/Dockerfile
    command: node packages/server/dist/worker.js
    restart: unless-stopped
    env_file: .env
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
    networks:
      - internal

  client:
    build:
      context: .
      dockerfile: packages/client/Dockerfile
    restart: unless-stopped
    ports:
      - "80:80"
    depends_on:
      - app
    networks:
      - internal

  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: blackbear
      POSTGRES_USER: blackbear
      POSTGRES_PASSWORD: ${DB_PASSWORD:-blackbear}
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U blackbear"]
      interval: 5s
      retries: 5
    networks:
      - internal

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - redisdata:/data
    networks:
      - internal

volumes:
  pgdata:
  redisdata:

networks:
  internal:
```

- [ ] **Step 4: Write docker-compose.dev.yml for local development**

`docker-compose.dev.yml`:
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: blackbear
      POSTGRES_USER: blackbear
      POSTGRES_PASSWORD: blackbear
    volumes:
      - pgdata_dev:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes

volumes:
  pgdata_dev:
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: Docker configuration (production and development)"
```

---

### Task 23: LLM Abstraction Layer (Phase 2 Ready)

**Files:**
- Create: `packages/server/src/modules/ai/ai.provider.ts`
- Create: `packages/server/src/modules/ai/ai.openai.ts`
- Create: `packages/server/src/modules/ai/ai.anthropic.ts`
- Create: `packages/server/src/modules/ai/ai.service.ts`

- [ ] **Step 1: Write provider interface and implementations**

`packages/server/src/modules/ai/ai.provider.ts`:
```typescript
export interface AiProvider {
  generateText(prompt: string, options?: { maxTokens?: number }): Promise<string>;
  summarize(text: string): Promise<string>;
  analyzeSentiment(text: string): Promise<{ score: number; label: string }>;
}
```

`packages/server/src/modules/ai/ai.openai.ts`:
```typescript
import type { AiProvider } from './ai.provider.js';

export class OpenAiProvider implements AiProvider {
  async generateText(prompt: string, options?: { maxTokens?: number }): Promise<string> {
    throw new Error('OpenAI provider not configured. Set OPENAI_API_KEY in environment.');
  }
  async summarize(text: string): Promise<string> {
    return this.generateText(`Summarize the following:\n\n${text}`);
  }
  async analyzeSentiment(text: string): Promise<{ score: number; label: string }> {
    throw new Error('OpenAI provider not configured.');
  }
}
```

`packages/server/src/modules/ai/ai.anthropic.ts`:
```typescript
import type { AiProvider } from './ai.provider.js';

export class AnthropicProvider implements AiProvider {
  async generateText(prompt: string, options?: { maxTokens?: number }): Promise<string> {
    throw new Error('Anthropic provider not configured. Set ANTHROPIC_API_KEY in environment.');
  }
  async summarize(text: string): Promise<string> {
    return this.generateText(`Summarize the following:\n\n${text}`);
  }
  async analyzeSentiment(text: string): Promise<{ score: number; label: string }> {
    throw new Error('Anthropic provider not configured.');
  }
}
```

`packages/server/src/modules/ai/ai.service.ts`:
```typescript
import type { AiProvider } from './ai.provider.js';
import { OpenAiProvider } from './ai.openai.js';
import { AnthropicProvider } from './ai.anthropic.js';

let provider: AiProvider | null = null;

export function getAiProvider(): AiProvider {
  if (provider) return provider;

  const llmProvider = process.env.LLM_PROVIDER ?? 'openai';
  provider = llmProvider === 'anthropic' ? new AnthropicProvider() : new OpenAiProvider();
  return provider;
}
```

- [ ] **Step 2: Write 501 stub routes for AI endpoints**

Add to accounts routes or create a stub:
```typescript
// In app.ts:
app.post('/api/accounts/:id/briefing', authenticate, (_req, res) => {
  res.status(501).json({ error: { code: 'NOT_IMPLEMENTED', message: 'AI briefings available in Phase 2' } });
});
app.get('/api/accounts/:id/briefings', authenticate, (_req, res) => {
  res.status(501).json({ error: { code: 'NOT_IMPLEMENTED', message: 'AI briefings available in Phase 2' } });
});

// Integration stubs
app.post('/api/integrations/connect', authenticate, (_req, res) => {
  res.status(501).json({ error: { code: 'NOT_IMPLEMENTED', message: 'Integrations available in Phase 2' } });
});
app.get('/api/integrations/callback', (_req, res) => {
  res.status(501).json({ error: { code: 'NOT_IMPLEMENTED', message: 'Integrations available in Phase 2' } });
});
app.get('/api/integrations/status', authenticate, (_req, res) => {
  res.status(501).json({ error: { code: 'NOT_IMPLEMENTED', message: 'Integrations available in Phase 2' } });
});
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: LLM abstraction layer and Phase 2/3 endpoint stubs"
```

---

### Task 24: Final Verification and Cleanup

- [ ] **Step 1: Verify full server build**

Run: `npm run build`
Expected: shared, server, and client all compile without errors

- [ ] **Step 2: Run all backend tests**

Run: `npm test --workspace=packages/server`
Expected: All tests pass

- [ ] **Step 3: Run all frontend tests**

Run: `npm test --workspace=packages/client`
Expected: All tests pass (or skip if no frontend tests yet)

- [ ] **Step 4: Test Docker build locally**

Run: `docker compose -f docker-compose.dev.yml up -d` (start dev DB and Redis)
Run: `docker compose build` (verify production images build)
Expected: All images build successfully

- [ ] **Step 5: Verify migrations and seed**

Run: `npm run migrate && npm run seed:admin`
Expected: Migrations apply, admin user created

- [ ] **Step 6: Manual smoke test**

Start server: `npm run dev:server`
Start client: `npm run dev:client`
Test: Login with admin credentials, view dashboard, create an account, add a contact, log an activity, verify health score calculates.

- [ ] **Step 7: Final commit**

```bash
git add -A
git commit -m "chore: final verification and cleanup for Phase 1 MVP"
```

---

## Summary

**23 tasks across 7 chunks:**
- Chunk 1 (Tasks 1-3): Monorepo scaffolding, config, migrations
- Chunk 2 (Tasks 4-7): Shared types, middleware, auth, user management
- Chunk 3 (Tasks 8-10): Accounts, contacts, activities CRUD
- Chunk 4 (Tasks 11-13): Health scoring, alerts, WebSocket, worker
- Chunk 5 (Tasks 14-15): Frontend foundation (store, auth, layout, router)
- Chunk 6 (Tasks 16-20): API slices, account pages, components, dashboard, alerts UI
- Chunk 7 (Tasks 21-24): CSV import, Docker, LLM stubs, final verification

**Architecture delivered:**
- Full database schema for Phase 1, 2, and 3
- All Phase 2/3 queue definitions and endpoint stubs
- LLM provider abstraction ready for implementation
- Integration connection table ready for M365
