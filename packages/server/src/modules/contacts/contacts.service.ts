import { NotFoundError, ForbiddenError } from '../../core/helpers/errors.js';
import { getAccountById } from '../accounts/accounts.queries.js';
import {
  listContactsByAccount,
  searchContacts as querySearchContacts,
  getContactById,
  createContact as queryCreateContact,
  updateContact as queryUpdateContact,
  deleteContact as queryDeleteContact,
  type ContactListParams,
} from './contacts.queries.js';
import type { Contact } from '@blackbear/shared';

async function checkAccountAccess(accountId: string, userId: string, role: string) {
  const account = await getAccountById(accountId);
  if (!account) throw new NotFoundError('Account', accountId);

  if (role === 'manager' && account.owner_id !== userId) {
    throw new ForbiddenError('You do not have access to this account');
  }

  return account;
}

export async function listContacts(
  accountId: string,
  params: ContactListParams,
  userId: string,
  role: string,
) {
  await checkAccountAccess(accountId, userId, role);
  return listContactsByAccount(accountId, params);
}

export async function searchContacts(
  params: ContactListParams,
  userId: string,
  role: string,
) {
  if (role === 'manager') {
    params.ownerFilter = userId;
  }
  return querySearchContacts(params);
}

export async function getContact(
  accountId: string,
  contactId: string,
  userId: string,
  role: string,
) {
  await checkAccountAccess(accountId, userId, role);

  const contact = await getContactById(contactId);
  if (!contact) throw new NotFoundError('Contact', contactId);
  if (contact.account_id !== accountId) throw new NotFoundError('Contact', contactId);

  return contact;
}

export async function createContact(
  accountId: string,
  data: Partial<Contact>,
  userId: string,
  role: string,
) {
  await checkAccountAccess(accountId, userId, role);
  return queryCreateContact({ ...data, account_id: accountId });
}

export async function updateContact(
  accountId: string,
  contactId: string,
  data: Partial<Contact>,
  userId: string,
  role: string,
) {
  await checkAccountAccess(accountId, userId, role);

  const contact = await getContactById(contactId);
  if (!contact) throw new NotFoundError('Contact', contactId);
  if (contact.account_id !== accountId) throw new NotFoundError('Contact', contactId);

  return queryUpdateContact(contactId, data);
}

export async function deleteContact(
  accountId: string,
  contactId: string,
  userId: string,
  role: string,
) {
  await checkAccountAccess(accountId, userId, role);

  const contact = await getContactById(contactId);
  if (!contact) throw new NotFoundError('Contact', contactId);
  if (contact.account_id !== accountId) throw new NotFoundError('Contact', contactId);

  await queryDeleteContact(contactId);
}
