import { Router } from 'express';
import {
  createAccountSchema,
  updateAccountSchema,
  accountQuerySchema,
} from '@blackpear/shared';
import { authenticate } from '../../core/middleware/auth.js';
import { validateBody, validateQuery } from '../../core/middleware/validate.js';
import { sendSuccess, sendCreated, sendNoContent } from '../../core/helpers/response.js';
import * as accountsService from './accounts.service.js';
import * as activitiesService from '../activities/activities.service.js';
import {
  getAccountHealthHandler,
  getHealthHistoryHandler,
} from '../health/health.routes.js';

const router = Router();

router.use(authenticate);

router.get('/', validateQuery(accountQuerySchema), async (req, res, next) => {
  try {
    const result = await accountsService.listAccounts(
      req.query as any,
      req.user!.userId,
      req.user!.role,
    );
    sendSuccess(res, result.data, result.meta);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const account = await accountsService.getAccount(req.params.id, req.user!.userId, req.user!.role);
    sendSuccess(res, account);
  } catch (err) {
    next(err);
  }
});

router.post('/', validateBody(createAccountSchema), async (req, res, next) => {
  try {
    const account = await accountsService.createAccount(req.body, req.user!.userId);
    sendCreated(res, account);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', validateBody(updateAccountSchema), async (req, res, next) => {
  try {
    const account = await accountsService.updateAccount(
      req.params.id,
      req.body,
      req.user!.userId,
      req.user!.role,
    );
    sendSuccess(res, account);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await accountsService.deleteAccount(req.params.id, req.user!.role);
    sendNoContent(res);
  } catch (err) {
    next(err);
  }
});

router.get('/:id/timeline', async (req, res, next) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const activities = await activitiesService.getTimeline(
      req.params.id,
      req.user!.userId,
      req.user!.role,
      limit,
    );
    sendSuccess(res, activities);
  } catch (err) {
    next(err);
  }
});

router.get('/:id/health', getAccountHealthHandler);
router.get('/:id/health/history', getHealthHistoryHandler);

export const accountRoutes = router;
