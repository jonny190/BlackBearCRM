import { db } from '../../core/database/connection.js';

export async function getIntegrationSettings(provider: string) {
  return db('integration_settings').where({ provider }).first();
}

export async function updateIntegrationSettings(provider: string, data: {
  client_id?: string | null;
  client_secret?: string | null;
  tenant_id?: string | null;
  redirect_uri?: string | null;
  is_enabled?: boolean;
}) {
  const existing = await db('integration_settings').where({ provider }).first();
  if (existing) {
    const [updated] = await db('integration_settings').where({ provider })
      .update({ ...data, updated_at: db.fn.now() }).returning('*');
    return updated;
  }
  const [created] = await db('integration_settings').insert({ provider, ...data }).returning('*');
  return created;
}
