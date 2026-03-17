import { db } from '../../core/database/connection.js';
import type { Account } from '@blackbear/shared';

export interface AccountListParams {
  q?: string;
  industry?: string;
  tier?: string;
  status?: string;
  owner_id?: string;
  ownerFilter?: string; // RBAC: restrict to specific owner
  page: number;
  limit: number;
  sort: string;
  order: 'asc' | 'desc';
}

export async function listAccounts(params: AccountListParams) {
  const { q, industry, tier, status, owner_id, ownerFilter, page, limit, sort, order } = params;
  const offset = (page - 1) * limit;

  let query = db('accounts').select('accounts.*');

  if (ownerFilter) {
    query = query.where('accounts.owner_id', ownerFilter);
  }
  if (q) {
    query = query.where((builder) => {
      builder.whereILike('accounts.name', `%${q}%`).orWhereILike('accounts.industry', `%${q}%`);
    });
  }
  if (industry) query = query.where('accounts.industry', industry);
  if (tier) query = query.where('accounts.tier', tier);
  if (status) query = query.where('accounts.status', status);
  if (owner_id) query = query.where('accounts.owner_id', owner_id);

  const countQuery = query.clone().clearSelect().count('* as count');
  const [{ count }] = await countQuery;
  const total = Number(count);

  const rows = await query.orderBy(`accounts.${sort}`, order).limit(limit).offset(offset);

  return {
    data: rows as Account[],
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getAccountById(id: string) {
  return db('accounts').where({ id }).first() as Promise<Account | undefined>;
}

export async function createAccount(data: Partial<Account>) {
  const [account] = await db('accounts').insert(data).returning('*');
  return account as Account;
}

export async function updateAccount(id: string, data: Partial<Account>) {
  const [account] = await db('accounts')
    .where({ id })
    .update({ ...data, updated_at: db.fn.now() })
    .returning('*');
  return account as Account;
}

export async function deleteAccount(id: string) {
  return db('accounts').where({ id }).delete();
}
