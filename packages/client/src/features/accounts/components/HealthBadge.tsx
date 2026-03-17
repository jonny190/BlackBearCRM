import { Chip } from '@mui/material';
import { TrendingUp, TrendingDown, TrendingFlat } from '@mui/icons-material';

const COLOR_MAP: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  green: 'success', yellow: 'warning', orange: 'warning', red: 'error', gray: 'default',
};

const TREND_ICON = { up: <TrendingUp fontSize="small" />, down: <TrendingDown fontSize="small" />, flat: <TrendingFlat fontSize="small" /> };

export function HealthBadge({ score, color, trend }: { score: number | null; color: string; trend: string }) {
  if (score === null) return <Chip label="No data" size="small" />;
  return (
    <Chip
      label={score}
      color={COLOR_MAP[color] ?? 'default'}
      size="small"
      icon={TREND_ICON[trend as keyof typeof TREND_ICON]}
    />
  );
}
