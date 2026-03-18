import { db } from '../../core/database/connection.js';
import type { MeetingNote, ProcessedCustomerNote } from '@blackpear/shared';

export interface MeetingNoteListParams {
  ownerFilter?: string;
  page: number;
  limit: number;
  sort: string;
  order: 'asc' | 'desc';
}

export async function listMeetingNotes(accountId: string, params: MeetingNoteListParams) {
  const { ownerFilter, page, limit, sort, order } = params;
  const offset = (page - 1) * limit;

  let query = db('meeting_notes').where('meeting_notes.account_id', accountId);

  if (ownerFilter) {
    query = query.whereIn(
      'meeting_notes.account_id',
      db('accounts').where('owner_id', ownerFilter).select('id'),
    );
  }

  const countQuery = query.clone().count('* as count');
  const [{ count }] = await countQuery;
  const total = Number(count);

  const rows = await query
    .select('meeting_notes.*')
    .orderBy(`meeting_notes.${sort}`, order)
    .limit(limit)
    .offset(offset);

  return {
    data: rows as MeetingNote[],
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getMeetingNoteById(id: string) {
  return db('meeting_notes').where({ id }).first() as Promise<MeetingNote | undefined>;
}

export async function createMeetingNote(data: Partial<MeetingNote> & { account_id: string; user_id: string }) {
  const [note] = await db('meeting_notes')
    .insert({
      ...data,
      participants: JSON.stringify(data.participants ?? []),
    })
    .returning('*');
  return note as MeetingNote;
}

export async function updateMeetingNote(id: string, data: Partial<MeetingNote>) {
  const updateData: Record<string, unknown> = { ...data, updated_at: db.fn.now() };
  if (data.participants) {
    updateData.participants = JSON.stringify(data.participants);
  }
  const [note] = await db('meeting_notes')
    .where({ id })
    .update(updateData)
    .returning('*');
  return note as MeetingNote;
}

export async function deleteMeetingNote(id: string) {
  return db('meeting_notes').where({ id }).delete();
}

export async function getProcessedNotes(meetingNoteId: string) {
  return db('processed_customer_notes')
    .where({ meeting_note_id: meetingNoteId })
    .orderBy('note_type')
    .select('*') as Promise<ProcessedCustomerNote[]>;
}

export async function insertProcessedNotes(notes: Array<Omit<ProcessedCustomerNote, 'id' | 'created_at'>>) {
  return db('processed_customer_notes').insert(notes).returning('*') as Promise<ProcessedCustomerNote[]>;
}

export async function deleteProcessedNotes(meetingNoteId: string) {
  return db('processed_customer_notes').where({ meeting_note_id: meetingNoteId }).delete();
}
