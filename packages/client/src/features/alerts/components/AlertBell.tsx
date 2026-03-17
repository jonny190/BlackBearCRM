import { IconButton, Badge, Popover } from '@mui/material';
import { Notifications } from '@mui/icons-material';
import { useState } from 'react';
import { useGetAlertsQuery } from '../../../store/api/alertsApi';
import { AlertPanel } from './AlertPanel';

export function AlertBell() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { data } = useGetAlertsQuery();
  const unread = data?.data?.unread_count ?? 0;

  return (
    <>
      <IconButton color="inherit" onClick={(e) => setAnchorEl(e.currentTarget)}>
        <Badge badgeContent={unread} color="error"><Notifications /></Badge>
      </IconButton>
      <Popover open={!!anchorEl} anchorEl={anchorEl} onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <AlertPanel alerts={data?.data?.alerts ?? []} onClose={() => setAnchorEl(null)} />
      </Popover>
    </>
  );
}
