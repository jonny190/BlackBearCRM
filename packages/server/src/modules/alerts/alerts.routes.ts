import { Router } from 'express';
import { authenticate } from '../../core/middleware/auth.js';
import { sendSuccess } from '../../core/helpers/response.js';
import { NotFoundError } from '../../core/helpers/errors.js';
import {
  listAlertsByUser,
  markRead,
  markDismissed,
  getUnreadCount,
} from './alerts.queries.js';

const router = Router();

router.use(authenticate);

// GET /api/alerts -- list alerts for the authenticated user
router.get('/', async (req, res, next) => {
  try {
    const alerts = await listAlertsByUser(req.user!.userId);
    const unreadCount = await getUnreadCount(req.user!.userId);
    res.setHeader('X-Unread-Count', String(unreadCount));
    sendSuccess(res, alerts, {
      page: 1,
      limit: alerts.length,
      total: alerts.length,
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/alerts/:id/read
router.put('/:id/read', async (req, res, next) => {
  try {
    const alert = await markRead(req.params.id);
    if (!alert) throw new NotFoundError('Alert', req.params.id);
    sendSuccess(res, alert);
  } catch (err) {
    next(err);
  }
});

// PUT /api/alerts/:id/dismiss
router.put('/:id/dismiss', async (req, res, next) => {
  try {
    const alert = await markDismissed(req.params.id);
    if (!alert) throw new NotFoundError('Alert', req.params.id);
    sendSuccess(res, alert);
  } catch (err) {
    next(err);
  }
});

export const alertsRouter = router;
