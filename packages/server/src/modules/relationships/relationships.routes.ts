import { Router } from 'express';
import { authenticate } from '../../core/middleware/auth.js';
import { sendSuccess, sendCreated, sendNoContent } from '../../core/helpers/response.js';
import { db } from '../../core/database/connection.js';

const router = Router();
router.use(authenticate);

// GET /api/accounts/:accountId/relationships
router.get('/accounts/:accountId/relationships', async (req, res, next) => {
  try {
    const relationships = await db('relationship_maps')
      .where('relationship_maps.account_id', req.params.accountId)
      .join('contacts as c1', 'relationship_maps.contact_id', 'c1.id')
      .join('contacts as c2', 'relationship_maps.related_contact_id', 'c2.id')
      .select(
        'relationship_maps.*',
        'c1.first_name as contact_first_name', 'c1.last_name as contact_last_name', 'c1.title as contact_title', 'c1.role_level as contact_role_level',
        'c2.first_name as related_first_name', 'c2.last_name as related_last_name', 'c2.title as related_title', 'c2.role_level as related_role_level'
      );
    sendSuccess(res, relationships);
  } catch (err) { next(err); }
});

// POST /api/accounts/:accountId/relationships
router.post('/accounts/:accountId/relationships', async (req, res, next) => {
  try {
    const { contact_id, related_contact_id, relationship_type, strength } = req.body;
    const [rel] = await db('relationship_maps').insert({
      account_id: req.params.accountId, contact_id, related_contact_id,
      relationship_type: relationship_type || 'works_with',
      strength: strength || 50,
    }).returning('*');
    sendCreated(res, rel);
  } catch (err) { next(err); }
});

// PUT /api/relationships/:id
router.put('/relationships/:id', async (req, res, next) => {
  try {
    const { relationship_type, strength } = req.body;
    const [rel] = await db('relationship_maps').where({ id: req.params.id })
      .update({ relationship_type, strength }).returning('*');
    sendSuccess(res, rel);
  } catch (err) { next(err); }
});

// DELETE /api/relationships/:id
router.delete('/relationships/:id', async (req, res, next) => {
  try {
    await db('relationship_maps').where({ id: req.params.id }).del();
    sendNoContent(res);
  } catch (err) { next(err); }
});

export const relationshipRoutes = router;
