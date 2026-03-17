import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { authenticate } from '../../core/middleware/auth.js';
import { sendSuccess, sendNoContent } from '../../core/helpers/response.js';
import { db } from '../../core/database/connection.js';
import { UnauthorizedError } from '../../core/helpers/errors.js';

const router = Router();
router.use(authenticate);

// GET /api/profile
router.get('/', async (req, res, next) => {
  try {
    const user = await db('users').where({ id: req.user!.userId }).first();
    const { password_hash, ...profile } = user;
    sendSuccess(res, profile);
  } catch (err) { next(err); }
});

// PUT /api/profile
router.put('/', async (req, res, next) => {
  try {
    const { first_name, last_name } = req.body;
    const [user] = await db('users').where({ id: req.user!.userId })
      .update({ first_name, last_name, updated_at: db.fn.now() }).returning('*');
    const { password_hash, ...profile } = user;
    sendSuccess(res, profile);
  } catch (err) { next(err); }
});

// PUT /api/profile/password
router.put('/password', async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;
    const user = await db('users').where({ id: req.user!.userId }).first();
    const valid = await bcrypt.compare(current_password, user.password_hash);
    if (!valid) throw new UnauthorizedError('Current password is incorrect');
    const password_hash = await bcrypt.hash(new_password, 12);
    await db('users').where({ id: req.user!.userId }).update({ password_hash });
    sendNoContent(res);
  } catch (err) { next(err); }
});

export const profileRoutes = router;
