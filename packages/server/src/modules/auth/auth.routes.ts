import { Router } from 'express';
import { loginSchema } from '@blackbear/shared';
import { validateBody } from '../../core/middleware/validate.js';
import { authenticate } from '../../core/middleware/auth.js';
import { authLimiter } from '../../core/middleware/rate-limit.js';
import { sendSuccess } from '../../core/helpers/response.js';
import * as authService from './auth.service.js';

const router = Router();

router.post('/login', authLimiter, validateBody(loginSchema), async (req, res, next) => {
  try {
    const { accessToken, refreshToken, user } = await authService.login(req.body.email, req.body.password);
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    sendSuccess(res, { accessToken, user });
  } catch (err) {
    next(err);
  }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'No refresh token' } });
    const result = await authService.refreshAccessToken(token);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

router.post('/logout', (_req, res) => {
  res.clearCookie('refreshToken');
  res.status(204).send();
});

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user!.userId);
    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
});

// Phase 2 stubs
router.post('/forgot-password', (_req, res) => {
  res.status(501).json({ error: { code: 'NOT_IMPLEMENTED', message: 'Self-service password reset available in Phase 2' } });
});
router.post('/reset-password', (_req, res) => {
  res.status(501).json({ error: { code: 'NOT_IMPLEMENTED', message: 'Self-service password reset available in Phase 2' } });
});

export const authRoutes = router;
