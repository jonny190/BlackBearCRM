import {
  Grid,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useGetTeamLeadDashboardQuery } from '../../store/api/dashboardApi';
import { LoadingState } from '../../components/common/LoadingState';

function healthColor(score: number): 'error' | 'warning' | 'success' {
  if (score < 40) return 'error';
  if (score < 60) return 'warning';
  return 'success';
}

export function TeamLeadDashboard() {
  const { data, isLoading } = useGetTeamLeadDashboardQuery();
  const navigate = useNavigate();

  if (isLoading) return <LoadingState />;
  const d = data?.data;

  return (
    <>
      <Typography variant="h5" mb={3}>Team Lead Dashboard</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <Card>
            <CardContent>
              <Typography variant="overline">Total Accounts</Typography>
              <Typography variant="h3">{d?.total_accounts ?? 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Card>
            <CardContent>
              <Typography variant="overline">At Risk</Typography>
              <Typography variant="h3" color="error.main">{d?.at_risk_count ?? 0}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>At-Risk Accounts</Typography>
              {(!d?.at_risk_accounts || d.at_risk_accounts.length === 0) ? (
                <Typography color="text.secondary">No at-risk accounts.</Typography>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Account Name</TableCell>
                        <TableCell>Owner</TableCell>
                        <TableCell align="right">Health Score</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {d.at_risk_accounts.map((a: any) => (
                        <TableRow
                          key={a.account_id}
                          hover
                          sx={{ cursor: 'pointer' }}
                          onClick={() => navigate(`/accounts/${a.account_id}`)}
                        >
                          <TableCell>{a.account_name ?? '(unnamed)'}</TableCell>
                          <TableCell>{a.owner_id ?? '-'}</TableCell>
                          <TableCell align="right">
                            <Chip
                              label={a.overall_score}
                              color={healthColor(a.overall_score)}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
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
