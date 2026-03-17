import { Router } from 'express';
import { authenticate } from '../../core/middleware/auth.js';
import { requireAdmin } from '../../core/middleware/rbac.js';
import { sendSuccess, sendNoContent } from '../../core/helpers/response.js';
import { getIntegrationSettings, updateIntegrationSettings } from './integration.settings.js';
import * as microsoft from './microsoft.service.js';

const router = Router();

// Admin settings routes
router.get('/settings', authenticate, requireAdmin, async (_req, res, next) => {
  try {
    const settings = await getIntegrationSettings('microsoft_365');
    if (settings?.client_secret) {
      settings.client_secret = settings.client_secret.slice(0, 4) + '...' + settings.client_secret.slice(-4);
    }
    sendSuccess(res, settings);
  } catch (err) { next(err); }
});

router.put('/settings', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { client_id, client_secret, tenant_id, redirect_uri, is_enabled } = req.body;
    const updateData: Record<string, unknown> = { client_id, tenant_id, redirect_uri, is_enabled };
    if (client_secret && !client_secret.includes('...')) {
      updateData.client_secret = client_secret;
    }
    const settings = await updateIntegrationSettings('microsoft_365', updateData);
    if (settings?.client_secret) {
      settings.client_secret = settings.client_secret.slice(0, 4) + '...' + settings.client_secret.slice(-4);
    }
    sendSuccess(res, settings);
  } catch (err) { next(err); }
});

// User OAuth flow
router.post('/connect', authenticate, async (req, res, next) => {
  try {
    const authUrl = await microsoft.getAuthUrl(req.user!.userId);
    sendSuccess(res, { auth_url: authUrl });
  } catch (err) { next(err); }
});

router.get('/callback', async (req, res, next) => {
  try {
    const { code, state } = req.query as { code: string; state: string };
    await microsoft.handleCallback(code, state);
    // Redirect to settings page with success
    res.redirect('/settings/integrations?connected=true');
  } catch (err) {
    next(err);
    res.redirect('/settings/integrations?error=connection_failed');
  }
});

router.get('/status', authenticate, async (req, res, next) => {
  try {
    const status = await microsoft.getConnectionStatus(req.user!.userId);
    sendSuccess(res, status);
  } catch (err) { next(err); }
});

router.post('/disconnect', authenticate, async (req, res, next) => {
  try {
    await microsoft.disconnectUser(req.user!.userId);
    sendNoContent(res);
  } catch (err) { next(err); }
});

// Data endpoints
router.get('/emails', authenticate, async (req, res, next) => {
  try {
    const emails = await microsoft.getRecentEmails(req.user!.userId);
    sendSuccess(res, emails);
  } catch (err) { next(err); }
});

router.get('/calendar', authenticate, async (req, res, next) => {
  try {
    const days = Number(req.query.days) || 7;
    const events = await microsoft.getCalendarEvents(req.user!.userId, days);
    sendSuccess(res, events);
  } catch (err) { next(err); }
});

export const integrationsRoutes = router;
