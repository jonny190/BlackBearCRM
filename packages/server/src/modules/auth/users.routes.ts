import { Router } from 'express';
import { createUserSchema, updateUserSchema } from '@blackbear/shared';
import { authenticate } from '../../core/middleware/auth.js';
import { requireAdmin } from '../../core/middleware/rbac.js';
import { validateBody } from '../../core/middleware/validate.js';
import { sendSuccess, sendCreated, sendNoContent } from '../../core/helpers/response.js';
import * as usersService from './users.service.js';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/', async (_req, res, next) => {
  try {
    const users = await usersService.listUsers();
    sendSuccess(res, users);
  } catch (err) { next(err); }
});

router.post('/', validateBody(createUserSchema), async (req, res, next) => {
  try {
    const user = await usersService.createUser(req.body);
    sendCreated(res, user);
  } catch (err) { next(err); }
});

router.put('/:id', validateBody(updateUserSchema), async (req, res, next) => {
  try {
    const user = await usersService.updateUser(req.params.id, req.body);
    sendSuccess(res, user);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await usersService.deactivateUser(req.params.id);
    sendNoContent(res);
  } catch (err) { next(err); }
});

export const userRoutes = router;
