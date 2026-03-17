import { Grid, Card, CardContent, Typography } from '@mui/material';
import { useGetOperationsDashboardQuery } from '../../store/api/dashboardApi';
import { LoadingState } from '../../components/common/LoadingState';

interface StatCardProps {
  label: string;
  value: number;
  color?: string;
}

function StatCard({ label, value, color }: StatCardProps) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="overline" color="text.secondary">{label}</Typography>
        <Typography variant="h3" color={color ?? 'text.primary'}>{value}</Typography>
      </CardContent>
    </Card>
  );
}

export function OperationsDashboard() {
  const { data, isLoading } = useGetOperationsDashboardQuery();

  if (isLoading) return <LoadingState />;
  const d = data?.data;

  return (
    <>
      <Typography variant="h5" mb={3}>Operations Dashboard</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Total Accounts" value={d?.total_accounts ?? 0} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Total Contacts" value={d?.total_contacts ?? 0} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Accounts Without Contacts"
            value={d?.accounts_without_contacts ?? 0}
            color="warning.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Inactive Accounts (30d)"
            value={d?.inactive_accounts_30d ?? 0}
            color="error.main"
          />
        </Grid>
      </Grid>
    </>
  );
}
