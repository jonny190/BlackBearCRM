import { db } from '../../core/database/connection.js';
import type { Activity } from '@blackbear/shared';

export interface ActivityListParams {
  account_id?: string;
  type?: string;
  ownerFilter?: string; // RBAC: restrict to activities on manager's accounts
  page: number;
  limit: number;
  sort: string;
  order: 'asc' | 'desc';
}

export async function listActivities(params: ActivityListParams) {
  const { account_id, type, ownerFilter, page, limit, sort, order } = params;
  const offset = (page - 1) * limit;

  let query = db('activities').select('activities.*');

  if (ownerFilter) {
    query = query.whereIn(
      'activities.account_id',
      db('accounts').where('owner_id', ownerFilter).select('id'),
    );
  }
  if (account_id) query = query.where('activities.account_id', account_id);
  if (type) query = query.where('activities.type', type);

  const countQuery = query.clone().clearSelect().count('* as count');
  const [{ count }] = await countQuery;
  const total = Number(count);

  const rows = await query.orderBy(`activities.${sort}`, order).limit(limit).offset(offset);

  return {
    data: rows as Activity[],
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getAccountTimeline(accountId: string, limit = 50) {
  const rows = await db('activities')
    .where('account_id', accountId)
    .orderBy('occurred_at', 'desc')
    .limit(limit);
  return rows as Activity[];
}

export async function getActivityById(id: string) {
  return db('activities').where({ id }).first() as Promise<Activity | undefined>;
}

export async function createActivity(data: Partial<Activity> & { account_id: string; user_id: string }) {
  const [activity] = await db('activities').insert(data).returning('*');
  return activity as Activity;
}

export async function updateActivity(id: string, data: Partial<Activity>) {
  const [activity] = await db('activities')
    .where({ id })
    .update({ ...data, updated_at: db.fn.now() })
    .returning('*');
  return activity as Activity;
}

export async function deleteActivity(id: string) {
  return db('activities').where({ id }).delete();
}
