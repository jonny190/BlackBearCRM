import { db } from '../../core/database/connection.js';

export async function getHealthDistribution() {
  const scores = await db('health_scores')
    .distinctOn('account_id')
    .orderBy('account_id')
    .orderBy('calculated_at', 'desc')
    .select('overall_score');

  const buckets = { healthy: 0, needsAttention: 0, atRisk: 0, critical: 0, noData: 0 };
  const totalAccounts = await db('accounts').where({ status: 'active' }).count('id as count').first();
  const scoredAccounts = scores.length;
  buckets.noData = Number(totalAccounts?.count ?? 0) - scoredAccounts;

  for (const s of scores) {
    if (s.overall_score >= 80) buckets.healthy++;
    else if (s.overall_score >= 60) buckets.needsAttention++;
    else if (s.overall_score >= 40) buckets.atRisk++;
    else buckets.critical++;
  }
  return buckets;
}

export async function getActivityTrends(days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const activities = await db('activities')
    .where('occurred_at', '>=', since)
    .select(db.raw("date_trunc('day', occurred_at) as day"), 'type')
    .count('id as count')
    .groupByRaw("date_trunc('day', occurred_at), type")
    .orderBy('day');
  return activities;
}

export async function getTierBreakdown() {
  const tiers = await db('accounts')
    .select('tier')
    .count('id as count')
    .groupBy('tier');
  return tiers;
}

export async function getTopAccountsByHealth(limit = 10) {
  const scores = await db('health_scores')
    .distinctOn('account_id')
    .orderBy('account_id')
    .orderBy('calculated_at', 'desc')
    .join('accounts', 'health_scores.account_id', 'accounts.id')
    .select('accounts.name', 'accounts.tier', 'accounts.industry', 'health_scores.overall_score', 'health_scores.account_id')
    .orderBy('health_scores.overall_score', 'asc')
    .limit(limit);
  return scores;
}

export async function getEngagementByTier() {
  const results = await db('accounts')
    .leftJoin(
      db('health_scores')
        .distinctOn('account_id')
        .orderBy('account_id')
        .orderBy('calculated_at', 'desc')
        .as('hs'),
      'accounts.id', 'hs.account_id'
    )
    .select('accounts.tier')
    .avg('hs.overall_score as avg_score')
    .count('accounts.id as count')
    .groupBy('accounts.tier');
  return results;
}
