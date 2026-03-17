import { Box, List, ListItem, ListItemText, Typography, IconButton, Chip } from '@mui/material';
import { Close, CheckCircle } from '@mui/icons-material';
import { useMarkReadMutation, useDismissAlertMutation } from '../../../store/api/alertsApi';

const SEVERITY_COLOR: Record<string, 'error' | 'warning' | 'info' | 'default'> = {
  critical: 'error', high: 'error', medium: 'warning', low: 'info',
};

export function AlertPanel({ alerts, onClose }: { alerts: any[]; onClose: () => void }) {
  const [markRead] = useMarkReadMutation();
  const [dismiss] = useDismissAlertMutation();

  return (
    <Box sx={{ width: 360, maxHeight: 400, overflow: 'auto' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" px={2} py={1}>
        <Typography variant="h6">Alerts</Typography>
        <IconButton size="small" onClick={onClose}><Close /></IconButton>
      </Box>
      <List dense>
        {alerts.length === 0 && (
          <ListItem><ListItemText primary="No alerts" /></ListItem>
        )}
        {alerts.map((alert) => (
          <ListItem key={alert.id} secondaryAction={
            <IconButton size="small" onClick={() => dismiss(alert.id)}><CheckCircle fontSize="small" /></IconButton>
          } onClick={() => markRead(alert.id)} sx={{ cursor: 'pointer', bgcolor: alert.is_read ? 'inherit' : 'action.hover' }}>
            <ListItemText
              primary={<Box display="flex" gap={1} alignItems="center">
                {alert.title} <Chip label={alert.severity} size="small" color={SEVERITY_COLOR[alert.severity] ?? 'default'} />
              </Box>}
              secondary={alert.message}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
