import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('alerts', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('account_id').notNullable().references('id').inTable('accounts').onDelete('CASCADE');
    t.uuid('user_id').notNullable().references('id').inTable('users');
    t.enu('type', ['health_drop', 'activity_gap', 'single_contact', 'follow_up_due']).notNullable();
    t.enu('severity', ['low', 'medium', 'high', 'critical']).notNullable();
    t.string('title').notNullable();
    t.text('message');
    t.boolean('is_read').notNullable().defaultTo(false);
    t.boolean('is_dismissed').notNullable().defaultTo(false);
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.index(['user_id', 'is_read'], 'idx_alerts_user_is_read');
    t.index('account_id', 'idx_alerts_account_id');
  });

  await knex.schema.createTable('notification_preferences', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.enu('alert_type', ['health_drop', 'activity_gap', 'single_contact', 'follow_up_due']).notNullable();
    t.enu('channel', ['in_app', 'email']).notNullable();
    t.boolean('is_enabled').notNullable().defaultTo(true);
    t.unique(['user_id', 'alert_type', 'channel']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('notification_preferences');
  await knex.schema.dropTableIfExists('alerts');
}
