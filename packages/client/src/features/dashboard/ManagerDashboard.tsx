import { Grid, Card, CardContent, Typography, List, ListItem, ListItemText, Chip } from '@mui/material';
import { useGetManagerDashboardQuery } from '../../store/api/dashboardApi';
import { LoadingState } from '../../components/common/LoadingState';
import { useNavigate } from 'react-router-dom';

export function ManagerDashboard() {
  const { data, isLoading } = useGetManagerDashboardQuery();
  const navigate = useNavigate();

  if (isLoading) return <LoadingState />;
  const d = data?.data;

  return (
    <>
      <Typography variant="h5" mb={3}>Dashboard</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={4}>
          <Card><CardContent>
            <Typography variant="overline">Total Accounts</Typography>
            <Typography variant="h3">{d?.total_accounts ?? 0}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card><CardContent>
            <Typography variant="overline">At Risk</Typography>
            <Typography variant="h3" color="error">{d?.at_risk_count ?? 0}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card><CardContent>
            <Typography variant="overline">Unread Alerts</Typography>
            <Typography variant="h3" color="warning.main">{d?.alerts?.length ?? 0}</Typography>
          </CardContent></Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card><CardContent>
            <Typography variant="h6" mb={1}>At-Risk Accounts</Typography>
            <List>
              {d?.at_risk_accounts?.map((a: any) => (
                <ListItem
                  key={a.account_id}
                  onClick={() => navigate(`/accounts/${a.account_id}`)}
                  sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                >
                  <ListItemText primary={a.account_name} />
                  <Chip label={a.overall_score} color="error" size="small" />
                </ListItem>
              ))}
            </List>
          </CardContent></Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card><CardContent>
            <Typography variant="h6" mb={1}>Recent Activity</Typography>
            <List>
              {d?.recent_activities?.slice(0, 5).map((a: any) => (
                <ListItem key={a.id}>
                  <ListItemText primary={a.title} secondary={`${a.type} | ${new Date(a.occurred_at).toLocaleDateString()}`} />
                </ListItem>
              ))}
            </List>
          </CardContent></Card>
        </Grid>
      </Grid>
    </>
  );
}
