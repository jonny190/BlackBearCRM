import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('meeting_notes', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('account_id').notNullable().references('id').inTable('accounts').onDelete('CASCADE');
    t.uuid('contact_id').references('id').inTable('contacts').onDelete('SET NULL');
    t.uuid('user_id').notNullable().references('id').inTable('users');
    t.string('title').notNullable();
    t.text('raw_notes').notNullable();
    t.timestamp('meeting_date').notNullable();
    t.jsonb('participants').defaultTo('[]');
    t.string('status', 20).notNullable().defaultTo('processing');
    t.timestamp('processed_at');
    t.timestamps(true, true);

    t.index('account_id', 'idx_meeting_notes_account_id');
    t.index('meeting_date', 'idx_meeting_notes_meeting_date');
    t.index('user_id', 'idx_meeting_notes_user_id');
  });

  await knex.schema.createTable('processed_customer_notes', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('meeting_note_id').notNullable().references('id').inTable('meeting_notes').onDelete('CASCADE');
    t.uuid('account_id').notNullable().references('id').inTable('accounts').onDelete('CASCADE');
    t.string('note_type', 50).notNullable();
    t.text('content').notNullable();
    t.float('confidence_score').notNullable();
    t.timestamp('created_at').defaultTo(knex.fn.now());

    t.index('meeting_note_id', 'idx_processed_notes_meeting_note_id');
    t.index('account_id', 'idx_processed_notes_account_id');
    t.index('note_type', 'idx_processed_notes_type');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('processed_customer_notes');
  await knex.schema.dropTableIfExists('meeting_notes');
}
