import { Router } from 'express';
import { authenticate } from '../../core/middleware/auth.js';
import { requireRole } from '../../core/middleware/rbac.js';
import { sendSuccess } from '../../core/helpers/response.js';
import * as reportsService from './reports.service.js';

const router = Router();
router.use(authenticate, requireRole('admin', 'team_lead'));

router.get('/health-distribution', async (_req, res, next) => {
  try { sendSuccess(res, await reportsService.getHealthDistribution()); } catch (err) { next(err); }
});

router.get('/activity-trends', async (req, res, next) => {
  try {
    const days = Number(req.query.days) || 30;
    sendSuccess(res, await reportsService.getActivityTrends(days));
  } catch (err) { next(err); }
});

router.get('/tier-breakdown', async (_req, res, next) => {
  try { sendSuccess(res, await reportsService.getTierBreakdown()); } catch (err) { next(err); }
});

router.get('/top-accounts', async (req, res, next) => {
  try {
    const limit = Number(req.query.limit) || 10;
    sendSuccess(res, await reportsService.getTopAccountsByHealth(limit));
  } catch (err) { next(err); }
});

router.get('/engagement-by-tier', async (_req, res, next) => {
  try { sendSuccess(res, await reportsService.getEngagementByTier()); } catch (err) { next(err); }
});

export const reportsRoutes = router;
