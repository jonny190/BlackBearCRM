import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { config } from './core/config.js';
import { logger } from './core/logger.js';
import { errorHandler } from './core/middleware/error-handler.js';
import { db } from './core/database/connection.js';
import { redis } from './core/queue/setup.js';

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

  // Routes will be mounted here as modules are built

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}
