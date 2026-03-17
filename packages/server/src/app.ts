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
import { authRoutes } from './modules/auth/auth.routes.js';
import { userRoutes } from './modules/auth/users.routes.js';
import { accountRoutes } from './modules/accounts/accounts.routes.js';
import { accountContactsRouter, contactsRouter } from './modules/contacts/contacts.routes.js';
import { activityRoutes } from './modules/activities/activities.routes.js';
import { healthConfigRouter } from './modules/health/health.routes.js';
import { alertsRouter } from './modules/alerts/alerts.routes.js';
import { dashboardRoutes } from './modules/dashboard/dashboard.routes.js';
import { importRoutes } from './modules/import/import.routes.js';

export function createApp() {
  const app = express();

  // Security and parsing
  app.use(helmet());
  app.use(cors({ origin: config.CORS_ORIGIN, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());
  app.use(pinoHttp({ logger }));

  app.use('/api/health', healthConfigRouter);

  // System health check (no auth)
  app.get('/api/health-check', async (_req, res) => {
    let dbStatus = 'disconnected';
    let redisStatus = 'disconnected';
    try { await db.raw('SELECT 1'); dbStatus = 'connected'; } catch {}
    try { await redis.ping(); redisStatus = 'connected'; } catch {}
    res.json({ status: 'ok', uptime: process.uptime(), database: dbStatus, redis: redisStatus });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/accounts', accountRoutes);
  app.use('/api/accounts/:id/contacts', accountContactsRouter);
  app.use('/api/contacts', contactsRouter);
  app.use('/api/activities', activityRoutes);
  app.use('/api/alerts', alertsRouter);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/import', importRoutes);

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}
