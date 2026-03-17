import { db } from '../../core/database/connection.js';

export async function getAiSettings() {
  return db('ai_settings').first();
}

export async function updateAiSettings(data: {
  provider: string;
  api_key?: string | null;
  model_id?: string | null;
  ollama_url?: string | null;
  ollama_model?: string | null;
  is_enabled: boolean;
}) {
  const settings = await db('ai_settings').first();
  if (settings) {
    const [updated] = await db('ai_settings').where({ id: settings.id }).update({ ...data, updated_at: db.fn.now() }).returning('*');
    return updated;
  }
  const [created] = await db('ai_settings').insert(data).returning('*');
  return created;
}
