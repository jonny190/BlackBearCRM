import { calculateEngagementScore, calculateTrend, getHealthColor } from './health.calculator.js';
import type { Activity } from '@blackbear/shared';
import { ActivityType, AccountTier } from '@blackbear/shared';

// Fixed reference date for deterministic tests
const NOW = new Date('2026-03-16T12:00:00Z');

function daysAgo(days: number): string {
  const d = new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000);
  return d.toISOString();
}

function makeActivity(type: ActivityType, daysAgoVal: number): Activity {
  return {
    id: `act-${Math.random()}`,
    account_id: 'acct-1',
    contact_id: null,
    user_id: 'user-1',
    type,
    title: 'Test activity',
    description: null,
    occurred_at: daysAgo(daysAgoVal),
    metadata: {},
    created_at: daysAgo(daysAgoVal),
    updated_at: daysAgo(daysAgoVal),
  };
}

// ---------------------------------------------------------------------------
// calculateEngagementScore
// ---------------------------------------------------------------------------

describe('calculateEngagementScore', () => {
  it('returns 0 when there are no activities', () => {
    const score = calculateEngagementScore([], AccountTier.SMB, NOW);
    expect(score).toBe(0);
  });

  it('applies full multiplier (1.0) for activities within 7 days', () => {
    // SMB target = 20, meeting = 10 points -> 10/20*100 = 50
    const activities = [makeActivity(ActivityType.MEETING, 3)];
    const score = calculateEngagementScore(activities, AccountTier.SMB, NOW);
    expect(score).toBe(50);
  });

  it('applies 0.75 multiplier for activities between 7 and 14 days', () => {
    // SMB target = 20, meeting = 10 * 0.75 = 7.5 -> 7.5/20*100 = 37.5
    const activities = [makeActivity(ActivityType.MEETING, 10)];
    const score = calculateEngagementScore(activities, AccountTier.SMB, NOW);
    expect(score).toBe(37.5);
  });

  it('applies 0.5 multiplier for activities between 14 and 21 days', () => {
    // SMB target = 20, meeting = 10 * 0.5 = 5 -> 5/20*100 = 25
    const activities = [makeActivity(ActivityType.MEETING, 18)];
    const score = calculateEngagementScore(activities, AccountTier.SMB, NOW);
    expect(score).toBe(25);
  });

  it('applies 0.25 multiplier for activities between 21 and 30 days', () => {
    // SMB target = 20, meeting = 10 * 0.25 = 2.5 -> 2.5/20*100 = 12.5
    const activities = [makeActivity(ActivityType.MEETING, 25)];
    const score = calculateEngagementScore(activities, AccountTier.SMB, NOW);
    expect(score).toBe(12.5);
  });

  it('ignores activities older than 30 days', () => {
    const activities = [makeActivity(ActivityType.MEETING, 31)];
    const score = calculateEngagementScore(activities, AccountTier.SMB, NOW);
    expect(score).toBe(0);
  });

  it('caps score at 100', () => {
    // Lots of meetings within 7 days
    const activities = Array.from({ length: 20 }, () => makeActivity(ActivityType.MEETING, 1));
    const score = calculateEngagementScore(activities, AccountTier.SMB, NOW);
    expect(score).toBe(100);
  });

  it('sums multiple activities correctly', () => {
    // MEETING (day 3) = 10 * 1.0 = 10
    // CALL (day 3)    =  5 * 1.0 =  5
    // EMAIL (day 3)   =  3 * 1.0 =  3
    // Total = 18, target = 20 -> 90
    const activities = [
      makeActivity(ActivityType.MEETING, 3),
      makeActivity(ActivityType.CALL, 3),
      makeActivity(ActivityType.EMAIL, 3),
    ];
    const score = calculateEngagementScore(activities, AccountTier.SMB, NOW);
    expect(score).toBe(90);
  });

  it('uses ENTERPRISE tier target points', () => {
    // Enterprise target = 60, meeting = 10 -> 10/60*100 ~= 16.67
    const activities = [makeActivity(ActivityType.MEETING, 3)];
    const score = calculateEngagementScore(activities, AccountTier.ENTERPRISE, NOW);
    expect(score).toBeCloseTo(16.67, 1);
  });

  it('uses MID_MARKET tier target points', () => {
    // MidMarket target = 40, meeting = 10 -> 10/40*100 = 25
    const activities = [makeActivity(ActivityType.MEETING, 3)];
    const score = calculateEngagementScore(activities, AccountTier.MID_MARKET, NOW);
    expect(score).toBe(25);
  });
});

// ---------------------------------------------------------------------------
// calculateTrend
// ---------------------------------------------------------------------------

describe('calculateTrend', () => {
  it('returns "up" when improvement is >= 5', () => {
    expect(calculateTrend(80, 75)).toBe('up');
    expect(calculateTrend(80, 70)).toBe('up');
  });

  it('returns "down" when decline is >= 5', () => {
    expect(calculateTrend(70, 75)).toBe('down');
    expect(calculateTrend(60, 80)).toBe('down');
  });

  it('returns "flat" when change is within ±5', () => {
    expect(calculateTrend(75, 75)).toBe('flat');
    expect(calculateTrend(76, 75)).toBe('flat');
    expect(calculateTrend(74, 75)).toBe('flat');
    expect(calculateTrend(79, 75)).toBe('flat');
    expect(calculateTrend(71, 75)).toBe('flat');
  });

  it('returns "up" exactly at +5 boundary', () => {
    expect(calculateTrend(80, 75)).toBe('up');
  });

  it('returns "down" exactly at -5 boundary', () => {
    expect(calculateTrend(70, 75)).toBe('down');
  });
});

// ---------------------------------------------------------------------------
// getHealthColor
// ---------------------------------------------------------------------------

describe('getHealthColor', () => {
  it('returns "green" for score >= 80', () => {
    expect(getHealthColor(80)).toBe('green');
    expect(getHealthColor(100)).toBe('green');
    expect(getHealthColor(95)).toBe('green');
  });

  it('returns "yellow" for score >= 60 and < 80', () => {
    expect(getHealthColor(60)).toBe('yellow');
    expect(getHealthColor(79)).toBe('yellow');
    expect(getHealthColor(70)).toBe('yellow');
  });

  it('returns "orange" for score >= 40 and < 60', () => {
    expect(getHealthColor(40)).toBe('orange');
    expect(getHealthColor(59)).toBe('orange');
    expect(getHealthColor(50)).toBe('orange');
  });

  it('returns "red" for score below 40', () => {
    expect(getHealthColor(39)).toBe('red');
    expect(getHealthColor(0)).toBe('red');
    expect(getHealthColor(20)).toBe('red');
  });
});
