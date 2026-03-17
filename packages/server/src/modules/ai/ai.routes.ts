import { Router } from 'express';
import { authenticate } from '../../core/middleware/auth.js';
import { requireAdmin } from '../../core/middleware/rbac.js';
import { sendSuccess } from '../../core/helpers/response.js';
import { getAiSettings, updateAiSettings } from './ai.settings.js';
import { getAiProvider, clearProviderCache } from './ai.service.js';

const router = Router();
router.use(authenticate, requireAdmin);

router.get('/settings', async (_req, res, next) => {
  try {
    const settings = await getAiSettings();
    // Never return the full API key to the frontend
    if (settings?.api_key) {
      settings.api_key = settings.api_key.slice(0, 8) + '...' + settings.api_key.slice(-4);
    }
    sendSuccess(res, settings);
  } catch (err) { next(err); }
});

router.put('/settings', async (req, res, next) => {
  try {
    const { provider, api_key, model_id, ollama_url, ollama_model, is_enabled } = req.body;
    // If api_key contains '...' it means the frontend sent back the masked version -- don't update it
    const updateData: Record<string, unknown> = { provider, model_id, ollama_url, ollama_model, is_enabled };
    if (api_key && !api_key.includes('...')) {
      updateData.api_key = api_key;
    }
    const settings = await updateAiSettings(updateData as Parameters<typeof updateAiSettings>[0]);
    clearProviderCache();
    if (settings?.api_key) {
      settings.api_key = settings.api_key.slice(0, 8) + '...' + settings.api_key.slice(-4);
    }
    sendSuccess(res, settings);
  } catch (err) { next(err); }
});

router.post('/test', async (_req, res, next) => {
  try {
    const provider = await getAiProvider();
    if (!provider) {
      return sendSuccess(res, { success: false, message: 'AI provider not configured or disabled' });
    }
    const result = await provider.generateText('Say "Hello from BlackPear CRM!" in exactly those words.');
    sendSuccess(res, { success: true, message: result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Connection failed';
    sendSuccess(res, { success: false, message });
  }
});

export const aiRoutes = router;
