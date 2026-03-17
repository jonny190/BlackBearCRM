import knex from 'knex';
import path from 'path';
import { config } from '../config.js';

// At runtime, __dirname points to dist/core/database/ -- migrations are compiled there too
const migrationsDir = path.join(__dirname, 'migrations');

export const db = knex({
  client: 'pg',
  connection: config.DATABASE_URL,
  pool: { min: 2, max: 10 },
  migrations: {
    directory: migrationsDir,
    extension: 'js',
  },
});
