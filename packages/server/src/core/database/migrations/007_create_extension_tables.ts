import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('ai_briefings', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('account_id').notNullable().references('id').inTable('accounts').onDelete('CASCADE');
    t.enu('type', ['onboarding_90day', 'pre_meeting', 'relationship_gap']).notNullable();
    t.text('content').notNullable();
    t.string('model_provider').notNullable();
    t.string('model_id').notNullable();
    t.timestamp('generated_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('expires_at');
  });

  await knex.schema.createTable('integration_connections', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.enu('provider', ['microsoft_365']).notNullable();
    t.text('access_token_encrypted').notNullable();
    t.text('refresh_token_encrypted').notNullable();
    t.specificType('scopes', 'text[]');
    t.timestamp('connected_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('expires_at');
  });

  await knex.schema.createTable('relationship_maps', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('account_id').notNullable().references('id').inTable('accounts').onDelete('CASCADE');
    t.uuid('contact_id').notNullable().references('id').inTable('contacts').onDelete('CASCADE');
    t.uuid('related_contact_id').notNullable().references('id').inTable('contacts').onDelete('CASCADE');
    t.string('relationship_type');
    t.integer('strength').defaultTo(50);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('relationship_maps');
  await knex.schema.dropTableIfExists('integration_connections');
  await knex.schema.dropTableIfExists('ai_briefings');
}
