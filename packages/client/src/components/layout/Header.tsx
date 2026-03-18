import { AppBar, Toolbar, IconButton, Typography, Box } from '@mui/material';
import { Menu as MenuIcon, Logout } from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { AlertBell } from '../../features/alerts/components/AlertBell';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const { user, logout } = useAuth();

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <IconButton color="inherit" onClick={onToggleSidebar} edge="start" sx={{ mr: 2 }}>
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>Black Pear CRM</Typography>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="body2">{user?.first_name} {user?.last_name}</Typography>
          <AlertBell />
          <IconButton color="inherit" onClick={logout}><Logout /></IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
