import { getAccountById } from '../accounts/accounts.queries.js';
import { NotFoundError } from '../../core/helpers/errors.js';
import { calculateEngagementScore, calculateTrend, getHealthColor } from './health.calculator.js';
import {
  getLatestScore,
  getScoreHistory,
  getScoreFromDaysAgo,
  insertScore,
  getConfig,
  listConfig,
  updateConfig,
  getActivitiesForScoring,
} from './health.queries.js';
import type { HealthScore, HealthScoreConfig, HealthTrend } from '@blackbear/shared';

export interface AccountHealthResult {
  score: HealthScore | null;
  trend: HealthTrend;
  color: 'green' | 'yellow' | 'orange' | 'red';
}

// ---------------------------------------------------------------------------
// Core scoring
// ---------------------------------------------------------------------------

export async function calculateAndStoreHealth(accountId: string): Promise<HealthScore> {
  const account = await getAccountById(accountId);
  if (!account) throw new NotFoundError('Account', accountId);

  const activities = await getActivitiesForScoring(accountId);
  const now = new Date();

  const engagementScore = calculateEngagementScore(activities, account.tier, now);

  const scoreData: Omit<HealthScore, 'id'> = {
    account_id: accountId,
    overall_score: engagementScore,
    engagement_score: engagementScore,
    sentiment_score: null,
    renewal_score: null,
    momentum_score: null,
    factors: {
      activity_count: activities.length,
      tier: account.tier,
    },
    calculated_at: now.toISOString(),
  };

  return insertScore(scoreData);
}

// ---------------------------------------------------------------------------
// Read endpoints
// ---------------------------------------------------------------------------

export async function getAccountHealth(accountId: string): Promise<AccountHealthResult> {
  const account = await getAccountById(accountId);
  if (!account) throw new NotFoundError('Account', accountId);

  const latest = await getLatestScore(accountId);
  const previous = await getScoreFromDaysAgo(accountId, 7);

  const currentScore = latest?.overall_score ?? 0;
  const previousScore = previous?.overall_score ?? currentScore;

  return {
    score: latest ?? null,
    trend: calculateTrend(currentScore, previousScore),
    color: getHealthColor(currentScore),
  };
}

export async function getHealthHistory(
  accountId: string,
  limit?: number,
): Promise<HealthScore[]> {
  const account = await getAccountById(accountId);
  if (!account) throw new NotFoundError('Account', accountId);

  return getScoreHistory(accountId, limit);
}

// ---------------------------------------------------------------------------
// Config endpoints
// ---------------------------------------------------------------------------

export async function getHealthConfig(): Promise<HealthScoreConfig[]> {
  return listConfig();
}

export async function updateHealthConfig(
  tier: string,
  data: Partial<Omit<HealthScoreConfig, 'id' | 'account_tier'>>,
): Promise<HealthScoreConfig> {
  const existing = await getConfig(tier);
  if (!existing) throw new NotFoundError('HealthScoreConfig', tier);

  return updateConfig(tier, data);
}
