import { parse } from 'csv-parse/sync';
import { createAccountSchema, createContactSchema } from '@blackbear/shared';
import { db } from '../../core/database/connection.js';
import { logger } from '../../core/logger.js';

interface ImportResult {
  total: number;
  valid: number;
  invalid: number;
  errors: Array<{ row: number; errors: Record<string, string[]> }>;
  imported: number;
}

export async function validateAccounts(csvBuffer: Buffer, userId: string) {
  const records = parse(csvBuffer, { columns: true, skip_empty_lines: true, trim: true });
  const validRows: any[] = [];
  const errors: ImportResult['errors'] = [];

  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    let owner_id = userId;
    if (row.owner_email) {
      const owner = await db('users').where({ email: row.owner_email, is_active: true }).first();
      if (owner) owner_id = owner.id;
    }
    const result = createAccountSchema.safeParse({
      name: row.name, industry: row.industry, tier: row.tier,
      website: row.website || null, status: row.status || 'active', owner_id,
    });
    if (result.success) {
      validRows.push(result.data);
    } else {
      errors.push({ row: i + 2, errors: result.error.flatten().fieldErrors as any });
    }
  }
  return { total: records.length, valid: validRows.length, invalid: errors.length, errors, validRows };
}

export async function confirmAccountImport(validRows: any[], userId: string) {
  let imported = 0;
  if (validRows.length > 0) {
    await db.transaction(async (trx) => {
      await trx('accounts').insert(validRows);
      imported = validRows.length;
    });
  }
  logger.info({ imported }, 'Account import confirmed');
  return { imported };
}

export async function validateContacts(csvBuffer: Buffer, userId: string) {
  const records = parse(csvBuffer, { columns: true, skip_empty_lines: true, trim: true });
  const validRows: any[] = [];
  const errors: ImportResult['errors'] = [];

  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    const account = await db('accounts').whereILike('name', row.account_name).first();
    if (!account) {
      errors.push({ row: i + 2, errors: { account_name: [`Account "${row.account_name}" not found`] } });
      continue;
    }
    const result = createContactSchema.safeParse({
      first_name: row.first_name, last_name: row.last_name,
      email: row.email || null, phone: row.phone || null,
      title: row.title, role_level: row.role_level,
      is_primary: row.is_primary === 'true',
    });
    if (result.success) {
      validRows.push({ ...result.data, account_id: account.id });
    } else {
      errors.push({ row: i + 2, errors: result.error.flatten().fieldErrors as any });
    }
  }
  return { total: records.length, valid: validRows.length, invalid: errors.length, errors, validRows };
}

export async function confirmContactImport(validRows: any[]) {
  let imported = 0;
  if (validRows.length > 0) {
    await db.transaction(async (trx) => {
      await trx('contacts').insert(validRows);
      imported = validRows.length;
    });
  }
  logger.info({ imported }, 'Contact import confirmed');
  return { imported };
}

export function getAccountTemplate(): string {
  return 'name,industry,tier,website,status,owner_email\n';
}

export function getContactTemplate(): string {
  return 'account_name,first_name,last_name,email,phone,title,role_level,is_primary\n';
}
