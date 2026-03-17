import knex from 'knex';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config.js';

// __dirname equivalent for ESM-compiled output
const __dirname_resolved = typeof __dirname !== 'undefined'
  ? __dirname
  : path.dirname(fileURLToPath(import.meta.url));

// Point to compiled JS migrations next to this file (dist/core/database/migrations/)
const migrationsDir = path.join(__dirname_resolved, 'migrations');

export const db = knex({
  client: 'pg',
  connection: config.DATABASE_URL,
  pool: { min: 2, max: 10 },
  migrations: {
    directory: migrationsDir,
    extension: 'js',
  },
});
