import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('ai_settings', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.string('provider').notNullable().defaultTo('none');
    t.string('api_key');
    t.string('model_id');
    t.string('ollama_url');
    t.string('ollama_model');
    t.boolean('is_enabled').notNullable().defaultTo(false);
    t.timestamps(true, true);
  });

  await knex('ai_settings').insert({
    provider: 'none',
    is_enabled: false,
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('ai_settings');
}
