import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Divider,
  Tooltip,
} from '@mui/material';
import { CheckCircle, DeleteOutline } from '@mui/icons-material';
import { useGetAlertsQuery, useMarkReadMutation, useDismissAlertMutation } from '../../store/api/alertsApi';
import { LoadingState } from '../../components/common/LoadingState';

type AlertType = 'all' | 'health_drop' | 'activity_gap' | 'single_contact' | 'follow_up_due';
type Severity = 'all' | 'low' | 'medium' | 'high' | 'critical';

const SEVERITY_COLOR: Record<string, 'error' | 'warning' | 'info' | 'default'> = {
  critical: 'error',
  high: 'error',
  medium: 'warning',
  low: 'info',
};

const TYPE_LABELS: Record<string, string> = {
  health_drop: 'Health Drop',
  activity_gap: 'Activity Gap',
  single_contact: 'Single Contact',
  follow_up_due: 'Follow-up Due',
};

export function AlertsPage() {
  const { data, isLoading } = useGetAlertsQuery();
  const [markRead] = useMarkReadMutation();
  const [dismiss] = useDismissAlertMutation();

  const [typeFilter, setTypeFilter] = useState<AlertType>('all');
  const [severityFilter, setSeverityFilter] = useState<Severity>('all');

  if (isLoading) return <LoadingState />;

  const allAlerts: any[] = data?.data?.alerts ?? [];

  const filtered = allAlerts.filter((a) => {
    if (typeFilter !== 'all' && a.type !== typeFilter) return false;
    if (severityFilter !== 'all' && a.severity !== severityFilter) return false;
    return true;
  });

  return (
    <>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Alerts</Typography>
        <Chip label={`${data?.data?.unread_count ?? 0} unread`} color="error" variant="outlined" />
      </Box>

      <Stack direction="row" spacing={2} mb={3}>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Type</InputLabel>
          <Select
            label="Type"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as AlertType)}
          >
            <MenuItem value="all">All Types</MenuItem>
            <MenuItem value="health_drop">Health Drop</MenuItem>
            <MenuItem value="activity_gap">Activity Gap</MenuItem>
            <MenuItem value="single_contact">Single Contact</MenuItem>
            <MenuItem value="follow_up_due">Follow-up Due</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Severity</InputLabel>
          <Select
            label="Severity"
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as Severity)}
          >
            <MenuItem value="all">All Severities</MenuItem>
            <MenuItem value="critical">Critical</MenuItem>
            <MenuItem value="high">High</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="low">Low</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {filtered.length === 0 ? (
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="center" py={4}>
              <Typography color="text.secondary">No alerts match the current filters.</Typography>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={1}>
          {filtered.map((alert) => (
            <Card
              key={alert.id}
              sx={{
                bgcolor: alert.is_read ? 'background.paper' : 'action.hover',
                cursor: 'pointer',
              }}
              onClick={() => { if (!alert.is_read) markRead(alert.id); }}
            >
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box flex={1}>
                    <Box display="flex" gap={1} alignItems="center" mb={0.5} flexWrap="wrap">
                      <Typography variant="subtitle2">{alert.title}</Typography>
                      <Chip
                        label={alert.severity}
                        size="small"
                        color={SEVERITY_COLOR[alert.severity] ?? 'default'}
                      />
                      {alert.type && (
                        <Chip
                          label={TYPE_LABELS[alert.type] ?? alert.type}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                    <Typography variant="body2" color="text.secondary">{alert.message}</Typography>
                    <Box display="flex" gap={2} mt={0.5} flexWrap="wrap">
                      {alert.account_name && (
                        <Typography variant="caption" color="text.secondary">
                          Account: {alert.account_name}
                        </Typography>
                      )}
                      <Typography variant="caption" color="text.secondary">
                        {new Date(alert.created_at).toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                  <Box display="flex" gap={0.5} ml={1}>
                    {!alert.is_read && (
                      <Tooltip title="Mark as read">
                        <IconButton
                          size="small"
                          onClick={(e) => { e.stopPropagation(); markRead(alert.id); }}
                        >
                          <CheckCircle fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Dismiss">
                      <IconButton
                        size="small"
                        onClick={(e) => { e.stopPropagation(); dismiss(alert.id); }}
                      >
                        <DeleteOutline fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </CardContent>
              <Divider />
            </Card>
          ))}
        </Stack>
      )}
    </>
  );
}
