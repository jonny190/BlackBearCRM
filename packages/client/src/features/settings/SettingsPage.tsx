import { useState } from 'react';
import { Box, Tabs, Tab, Typography } from '@mui/material';
import { useAuth } from '../../hooks/useAuth';
import { ProfileTab } from './ProfileTab';
import { SecurityTab } from './SecurityTab';
import { UserManagementTab } from './UserManagementTab';

interface TabPanelProps {
  children: React.ReactNode;
  value: number;
  index: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  if (value !== index) return null;
  return <Box pt={3}>{children}</Box>;
}

export function SettingsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [tab, setTab] = useState(0);

  return (
    <>
      <Typography variant="h5" mb={2}>Settings</Typography>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tab} onChange={(_e, v) => setTab(v)}>
          <Tab label="Profile" />
          <Tab label="Security" />
          {isAdmin && <Tab label="User Management" />}
        </Tabs>
      </Box>
      <TabPanel value={tab} index={0}>
        <ProfileTab />
      </TabPanel>
      <TabPanel value={tab} index={1}>
        <SecurityTab />
      </TabPanel>
      {isAdmin && (
        <TabPanel value={tab} index={2}>
          <UserManagementTab />
        </TabPanel>
      )}
    </>
  );
}
