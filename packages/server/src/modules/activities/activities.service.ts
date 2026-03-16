import { db } from '../../core/database/connection.js';
import { NotFoundError, ForbiddenError } from '../../core/helpers/errors.js';
import { getAccountById } from '../accounts/accounts.queries.js';
import {
  listActivities as queryListActivities,
  getAccountTimeline,
  getActivityById,
  createActivity as queryCreateActivity,
  updateActivity as queryUpdateActivity,
  deleteActivity as queryDeleteActivity,
  type ActivityListParams,
} from './activities.queries.js';
import type { Activity } from '@blackbear/shared';

async function checkAccountAccess(accountId: string, userId: string, role: string) {
  const account = await getAccountById(accountId);
  if (!account) throw new NotFoundError('Account', accountId);

  if (role === 'manager' && account.owner_id !== userId) {
    throw new ForbiddenError('You do not have access to this account');
  }

  return account;
}

export async function listActivities(params: ActivityListParams, userId: string, role: string) {
  if (role === 'manager') {
    params.ownerFilter = userId;
  }
  return queryListActivities(params);
}

export async function getTimeline(accountId: string, userId: string, role: string, limit?: number) {
  await checkAccountAccess(accountId, userId, role);
  return getAccountTimeline(accountId, limit);
}

export async function createActivity(
  data: Partial<Activity> & { account_id: string },
  userId: string,
  role: string,
) {
  await checkAccountAccess(data.account_id, userId, role);

  const activityData = {
    ...data,
    user_id: userId,
  };

  const activity = await queryCreateActivity(activityData as Activity & { account_id: string; user_id: string });

  // Update contact's last_interaction_at if contact_id is provided
  if (activity.contact_id) {
    await db('contacts').where({ id: activity.contact_id }).update({
      last_interaction_at: activity.occurred_at,
      updated_at: db.fn.now(),
    });
  }

  // TODO: publish health recalculation job via healthQueue (Task 13)
  // TODO: publishSocketEvent('activity:created', { accountId: activity.account_id, activity }) (Task 13)

  return activity;
}

export async function updateActivity(
  id: string,
  data: Partial<Activity>,
  userId: string,
  role: string,
) {
  const activity = await getActivityById(id);
  if (!activity) throw new NotFoundError('Activity', id);

  // Managers can only edit activities on their own accounts
  if (role === 'manager') {
    await checkAccountAccess(activity.account_id, userId, role);
  }

  // Managers can only edit their own activities
  if (role === 'manager' && activity.user_id !== userId) {
    throw new ForbiddenError('You can only edit your own activities');
  }

  return queryUpdateActivity(id, data);
}

export async function deleteActivity(id: string, userId: string, role: string) {
  const activity = await getActivityById(id);
  if (!activity) throw new NotFoundError('Activity', id);

  if (role !== 'admin') {
    // Managers and team leads can only delete their own activities
    if (activity.user_id !== userId) {
      throw new ForbiddenError('You can only delete your own activities');
    }

    // Managers also need account access
    if (role === 'manager') {
      await checkAccountAccess(activity.account_id, userId, role);
    }
  }

  await queryDeleteActivity(id);
}
