import { Drawer, List, ListItemButton, ListItemIcon, ListItemText, Toolbar } from '@mui/material';
import { Dashboard, Business, Settings, NotificationsActive } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
  { label: 'Accounts', icon: <Business />, path: '/accounts' },
  { label: 'Alerts', icon: <NotificationsActive />, path: '/alerts' },
  { label: 'Settings', icon: <Settings />, path: '/settings/profile' },
];

const DRAWER_WIDTH = 240;

export function Sidebar({ open }: { open: boolean }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Drawer variant="persistent" open={open}
      sx={{ width: open ? DRAWER_WIDTH : 0, flexShrink: 0,
        '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' } }}>
      <Toolbar />
      <List>
        {NAV_ITEMS.map((item) => (
          <ListItemButton key={item.path} selected={location.pathname.startsWith(item.path)}
            onClick={() => navigate(item.path)}>
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </Drawer>
  );
}
