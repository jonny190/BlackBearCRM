import { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  ResponsiveContainer,
} from 'recharts';
import {
  useGetHealthDistributionQuery,
  useGetActivityTrendsQuery,
  useGetTierBreakdownQuery,
  useGetTopAccountsQuery,
  useGetEngagementByTierQuery,
} from '../../store/api/reportsApi';

const HEALTH_COLORS = {
  healthy: '#4caf50',
  needsAttention: '#ff9800',
  atRisk: '#f44336',
  critical: '#9c27b0',
  noData: '#9e9e9e',
};

const HEALTH_LABELS: Record<string, string> = {
  healthy: 'Healthy',
  needsAttention: 'Needs Attention',
  atRisk: 'At Risk',
  critical: 'Critical',
  noData: 'No Data',
};

const TIER_COLORS = ['#1976d2', '#388e3c', '#f57c00'];

const ACTIVITY_LINE_COLORS: Record<string, string> = {
  call: '#1976d2',
  email: '#388e3c',
  meeting: '#f57c00',
  note: '#7b1fa2',
  demo: '#e91e63',
};

function ChartCard({ title, children, minHeight = 300 }: { title: string; children: React.ReactNode; minHeight?: number }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" mb={2}>{title}</Typography>
        <Box minHeight={minHeight}>{children}</Box>
      </CardContent>
    </Card>
  );
}

function ChartLoading() {
  return (
    <Box display="flex" justifyContent="center" alignItems="center" height={200}>
      <CircularProgress />
    </Box>
  );
}

export function ReportsPage() {
  const [trendDays, setTrendDays] = useState<number>(30);
  const { data: healthData, isLoading: healthLoading } = useGetHealthDistributionQuery();
  const { data: trendsData, isLoading: trendsLoading } = useGetActivityTrendsQuery(trendDays);
  const { data: tierData, isLoading: tierLoading } = useGetTierBreakdownQuery();
  const { data: topData, isLoading: topLoading } = useGetTopAccountsQuery();
  const { data: engagementData, isLoading: engagementLoading } = useGetEngagementByTierQuery();

  // Transform health distribution into pie chart data
  const healthDist = healthData?.data ?? {};
  const healthChartData = Object.entries(healthDist)
    .filter(([, value]) => (value as number) > 0)
    .map(([key, value]) => ({
      name: HEALTH_LABELS[key] ?? key,
      value: value as number,
      color: HEALTH_COLORS[key as keyof typeof HEALTH_COLORS] ?? '#9e9e9e',
    }));

  // Transform tier breakdown into pie chart data
  const tierChartData = (tierData?.data ?? []).map((t: any, i: number) => ({
    name: t.tier ?? 'Unknown',
    value: Number(t.count),
    color: TIER_COLORS[i % TIER_COLORS.length],
  }));

  // Transform activity trends - pivot by type for line chart
  const rawTrends: any[] = trendsData?.data ?? [];
  const trendsByDay: Record<string, Record<string, string | number>> = {};
  const activityTypes = new Set<string>();
  for (const row of rawTrends) {
    const day = new Date(row.day).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    if (!trendsByDay[day]) trendsByDay[day] = { day };
    trendsByDay[day][row.type] = Number(row.count);
    activityTypes.add(row.type);
  }
  const trendsChartData = Object.values(trendsByDay);

  // Transform engagement by tier for bar chart
  const engagementChartData = (engagementData?.data ?? []).map((e: any) => ({
    tier: e.tier ?? 'Unknown',
    avg_score: Math.round(Number(e.avg_score ?? 0)),
    count: Number(e.count),
  }));

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    if (score >= 40) return 'error';
    return 'error';
  };

  return (
    <>
      <Typography variant="h5" mb={3}>Reports and Analytics</Typography>

      <Grid container spacing={3}>
        {/* Health Distribution */}
        <Grid item xs={12} md={6}>
          <ChartCard title="Account Health Distribution">
            {healthLoading ? <ChartLoading /> : (
              healthChartData.length === 0 ? (
                <Box display="flex" justifyContent="center" alignItems="center" height={200}>
                  <Typography color="text.secondary">No health data available</Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={healthChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {healthChartData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )
            )}
          </ChartCard>
        </Grid>

        {/* Tier Breakdown */}
        <Grid item xs={12} md={6}>
          <ChartCard title="Accounts by Tier">
            {tierLoading ? <ChartLoading /> : (
              tierChartData.length === 0 ? (
                <Box display="flex" justifyContent="center" alignItems="center" height={200}>
                  <Typography color="text.secondary">No tier data available</Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={tierChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {tierChartData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )
            )}
          </ChartCard>
        </Grid>

        {/* Activity Trends */}
        <Grid item xs={12}>
          <ChartCard title="Activity Trends" minHeight={320}>
            <Box display="flex" justifyContent="flex-end" mb={2}>
              <ToggleButtonGroup
                size="small"
                value={trendDays}
                exclusive
                onChange={(_e, v) => { if (v !== null) setTrendDays(v); }}
              >
                <ToggleButton value={7}>7 days</ToggleButton>
                <ToggleButton value={30}>30 days</ToggleButton>
                <ToggleButton value={90}>90 days</ToggleButton>
              </ToggleButtonGroup>
            </Box>
            {trendsLoading ? <ChartLoading /> : (
              trendsChartData.length === 0 ? (
                <Box display="flex" justifyContent="center" alignItems="center" height={200}>
                  <Typography color="text.secondary">No activity data for this period</Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={trendsChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    {Array.from(activityTypes).map((type) => (
                      <Line
                        key={type}
                        type="monotone"
                        dataKey={type}
                        stroke={ACTIVITY_LINE_COLORS[type] ?? '#607d8b'}
                        dot={false}
                        strokeWidth={2}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              )
            )}
          </ChartCard>
        </Grid>

        {/* Engagement by Tier */}
        <Grid item xs={12} md={6}>
          <ChartCard title="Average Health Score by Tier">
            {engagementLoading ? <ChartLoading /> : (
              engagementChartData.length === 0 ? (
                <Box display="flex" justifyContent="center" alignItems="center" height={200}>
                  <Typography color="text.secondary">No engagement data available</Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={engagementChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="tier" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip
                      formatter={(value, name) =>
                        name === 'avg_score' ? [`${value}`, 'Avg Score'] : [value, 'Count']
                      }
                    />
                    <Legend />
                    <Bar dataKey="avg_score" name="Avg Health Score" fill="#1976d2" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )
            )}
          </ChartCard>
        </Grid>

        {/* Lowest Health Accounts */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" mb={2}>Lowest Health Accounts</Typography>
              {topLoading ? <ChartLoading /> : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Account</TableCell>
                        <TableCell>Tier</TableCell>
                        <TableCell>Industry</TableCell>
                        <TableCell align="center">Health Score</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(topData?.data ?? []).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} align="center">
                            <Typography color="text.secondary" variant="body2">No data available</Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        (topData?.data ?? []).map((account: any) => (
                          <TableRow key={account.account_id} hover>
                            <TableCell>{account.name}</TableCell>
                            <TableCell>
                              <Chip label={account.tier ?? 'N/A'} size="small" variant="outlined" />
                            </TableCell>
                            <TableCell>{account.industry ?? 'N/A'}</TableCell>
                            <TableCell align="center">
                              <Chip
                                label={account.overall_score}
                                size="small"
                                color={getHealthColor(account.overall_score)}
                              />
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
}
