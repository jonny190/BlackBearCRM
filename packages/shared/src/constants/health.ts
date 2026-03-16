import { ActivityType, AccountTier } from './enums.js';

export const ACTIVITY_POINTS: Record<string, number> = {
  [ActivityType.MEETING]: 10,
  [ActivityType.CALL]: 5,
  [ActivityType.EMAIL]: 3,
  [ActivityType.PROPOSAL]: 8,
  [ActivityType.NOTE]: 1,
  [ActivityType.FOLLOW_UP]: 4,
};

export const TIER_TARGET_POINTS: Record<string, number> = {
  [AccountTier.ENTERPRISE]: 60,
  [AccountTier.MID_MARKET]: 40,
  [AccountTier.SMB]: 20,
};

export const RECENCY_DECAY = [
  { maxDays: 7, multiplier: 1.0 },
  { maxDays: 14, multiplier: 0.75 },
  { maxDays: 21, multiplier: 0.5 },
  { maxDays: 30, multiplier: 0.25 },
];

export const HEALTH_THRESHOLDS = {
  HEALTHY: 80,
  NEEDS_ATTENTION: 60,
  AT_RISK: 40,
} as const;

export const ACTIVITY_GAP_DAYS: Record<string, number> = {
  [AccountTier.ENTERPRISE]: 14,
  [AccountTier.MID_MARKET]: 21,
  [AccountTier.SMB]: 30,
};

export const PROPOSAL_FOLLOW_UP_DAYS = 5;
