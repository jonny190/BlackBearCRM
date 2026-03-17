import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('contacts', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('account_id').notNullable().references('id').inTable('accounts').onDelete('CASCADE');
    t.string('first_name').notNullable();
    t.string('last_name').notNullable();
    t.string('email');
    t.string('phone');
    t.string('title').notNullable();
    t.enu('role_level', ['executive', 'director', 'manager', 'individual']).notNullable();
    t.integer('influence_score').notNullable().defaultTo(50);
    t.boolean('is_primary').notNullable().defaultTo(false);
    t.timestamp('last_interaction_at');
    t.jsonb('metadata').defaultTo('{}');
    t.timestamps(true, true);
    t.index('account_id', 'idx_contacts_account_id');
    t.index('email', 'idx_contacts_email');
    t.index('role_level', 'idx_contacts_role_level');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('contacts');
}
