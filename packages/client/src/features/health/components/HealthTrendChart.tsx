import { Card, CardContent, Typography } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface Props {
  history: Array<{ calculated_at: string; overall_score: number }>;
}

export function HealthTrendChart({ history }: Props) {
  const chartData = history.map((h) => ({
    date: new Date(h.calculated_at).toLocaleDateString(),
    score: h.overall_score,
  }));

  return (
    <Card>
      <CardContent>
        <Typography variant="overline" mb={2}>Health Score Trend</Typography>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <ReferenceLine y={80} stroke="#4caf50" strokeDasharray="3 3" label="Healthy" />
            <ReferenceLine y={40} stroke="#f44336" strokeDasharray="3 3" label="At Risk" />
            <Line type="monotone" dataKey="score" stroke="#1a1a2e" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
