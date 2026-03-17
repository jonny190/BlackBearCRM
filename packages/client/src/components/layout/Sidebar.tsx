import { Drawer, List, ListItemButton, ListItemIcon, ListItemText, Toolbar } from '@mui/material';
import { Dashboard, Business, Settings, NotificationsActive, Assessment, Upload } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';

const DRAWER_WIDTH = 240;

export function Sidebar({ open }: { open: boolean }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state: RootState) => state.auth.user);
  const role: string = user?.role ?? '';
  const isAdminOrLead = role === 'admin' || role === 'team_lead';

  const navItems = [
    { label: 'Dashboard', icon: <Dashboard />, path: '/dashboard', show: true },
    { label: 'Accounts', icon: <Business />, path: '/accounts', show: true },
    { label: 'Alerts', icon: <NotificationsActive />, path: '/alerts', show: true },
    { label: 'Reports', icon: <Assessment />, path: '/reports', show: isAdminOrLead },
    { label: 'Import', icon: <Upload />, path: '/import', show: isAdminOrLead },
    { label: 'Settings', icon: <Settings />, path: '/settings/profile', show: true },
  ];

  return (
    <Drawer variant="persistent" open={open}
      sx={{ width: open ? DRAWER_WIDTH : 0, flexShrink: 0,
        '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' } }}>
      <Toolbar />
      <List>
        {navItems.filter((item) => item.show).map((item) => (
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
