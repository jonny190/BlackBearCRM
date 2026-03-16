import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../core/middleware/auth.js';
import { sendSuccess } from '../../core/helpers/response.js';
import { ForbiddenError } from '../../core/helpers/errors.js';
import * as healthService from './health.service.js';

// ---------------------------------------------------------------------------
// Handlers exported for mounting on the accounts router
// ---------------------------------------------------------------------------

export async function getAccountHealthHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await healthService.getAccountHealth(req.params.id);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function getHealthHistoryHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const history = await healthService.getHealthHistory(req.params.id, limit);
    sendSuccess(res, history);
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// Standalone config router mounted at /api/health
// ---------------------------------------------------------------------------

const configRouter = Router();

configRouter.use(authenticate);

configRouter.get('/config', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const configs = await healthService.getHealthConfig();
    sendSuccess(res, configs);
  } catch (err) {
    next(err);
  }
});

configRouter.put('/config', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== 'admin') {
      throw new ForbiddenError('Admin access required');
    }
    const { tier, ...data } = req.body as { tier: string } & Record<string, unknown>;
    const updated = await healthService.updateHealthConfig(tier, data);
    sendSuccess(res, updated);
  } catch (err) {
    next(err);
  }
});

export const healthConfigRouter = configRouter;
