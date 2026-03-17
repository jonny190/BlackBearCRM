import { Card, CardContent, Typography, Box } from '@mui/material';
import { TrendingUp, TrendingDown, TrendingFlat } from '@mui/icons-material';

const COLOR_MAP: Record<string, string> = { green: '#4caf50', yellow: '#ff9800', orange: '#f57c00', red: '#f44336', gray: '#9e9e9e' };
const TREND = { up: <TrendingUp />, down: <TrendingDown />, flat: <TrendingFlat /> };

export function HealthScoreCard({ score, color, trend }: { score: number | null; color: string; trend: string }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="overline">Health Score</Typography>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="h2" sx={{ color: COLOR_MAP[color] ?? '#9e9e9e' }}>
            {score ?? '--'}
          </Typography>
          <Box sx={{ color: COLOR_MAP[color] }}>{TREND[trend as keyof typeof TREND]}</Box>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {score !== null && score >= 80 ? 'Healthy' : score !== null && score >= 60 ? 'Needs attention' : score !== null && score >= 40 ? 'At risk' : score !== null ? 'Critical' : 'No data'}
        </Typography>
      </CardContent>
    </Card>
  );
}
