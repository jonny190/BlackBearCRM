import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('accounts', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.string('name').notNullable();
    t.string('industry').notNullable();
    t.enu('tier', ['enterprise', 'mid_market', 'smb']).notNullable();
    t.string('website');
    t.enu('status', ['active', 'inactive', 'churned', 'prospect']).notNullable().defaultTo('active');
    t.uuid('owner_id').notNullable().references('id').inTable('users');
    t.jsonb('metadata').defaultTo('{}');
    t.timestamps(true, true);
    t.index('owner_id', 'idx_accounts_owner_id');
    t.index('status', 'idx_accounts_status');
    t.index('tier', 'idx_accounts_tier');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('accounts');
}
