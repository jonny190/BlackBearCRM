import { Box, Toolbar } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import type { RootState } from '../../store/store';
import { toggleSidebar } from '../../store/slices/uiSlice';
import { useSocket } from '../../hooks/useSocket';

export function AppShell() {
  const dispatch = useDispatch();
  const sidebarOpen = useSelector((state: RootState) => state.ui.sidebarOpen);
  useSocket();

  return (
    <Box sx={{ display: 'flex' }}>
      <Header onToggleSidebar={() => dispatch(toggleSidebar())} />
      <Sidebar open={sidebarOpen} />
      <Box component="main" sx={{ flexGrow: 1, p: 3, ml: sidebarOpen ? '240px' : 0, transition: 'margin 0.3s' }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
