import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('health_scores', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('account_id').notNullable().references('id').inTable('accounts').onDelete('CASCADE');
    t.integer('overall_score').notNullable();
    t.integer('engagement_score').notNullable();
    t.integer('sentiment_score');
    t.integer('renewal_score');
    t.integer('momentum_score');
    t.jsonb('factors').defaultTo('{}');
    t.timestamp('calculated_at').notNullable().defaultTo(knex.fn.now());
    t.index(['account_id', 'calculated_at'], 'idx_health_scores_account_calculated');
  });

  await knex.schema.createTable('health_score_config', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.enu('account_tier', ['enterprise', 'mid_market', 'smb']).notNullable().unique();
    t.decimal('weight_engagement', 5, 2).notNullable().defaultTo(1.0);
    t.decimal('weight_sentiment', 5, 2).notNullable().defaultTo(0.0);
    t.decimal('weight_renewal', 5, 2).notNullable().defaultTo(0.0);
    t.decimal('weight_momentum', 5, 2).notNullable().defaultTo(0.0);
    t.integer('alert_threshold').notNullable().defaultTo(40);
    t.timestamps(true, true);
  });

  await knex('health_score_config').insert([
    { account_tier: 'enterprise', weight_engagement: 1.0, alert_threshold: 50 },
    { account_tier: 'mid_market', weight_engagement: 1.0, alert_threshold: 40 },
    { account_tier: 'smb', weight_engagement: 1.0, alert_threshold: 30 },
  ]);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('health_score_config');
  await knex.schema.dropTableIfExists('health_scores');
}
