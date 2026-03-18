import { NotFoundError, ForbiddenError } from '../../core/helpers/errors.js';
import { getAccountById } from '../accounts/accounts.queries.js';
import { meetingsQueue } from '../../core/queue/health-queue.js';
import { publishSocketEvent } from '../../core/websocket/socket.js';
import {
  listMeetingNotes as queryListMeetingNotes,
  getMeetingNoteById,
  createMeetingNote as queryCreateMeetingNote,
  updateMeetingNote as queryUpdateMeetingNote,
  deleteMeetingNote as queryDeleteMeetingNote,
  getProcessedNotes as queryGetProcessedNotes,
  deleteProcessedNotes,
  type MeetingNoteListParams,
} from './meetings.queries.js';
import type { MeetingNote } from '@blackpear/shared';

async function checkAccountAccess(accountId: string, userId: string, role: string) {
  const account = await getAccountById(accountId);
  if (!account) throw new NotFoundError('Account', accountId);

  if (role === 'manager' && account.owner_id !== userId) {
    throw new ForbiddenError('You do not have access to this account');
  }

  return account;
}

export async function listMeetingNotes(
  accountId: string,
  params: MeetingNoteListParams,
  userId: string,
  role: string,
) {
  await checkAccountAccess(accountId, userId, role);

  if (role === 'manager') {
    params.ownerFilter = userId;
  }

  return queryListMeetingNotes(accountId, params);
}

export async function createMeetingNote(
  accountId: string,
  data: Partial<MeetingNote>,
  userId: string,
  role: string,
) {
  await checkAccountAccess(accountId, userId, role);

  const note = await queryCreateMeetingNote({
    ...data,
    account_id: accountId,
    user_id: userId,
    status: 'processing',
  });

  await meetingsQueue.add('processMeetingNote', { meetingNoteId: note.id }, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
  });

  await publishSocketEvent('meeting-note:created', { accountId, meetingNote: note });

  return note;
}

export async function updateMeetingNote(
  id: string,
  data: Partial<MeetingNote>,
  userId: string,
  role: string,
) {
  const note = await getMeetingNoteById(id);
  if (!note) throw new NotFoundError('MeetingNote', id);

  if (role === 'manager') {
    await checkAccountAccess(note.account_id, userId, role);
    if (note.user_id !== userId) {
      throw new ForbiddenError('You can only edit your own meeting notes');
    }
  }

  const notesChanged = data.raw_notes && data.raw_notes !== note.raw_notes;

  const updateData: Partial<MeetingNote> = { ...data };
  if (notesChanged) {
    updateData.status = 'processing';
    updateData.processed_at = null;
  }

  const updated = await queryUpdateMeetingNote(id, updateData);

  if (notesChanged) {
    await deleteProcessedNotes(id);
    await meetingsQueue.add('processMeetingNote', { meetingNoteId: id }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
    });
  }

  await publishSocketEvent('meeting-note:updated', { accountId: note.account_id, meetingNote: updated });

  return updated;
}

export async function deleteMeetingNote(id: string, userId: string, role: string) {
  const note = await getMeetingNoteById(id);
  if (!note) throw new NotFoundError('MeetingNote', id);

  if (role !== 'admin') {
    if (note.user_id !== userId) {
      throw new ForbiddenError('You can only delete your own meeting notes');
    }
    if (role === 'manager') {
      await checkAccountAccess(note.account_id, userId, role);
    }
  }

  await queryDeleteMeetingNote(id);
}

export async function reprocessMeetingNote(id: string, userId: string, role: string) {
  const note = await getMeetingNoteById(id);
  if (!note) throw new NotFoundError('MeetingNote', id);

  await checkAccountAccess(note.account_id, userId, role);

  await deleteProcessedNotes(id);
  await queryUpdateMeetingNote(id, { status: 'processing', processed_at: null });

  await meetingsQueue.add('processMeetingNote', { meetingNoteId: id }, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
  });

  return { message: 'Processing queued' };
}

export async function getInsights(id: string, userId: string, role: string) {
  const note = await getMeetingNoteById(id);
  if (!note) throw new NotFoundError('MeetingNote', id);

  await checkAccountAccess(note.account_id, userId, role);

  return queryGetProcessedNotes(id);
}
