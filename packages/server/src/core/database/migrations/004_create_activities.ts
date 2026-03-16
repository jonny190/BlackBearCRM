import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('activities', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('account_id').notNullable().references('id').inTable('accounts').onDelete('CASCADE');
    t.uuid('contact_id').references('id').inTable('contacts').onDelete('SET NULL');
    t.uuid('user_id').notNullable().references('id').inTable('users');
    t.enu('type', ['meeting', 'email', 'call', 'note', 'proposal', 'follow_up']).notNullable();
    t.string('title').notNullable();
    t.text('description');
    t.timestamp('occurred_at').notNullable();
    t.jsonb('metadata').defaultTo('{}');
    t.timestamps(true, true);
    t.index('account_id', 'idx_activities_account_id');
    t.index('occurred_at', 'idx_activities_occurred_at');
    t.index('type', 'idx_activities_type');
    t.index('user_id', 'idx_activities_user_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('activities');
}
