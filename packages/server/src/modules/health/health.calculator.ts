import {
  ACTIVITY_POINTS,
  TIER_TARGET_POINTS,
  RECENCY_DECAY,
} from '@blackbear/shared';
import type { Activity, HealthTrend } from '@blackbear/shared';

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
