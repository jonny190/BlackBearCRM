import { db } from '../../core/database/connection.js';
import type { Contact } from '@blackbear/shared';

export interface ContactListParams {
  q?: string;
  ownerFilter?: string; // RBAC: restrict to contacts belonging to manager's accounts
  page: number;
  limit: number;
  sort: string;
  order: 'asc' | 'desc';
}

export async function listContactsByAccount(accountId: string, params: ContactListParams) {
  const { q, page, limit, sort, order } = params;
  const offset = (page - 1) * limit;

  let query = db('contacts').select('contacts.*').where('contacts.account_id', accountId);

  if (q) {
    query = query.where((builder) => {
      builder
        .whereILike('contacts.first_name', `%${q}%`)
        .orWhereILike('contacts.last_name', `%${q}%`)
        .orWhereILike('contacts.email', `%${q}%`);
    });
  }

  const countQuery = query.clone().clearSelect().count('* as count');
  const [{ count }] = await countQuery;
  const total = Number(count);

  const rows = await query.orderBy(`contacts.${sort}`, order).limit(limit).offset(offset);

  return {
    data: rows as Contact[],
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function searchContacts(params: ContactListParams) {
  const { q, ownerFilter, page, limit, sort, order } = params;
  const offset = (page - 1) * limit;

  let query = db('contacts').select('contacts.*');

  if (ownerFilter) {
    query = query.whereIn(
      'contacts.account_id',
      db('accounts').where('owner_id', ownerFilter).select('id'),
    );
  }

  if (q) {
    query = query.where((builder) => {
      builder
        .whereILike('contacts.first_name', `%${q}%`)
        .orWhereILike('contacts.last_name', `%${q}%`)
        .orWhereILike('contacts.email', `%${q}%`);
    });
  }

  const countQuery = query.clone().clearSelect().count('* as count');
  const [{ count }] = await countQuery;
  const total = Number(count);

  const rows = await query.orderBy(`contacts.${sort}`, order).limit(limit).offset(offset);

  return {
    data: rows as Contact[],
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getContactById(id: string) {
  return db('contacts').where({ id }).first() as Promise<Contact | undefined>;
}

export async function createContact(data: Partial<Contact> & { account_id: string }) {
  const [contact] = await db('contacts').insert(data).returning('*');
  return contact as Contact;
}

export async function updateContact(id: string, data: Partial<Contact>) {
  const [contact] = await db('contacts')
    .where({ id })
    .update({ ...data, updated_at: db.fn.now() })
    .returning('*');
  return contact as Contact;
}

export async function deleteContact(id: string) {
  return db('contacts').where({ id }).delete();
}
