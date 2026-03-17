export interface HealthScore {
  id: string;
  account_id: string;
  overall_score: number;
  engagement_score: number;
  sentiment_score: number | null;
  renewal_score: number | null;
  momentum_score: number | null;
  factors: Record<string, unknown>;
  calculated_at: string;
}

export interface HealthScoreConfig {
  id: string;
  account_tier: string;
  weight_engagement: number;
  weight_sentiment: number;
  weight_renewal: number;
  weight_momentum: number;
  alert_threshold: number;
}

export type HealthTrend = 'up' | 'down' | 'flat';
