import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('integration_settings', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.string('provider').notNullable().unique();
    t.string('client_id');
    t.string('client_secret');
    t.string('tenant_id');
    t.string('redirect_uri');
    t.boolean('is_enabled').notNullable().defaultTo(false);
    t.timestamps(true, true);
  });

  await knex('integration_settings').insert({
    provider: 'microsoft_365',
    is_enabled: false,
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('integration_settings');
}
