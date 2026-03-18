import { Router } from 'express';
import {
  createActivitySchema,
  updateActivitySchema,
  activityQuerySchema,
} from '@blackpear/shared';
import { authenticate } from '../../core/middleware/auth.js';
import { validateBody, validateQuery } from '../../core/middleware/validate.js';
import { sendSuccess, sendCreated, sendNoContent } from '../../core/helpers/response.js';
import * as activitiesService from './activities.service.js';

const router = Router();

router.use(authenticate);

router.get('/', validateQuery(activityQuerySchema), async (req, res, next) => {
  try {
    const result = await activitiesService.listActivities(
      req.query as any,
      req.user!.userId,
      req.user!.role,
    );
    sendSuccess(res, result.data, result.meta);
  } catch (err) {
    next(err);
  }
});

router.post('/', validateBody(createActivitySchema), async (req, res, next) => {
  try {
    const activity = await activitiesService.createActivity(
      req.body,
      req.user!.userId,
      req.user!.role,
    );
    sendCreated(res, activity);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', validateBody(updateActivitySchema), async (req, res, next) => {
  try {
    const activity = await activitiesService.updateActivity(
      req.params.id,
      req.body,
      req.user!.userId,
      req.user!.role,
    );
    sendSuccess(res, activity);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await activitiesService.deleteActivity(req.params.id, req.user!.userId, req.user!.role);
    sendNoContent(res);
  } catch (err) {
    next(err);
  }
});

export const activityRoutes = router;
