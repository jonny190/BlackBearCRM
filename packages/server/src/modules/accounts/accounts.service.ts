import { NotFoundError, ForbiddenError } from '../../core/helpers/errors.js';
import {
  listAccounts as queryListAccounts,
  getAccountById,
  createAccount as queryCreateAccount,
  updateAccount as queryUpdateAccount,
  deleteAccount as queryDeleteAccount,
  type AccountListParams,
} from './accounts.queries.js';
import type { Account } from '@blackpear/shared';

export async function listAccounts(params: AccountListParams, userId: string, role: string) {
  if (role === 'manager') {
    params.ownerFilter = userId;
  }
  return queryListAccounts(params);
}

export async function getAccount(id: string, userId: string, role: string) {
  const account = await getAccountById(id);
  if (!account) throw new NotFoundError('Account', id);

  if (role === 'manager' && account.owner_id !== userId) {
    throw new ForbiddenError('You do not have access to this account');
  }

  return account;
}

export async function createAccount(data: Partial<Account>, userId: string) {
  const accountData = {
    ...data,
    owner_id: data.owner_id ?? userId,
  };
  return queryCreateAccount(accountData);
}

export async function updateAccount(
  id: string,
  data: Partial<Account>,
  userId: string,
  role: string,
) {
  const account = await getAccountById(id);
  if (!account) throw new NotFoundError('Account', id);

  if (role === 'manager' && account.owner_id !== userId) {
    throw new ForbiddenError('You do not have access to this account');
  }

  // Only admin/team_lead can reassign owner
  if (data.owner_id && data.owner_id !== account.owner_id && role === 'manager') {
    throw new ForbiddenError('Only admins and team leads can reassign account ownership');
  }

  return queryUpdateAccount(id, data);
}

export async function deleteAccount(id: string, role: string) {
  if (role !== 'admin') {
    throw new ForbiddenError('Only admins can delete accounts');
  }

  const account = await getAccountById(id);
  if (!account) throw new NotFoundError('Account', id);

  await queryDeleteAccount(id);
}
