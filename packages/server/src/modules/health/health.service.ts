import { getAccountById } from '../accounts/accounts.queries.js';
import { NotFoundError } from '../../core/helpers/errors.js';
import { calculateEngagementScore, calculateTrend, getHealthColor, calculateMomentumScore, calculateWeightedScore } from './health.calculator.js';
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
import type { Activity, HealthScore, HealthScoreConfig, HealthTrend } from '@blackbear/shared';

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

  // Get previous engagement score (7 days ago) to calculate momentum
  const previousSnapshot = await getScoreFromDaysAgo(accountId, 7);
  const previousEngagement = previousSnapshot?.engagement_score ?? null;
  const momentumScore = calculateMomentumScore(engagementScore, previousEngagement);

  // Try to get sentiment from AI if configured (optional, fail silently)
  let sentimentScore: number | null = null;
  try {
    const { getAiProvider } = await import('../ai/ai.service.js');
    const provider = await getAiProvider();
    if (provider && activities.length > 0) {
      const recentText = activities
        .slice(0, 5)
        .map((a: Activity) => a.title || '')
        .filter(Boolean)
        .join('. ');
      if (recentText) {
        const sentiment = await provider.analyzeSentiment(recentText);
        sentimentScore = sentiment.score;
      }
    }
  } catch {
    // AI not configured or failed -- continue without sentiment
  }

  // Load tier config for weights
  const config = await getConfig(account.tier);
  const weights = config
    ? {
        engagement: config.weight_engagement,
        sentiment: config.weight_sentiment,
        momentum: config.weight_momentum,
      }
    : { engagement: 1, sentiment: 0, momentum: 0 };

  const overallScore = calculateWeightedScore(
    { engagement: engagementScore, sentiment: sentimentScore, momentum: momentumScore },
    weights,
  );

  const scoreData: Omit<HealthScore, 'id'> = {
    account_id: accountId,
    overall_score: overallScore,
    engagement_score: engagementScore,
    sentiment_score: sentimentScore,
    renewal_score: null,
    momentum_score: momentumScore,
    factors: {
      activity_count: activities.length,
      tier: account.tier,
      weights,
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
