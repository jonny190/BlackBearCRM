import { Router, Request } from 'express';
import { createMeetingNoteSchema, updateMeetingNoteSchema, meetingNoteQuerySchema } from '@blackpear/shared';
import { authenticate } from '../../core/middleware/auth.js';
import { validateBody, validateQuery } from '../../core/middleware/validate.js';
import { sendSuccess, sendCreated, sendNoContent } from '../../core/helpers/response.js';
import * as meetingsService from './meetings.service.js';

interface AccountMeetingRequest extends Request {
  params: { id: string };
}

const meetingNotesAccountRouter = Router({ mergeParams: true });
meetingNotesAccountRouter.use(authenticate);

meetingNotesAccountRouter.get('/', validateQuery(meetingNoteQuerySchema), async (req: AccountMeetingRequest, res, next) => {
  try {
    const result = await meetingsService.listMeetingNotes(
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

meetingNotesAccountRouter.post('/', validateBody(createMeetingNoteSchema), async (req: AccountMeetingRequest, res, next) => {
  try {
    const note = await meetingsService.createMeetingNote(
      req.params.id,
      req.body,
      req.user!.userId,
      req.user!.role,
    );
    sendCreated(res, note);
  } catch (err) {
    next(err);
  }
});

const meetingNotesRouter = Router();
meetingNotesRouter.use(authenticate);

meetingNotesRouter.put('/:id', validateBody(updateMeetingNoteSchema), async (req, res, next) => {
  try {
    const note = await meetingsService.updateMeetingNote(
      req.params.id,
      req.body,
      req.user!.userId,
      req.user!.role,
    );
    sendSuccess(res, note);
  } catch (err) {
    next(err);
  }
});

meetingNotesRouter.delete('/:id', async (req, res, next) => {
  try {
    await meetingsService.deleteMeetingNote(req.params.id, req.user!.userId, req.user!.role);
    sendNoContent(res);
  } catch (err) {
    next(err);
  }
});

meetingNotesRouter.post('/:id/process', async (req, res, next) => {
  try {
    const result = await meetingsService.reprocessMeetingNote(req.params.id, req.user!.userId, req.user!.role);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

meetingNotesRouter.get('/:id/insights', async (req, res, next) => {
  try {
    const insights = await meetingsService.getInsights(req.params.id, req.user!.userId, req.user!.role);
    sendSuccess(res, insights);
  } catch (err) {
    next(err);
  }
});

export { meetingNotesAccountRouter, meetingNotesRouter };
