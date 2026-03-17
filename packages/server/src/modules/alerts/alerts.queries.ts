import { db } from '../../core/database/connection.js';
import type { Alert } from '@blackbear/shared';

export async function listAlertsByUser(userId: string): Promise<Alert[]> {
  const rows = await db('alerts')
    .where({ user_id: userId, is_dismissed: false })
    .orderBy('created_at', 'desc');
  return rows as Alert[];
}

export async function findActiveAlert(
  accountId: string,
  type: string,
): Promise<Alert | undefined> {
  return db('alerts')
    .where({ account_id: accountId, type, is_dismissed: false })
    .first() as Promise<Alert | undefined>;
}

export async function insertAlert(
  data: Omit<Alert, 'id' | 'created_at'>,
): Promise<Alert> {
  const [row] = await db('alerts').insert(data).returning('*');
  return row as Alert;
}

export async function markRead(id: string): Promise<Alert> {
  const [row] = await db('alerts')
    .where({ id })
    .update({ is_read: true })
    .returning('*');
  return row as Alert;
}

export async function markDismissed(id: string): Promise<Alert> {
  const [row] = await db('alerts')
    .where({ id })
    .update({ is_dismissed: true })
    .returning('*');
  return row as Alert;
}

export async function getUnreadCount(userId: string): Promise<number> {
  const [{ count }] = await db('alerts')
    .where({ user_id: userId, is_read: false, is_dismissed: false })
    .count('* as count');
  return Number(count);
}
