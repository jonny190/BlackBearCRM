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
