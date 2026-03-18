import {
  ACTIVITY_POINTS,
  TIER_TARGET_POINTS,
  RECENCY_DECAY,
} from '@blackpear/shared';
import type { Activity, HealthTrend } from '@blackpear/shared';

/**
 * Calculate an engagement score for an account based on recent activity.
 *
 * Steps:
 * 1. For each activity, find the applicable recency decay multiplier based on
 *    how many days ago it occurred relative to `now`.
 * 2. Multiply the base activity points by that multiplier.
 * 3. Sum all weighted points.
 * 4. Divide by the tier's target points and multiply by 100 to normalise.
 * 5. Cap at 100.
 *
 * Activities older than 30 days contribute 0 points.
 */
export function calculateEngagementScore(
  activities: Activity[],
  tier: string,
  now: Date = new Date(),
): number {
  const targetPoints = TIER_TARGET_POINTS[tier] ?? TIER_TARGET_POINTS['smb'];

  let totalPoints = 0;

  for (const activity of activities) {
    const occurredAt = new Date(activity.occurred_at);
    const diffMs = now.getTime() - occurredAt.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    const basePoints = ACTIVITY_POINTS[activity.type] ?? 0;

    // Find the first bucket whose maxDays covers this activity
    const bucket = RECENCY_DECAY.find((b) => diffDays <= b.maxDays);
    if (!bucket) {
      // Older than 30 days -- no points
      continue;
    }

    totalPoints += basePoints * bucket.multiplier;
  }

  const score = (totalPoints / targetPoints) * 100;
  return Math.min(100, Math.round(score * 100) / 100);
}

/**
 * Determine the trend direction comparing a current score to a previous one.
 * Returns 'up' if the difference is >= 5, 'down' if <= -5, otherwise 'flat'.
 */
export function calculateTrend(current: number, previous: number): HealthTrend {
  const diff = current - previous;
  if (diff >= 5) return 'up';
  if (diff <= -5) return 'down';
  return 'flat';
}

/**
 * Map a numeric score to a colour band.
 * green: 80+, yellow: 60+, orange: 40+, red: below 40
 */
export function getHealthColor(score: number): 'green' | 'yellow' | 'orange' | 'red' {
  if (score >= 80) return 'green';
  if (score >= 60) return 'yellow';
  if (score >= 40) return 'orange';
  return 'red';
}

/**
 * Calculate a momentum score by comparing current engagement to a previous
 * snapshot. The difference is mapped from the range [-30, +30] onto [0, 100].
 * Returns 50 (neutral) when there is no previous data.
 */
export function calculateMomentumScore(currentEngagement: number, previousEngagement: number | null): number {
  if (previousEngagement === null) return 50;
  const diff = currentEngagement - previousEngagement;
  // Map -30..+30 diff to 0..100 scale
  const normalized = Math.round(((diff + 30) / 60) * 100);
  return Math.max(0, Math.min(100, normalized));
}

/**
 * Combine sub-scores into a single weighted overall score.
 * Sub-scores with a null value or zero weight are excluded from the
 * calculation so they do not drag the result down.
 */
export function calculateWeightedScore(
  scores: { engagement: number; sentiment: number | null; momentum: number | null },
  weights: { engagement: number; sentiment: number; momentum: number },
): number {
  let totalWeight = weights.engagement;
  let weightedSum = scores.engagement * weights.engagement;

  if (scores.sentiment !== null && weights.sentiment > 0) {
    totalWeight += weights.sentiment;
    weightedSum += scores.sentiment * weights.sentiment;
  }
  if (scores.momentum !== null && weights.momentum > 0) {
    totalWeight += weights.momentum;
    weightedSum += scores.momentum * weights.momentum;
  }

  if (totalWeight === 0) return scores.engagement;
  return Math.round(weightedSum / totalWeight);
}
