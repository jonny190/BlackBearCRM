import { db } from '../../core/database/connection.js';
import type { HealthScore, HealthScoreConfig, Activity } from '@blackbear/shared';

// ---------------------------------------------------------------------------
// Health score queries
// ---------------------------------------------------------------------------

export async function getLatestScore(accountId: string): Promise<HealthScore | undefined> {
  return db('account_health_scores')
    .where({ account_id: accountId })
    .orderBy('calculated_at', 'desc')
    .first() as Promise<HealthScore | undefined>;
}

export async function getScoreHistory(accountId: string, limit = 30): Promise<HealthScore[]> {
  const rows = await db('account_health_scores')
    .where({ account_id: accountId })
    .orderBy('calculated_at', 'desc')
    .limit(limit);
  return rows as HealthScore[];
}

export async function getScoreFromDaysAgo(
  accountId: string,
  days: number,
): Promise<HealthScore | undefined> {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return db('account_health_scores')
    .where({ account_id: accountId })
    .where('calculated_at', '<=', cutoff.toISOString())
    .orderBy('calculated_at', 'desc')
    .first() as Promise<HealthScore | undefined>;
}

export async function insertScore(
  data: Omit<HealthScore, 'id'>,
): Promise<HealthScore> {
  const [row] = await db('account_health_scores').insert(data).returning('*');
  return row as HealthScore;
}

// ---------------------------------------------------------------------------
// Health config queries
// ---------------------------------------------------------------------------

export async function getConfig(tier: string): Promise<HealthScoreConfig | undefined> {
  return db('health_score_configs')
    .where({ account_tier: tier })
    .first() as Promise<HealthScoreConfig | undefined>;
}

export async function listConfig(): Promise<HealthScoreConfig[]> {
  const rows = await db('health_score_configs').orderBy('account_tier');
  return rows as HealthScoreConfig[];
}

export async function updateConfig(
  tier: string,
  data: Partial<Omit<HealthScoreConfig, 'id' | 'account_tier'>>,
): Promise<HealthScoreConfig> {
  const [row] = await db('health_score_configs')
    .where({ account_tier: tier })
    .update(data)
    .returning('*');
  return row as HealthScoreConfig;
}

// ---------------------------------------------------------------------------
// Activities for scoring (last 30 days)
// ---------------------------------------------------------------------------

export async function getActivitiesForScoring(accountId: string): Promise<Activity[]> {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const rows = await db('activities')
    .where({ account_id: accountId })
    .where('occurred_at', '>=', cutoff.toISOString())
    .orderBy('occurred_at', 'desc');
  return rows as Activity[];
}
