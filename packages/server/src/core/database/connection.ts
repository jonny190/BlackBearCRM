import knex from 'knex';
import path from 'path';
import { config } from '../config.js';

// In dev: runs from src/, in prod Docker: migrations are at src/core/database/migrations/
// Use __dirname to resolve relative to compiled output, then check both locations
const migrationsDir = path.resolve(__dirname, '..', '..', '..', 'src', 'core', 'database', 'migrations');

export const db = knex({
  client: 'pg',
  connection: config.DATABASE_URL,
  pool: { min: 2, max: 10 },
  migrations: {
    directory: migrationsDir,
    extension: 'ts',
  },
});
