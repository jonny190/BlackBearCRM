import { Router, Request } from 'express';
import {
  createContactSchema,
  updateContactSchema,
  contactQuerySchema,
} from '@blackpear/shared';
import { authenticate } from '../../core/middleware/auth.js';
import { validateBody, validateQuery } from '../../core/middleware/validate.js';
import { sendSuccess, sendCreated, sendNoContent } from '../../core/helpers/response.js';
import * as contactsService from './contacts.service.js';

// Extended request type for mergeParams routes
interface AccountContactRequest extends Request {
  params: { id: string; contactId: string };
}

// Account-scoped contacts router: mergeParams so we get :id from /api/accounts/:id/contacts
const accountContactsRouter = Router({ mergeParams: true });

accountContactsRouter.use(authenticate);

accountContactsRouter.get('/', validateQuery(contactQuerySchema), async (req: AccountContactRequest, res, next) => {
  try {
    const result = await contactsService.listContacts(
      req.params.id,
      req.query as any,
      req.user!.userId,
      req.user!.role,
    );
    sendSuccess(res, result.data, result.meta);
  } catch (err) {
    next(err);
  }
});

accountContactsRouter.get('/:contactId', async (req: AccountContactRequest, res, next) => {
  try {
    const contact = await contactsService.getContact(
      req.params.id,
      req.params.contactId,
      req.user!.userId,
      req.user!.role,
    );
    sendSuccess(res, contact);
  } catch (err) {
    next(err);
  }
});

accountContactsRouter.post('/', validateBody(createContactSchema), async (req: AccountContactRequest, res, next) => {
  try {
    const contact = await contactsService.createContact(
      req.params.id,
      req.body,
      req.user!.userId,
      req.user!.role,
    );
    sendCreated(res, contact);
  } catch (err) {
    next(err);
  }
});

accountContactsRouter.put('/:contactId', validateBody(updateContactSchema), async (req: AccountContactRequest, res, next) => {
  try {
    const contact = await contactsService.updateContact(
      req.params.id,
      req.params.contactId,
      req.body,
      req.user!.userId,
      req.user!.role,
    );
    sendSuccess(res, contact);
  } catch (err) {
    next(err);
  }
});

accountContactsRouter.delete('/:contactId', async (req: AccountContactRequest, res, next) => {
  try {
    await contactsService.deleteContact(
      req.params.id,
      req.params.contactId,
      req.user!.userId,
      req.user!.role,
    );
    sendNoContent(res);
  } catch (err) {
    next(err);
  }
});

// Global contacts router for search across all contacts
const contactsRouter = Router();

contactsRouter.use(authenticate);

contactsRouter.get('/', validateQuery(contactQuerySchema), async (req, res, next) => {
  try {
    const result = await contactsService.searchContacts(
      req.query as any,
      req.user!.userId,
      req.user!.role,
    );
    sendSuccess(res, result.data, result.meta);
  } catch (err) {
    next(err);
  }
});

export { accountContactsRouter, contactsRouter };
