import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../../core/middleware/auth.js';
import { requireRole } from '../../core/middleware/rbac.js';
import { importLimiter } from '../../core/middleware/rate-limit.js';
import { sendSuccess } from '../../core/helpers/response.js';
import * as importService from './import.service.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.use(authenticate, requireRole('admin', 'team_lead'));
router.use(importLimiter);

router.post('/accounts/validate', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'No file uploaded' } });
    const result = await importService.validateAccounts(req.file.buffer, req.user!.userId);
    sendSuccess(res, result);
  } catch (err) { next(err); }
});

router.post('/accounts/confirm', async (req, res, next) => {
  try {
    const result = await importService.confirmAccountImport(req.body.validRows, req.user!.userId);
    sendSuccess(res, result);
  } catch (err) { next(err); }
});

router.post('/contacts/validate', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'No file uploaded' } });
    const result = await importService.validateContacts(req.file.buffer, req.user!.userId);
    sendSuccess(res, result);
  } catch (err) { next(err); }
});

router.post('/contacts/confirm', async (req, res, next) => {
  try {
    const result = await importService.confirmContactImport(req.body.validRows);
    sendSuccess(res, result);
  } catch (err) { next(err); }
});

router.get('/template/:type', (req, res) => {
  const type = req.params.type;
  const csv = type === 'accounts' ? importService.getAccountTemplate() : importService.getContactTemplate();
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=${type}-template.csv`);
  res.send(csv);
});

export const importRoutes = router;
